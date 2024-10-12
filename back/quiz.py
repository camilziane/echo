import random
import json
import os
from glob import glob
import getpass
from langchain_mistralai import ChatMistralAI
from langchain.prompts.prompt import PromptTemplate
from langchain.chains.llm import LLMChain
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

if not os.getenv("MISTRAL_API_KEY"):
    os.environ["MISTRAL_API_KEY"] = getpass.getpass("Enter your Mistral API key: ")

llm = ChatMistralAI(model="mistral-small-latest")


app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Store generated questions
quizs_path = "data/quizs.json"


class Quiz(BaseModel):
    question_id: str
    memory_id: str
    context: str
    question: str
    correct_answer: str
    bad_answer: list[str]
    failure: int
    success: int


def load_quizs() -> dict[str, Quiz]:
    with open(quizs_path, "r") as f:
        quizs = json.load(f)
        quizs = {question_id: Quiz(**quiz) for question_id, quiz in quizs.items()}
    return quizs


quizs = load_quizs()


class MCQuestion(BaseModel):
    question: str = Field(description="The multiple choice question")
    correct_answer: str = Field(description="The correct answer")
    bad_answers: list[str] = Field(description="3 bad answers")


def get_random_memory():
    memory_paths = glob("data/memories/*")
    if not memory_paths:
        raise Exception("Aucun souvenir trouvé")
    random_memory_path = random.choice(memory_paths)
    memory_id = os.path.basename(random_memory_path)

    with open(f"{random_memory_path}/metadata.json", "r") as f:
        metadata = json.load(f)

    text_files = glob(f"{random_memory_path}/texts/*")
    if not text_files:
        raise Exception("Aucun texte trouvé pour ce souvenir")

    with open(random.choice(text_files), "r") as f:
        random_text = f.read()

    return memory_id, metadata, random_text


def generate_mcq(context: str) -> MCQuestion:
    parser = PydanticOutputParser(pydantic_object=MCQuestion)

    prompt = PromptTemplate(
        template="Générez une question à choix multiples avec 4 options basée sur ce contexte.\n\nContexte : {context}\n\n{format_instructions}\n\nQuestion :",
        input_variables=["context"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    chain = LLMChain(llm=llm, prompt=prompt)
    output = chain.run(context)

    parsed_output = parser.parse(output)
    return parsed_output


def save_quizs():
    """save questions to a json file"""
    serializable_quizs = {
        question_id: quiz.dict() for question_id, quiz in quizs.items()
    }
    with open(quizs_path, "w") as f:
        json.dump(serializable_quizs, f, indent=2)

