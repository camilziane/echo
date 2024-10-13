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
from langchain.prompts import PromptTemplate
from langchain.chains.llm import LLMChain
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.runnables import RunnableLambda
from fastapi import APIRouter
from langchain.output_parsers import PydanticOutputParser
import json


router = APIRouter()


# Load environment variables
load_dotenv()


class InputChat(BaseModel):
    """Input for the chat endpoint."""

    messages: List[Union[HumanMessage, AIMessage, SystemMessage]] = Field(
        ...,
        description="The chat messages representing the current conversation.",
    )


# Set up the Mistral API credentials
if not os.getenv("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = getpass.getpass("Enter your Mistral API key: ")

# Set up the RAG components
embeddings = MistralAIEmbeddings(model="mistral-embed")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)

vdb = {
    "vectorstore": Chroma(
        embedding_function=embeddings,
        collection_name="my-rag-docs",
        persist_directory="data/rag_vectorstore",
    ),
}

vdb["retriever"] = vdb["vectorstore"].as_retriever()


def reset_vectorstore():
    """Reset the vector store by deleting all documents."""
    vdb["vectorstore"].delete_collection()
    vdb["vectorstore"] = Chroma(
        embedding_function=embeddings,
        collection_name="my-rag-docs",
        persist_directory="data/rag_vectorstore",
    )
    vdb["retriever"] = vdb["vectorstore"].as_retriever()
    return {"status": "Vector store reset successfully"}


def init_vectorstore_from_memories():
    """Initialize the vector store with all texts from data/memories."""
    memories_dir = "data/memories"
    documents = []

    for memory_folder in os.listdir(memories_dir):
        memory_path = os.path.join(memories_dir, memory_folder)
        if os.path.isdir(memory_path):
            texts_folder = os.path.join(memory_path, "texts")
            if os.path.exists(texts_folder):
                for filename in os.listdir(texts_folder):
                    file_path = os.path.join(texts_folder, filename)
                    if os.path.isfile(file_path) and file_path.endswith(".json"):
                        with open(file_path, "r") as file:
                            texts = json.load(file)
                            for id, text in texts.items():
                                doc = Document(text)
                                documents.append(doc)
    vdb["vectorstore"].add_documents(documents)
    vdb["retriever"] = vdb["vectorstore"].as_retriever()
    return {"status": f"Vector store initialized with {len(documents)} documents"}


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
        (lambda x: x["messages"][-1].content) | vdb["retriever"],
    ),
    # If messages, then we pass inputs to LLM chain to transform the query, then pass to retriever
    query_transform_prompt | llm | StrOutputParser() | vdb["retriever"],
).with_config(run_name="chat_retriever_chain")


def parse_retriever_input(params: Dict):
    return params["messages"][-1].content


conversational_retrieval_chain = RunnablePassthrough.assign(
    context=query_transforming_retriever_chain
).assign(answer=document_chain) | RunnableLambda(
    lambda outputs: AIMessage(content=outputs["answer"])
)


class Title(BaseModel):
    title: str = Field(description="The generated title for the text")



def generate_title(text: str) -> str:
    """
    Generate a title for the given text using a language model.

    Args:
    text (str): The input text to generate a title for.

    Returns:
    str: The generated title.
    """
    # Create a prompt template
    parser = PydanticOutputParser(pydantic_object=Title)

    messages = [
        HumanMessage(content=f"Generate a concise and engaging title for the following text:\n\n{text}\n\n{parser.get_format_instructions()}")
    ]

    response = llm.predict_messages(messages)
    parser = PydanticOutputParser(pydantic_object=Title)
    prompt_template = PromptTemplate(
        input_variables=["text"],
        template="Generate a concise and engaging title for the following text:\n\n{text}\n\nTitle:",
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    try:
        title = parser.parse(response.content)
        print(title)
        return title.title
    except Exception as e:
        print(f"Error parsing response: {e}")
        return ""


# Add these routes to the router
@router.post("/reset_vectorstore")
def api_reset_vectorstore():
    return reset_vectorstore()


@router.post("/init_vectorstore")
def api_init_vectorstore():
    return init_vectorstore_from_memories()


# API endpoint to add documents to ChromaDB
@router.post("/add_document")
def add_document(text: str):
    """Add a new document to the RAG system."""
    doc = Document(text)
    vdb["vectorstore"].add_documents([doc])
    return {"status": "Document added successfully"}


# Replace 'some_module' with the actual module name


# Add routes to FastAPI for the RAG chain
add_routes(
    router,
    conversational_retrieval_chain.with_types(input_type=InputChat),
    path="/rag",
)
