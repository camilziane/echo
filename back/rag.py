import os
import getpass
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain_mistralai.embeddings import MistralAIEmbeddings
from langchain_mistralai import ChatMistralAI
from fastapi import FastAPI
from langserve import add_routes
from dotenv import load_dotenv
from langchain_core.documents import Document
from typing import List, Union
from pydantic import BaseModel, Field
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from typing import Dict

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableBranch

from langchain_core.runnables import RunnablePassthrough
from langchain.schema import AIMessage

from fastapi.middleware.cors import CORSMiddleware
from langchain_core.runnables import RunnableLambda



# Load environment variables
load_dotenv()

# Set up the Mistral API credentials
if not os.getenv("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = getpass.getpass("Enter your Mistral API key: ")

# Set up the RAG components
embeddings = MistralAIEmbeddings(model="mistral-embed")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)

# Initialize ChromaDB vectorstore
vectorstore = Chroma(embedding_function=embeddings, collection_name="my-rag-docs", persist_directory="data/rag_vectorstore")

retriever = vectorstore.as_retriever()

# Set up the LLM
llm = ChatMistralAI(model="mistral-small-latest")

# Define the system prompt
SYSTEM_TEMPLATE = """
Answer the user's questions based on the below context. 
If the context doesn't contain any relevant information to the question, don't make something up and just say "I don't know":

<context>
{context}
</context>
"""


question_answering_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            SYSTEM_TEMPLATE,
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

document_chain = create_stuff_documents_chain(llm, question_answering_prompt)


query_transform_prompt = ChatPromptTemplate.from_messages(
    [
        MessagesPlaceholder(variable_name="messages"),
        (
            "user",
            "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation. Only respond with the query, nothing else.",
        ),
    ]
)

query_transforming_retriever_chain = RunnableBranch(
    (
        lambda x: len(x.get("messages", [])) == 1,
        # If only one message, then we just pass that message's content to retriever
        (lambda x: x["messages"][-1].content) | retriever,
    ),
    # If messages, then we pass inputs to LLM chain to transform the query, then pass to retriever
    query_transform_prompt | llm | StrOutputParser() | retriever,
).with_config(run_name="chat_retriever_chain")


def parse_retriever_input(params: Dict):
    return params["messages"][-1].content


conversational_retrieval_chain = (
    RunnablePassthrough.assign(
        context=query_transforming_retriever_chain
    )
    .assign(
        answer=document_chain
    )
    | RunnableLambda(lambda outputs: AIMessage(content=outputs['answer']))
)
# FastAPI application setup
app = FastAPI(
    title="LangChain Server",
    version="1.0",
    description="A simple API server using Langchain's Runnable interfaces",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# API endpoint to add documents to ChromaDB
@app.post("/add_document")
def add_document(text: str):
    """Add a new document to the RAG system."""
    doc = Document(text)
    vectorstore.add_documents([doc])
    return {"status": "Document added successfully"}


# Replace 'some_module' with the actual module name


class InputChat(BaseModel):
    """Input for the chat endpoint."""

    messages: List[Union[HumanMessage, AIMessage, SystemMessage]] = Field(
        ...,
        description="The chat messages representing the current conversation.",
    )


# Add routes to FastAPI for the RAG chain
add_routes(
    app,
    conversational_retrieval_chain.with_types(input_type=InputChat),
    path="/rag",
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8001)
