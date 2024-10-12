from fastapi import FastAPI
import base64
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from glob import glob
import json
from fastapi.responses import JSONResponse
from typing import List
import os
import logging
from datetime import datetime
from fastapi import Body
from rag import router as rag_router
from quiz import router as quiz_router

# Add this at the beginning of your app.py file
if not os.path.exists("data"):
    os.makedirs("data")

# Initialisation de l'application FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Autoriser seulement ton frontend React
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Modèle Pydantic pour représenter un profil
class Profile(BaseModel):
    id: int
    name: str
    image: str


class Text(BaseModel):
    id: int
    text: str


class NewMemory(BaseModel):
    owner: int
    name: str
    location: str
    date: str
    images: List[str]
    text: str


class Memory(BaseModel):
    id: int
    owner: int
    name: str
    location: str
    date: str
    images: List[str]
    texts: List[Text]


class MemoryPreview(BaseModel):
    id: int
    owner: int
    name: str
    location: str
    date: str
    end_date: str
    image: str


def get_profiles_data():
    profiles = []
    for profile in glob("data/profiles/*.png"):
        with open(profile, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
        profiles.append(
            {
                "id": len(profiles) + 1,
                "name": profile.split("/")[-1].split(".")[0],
                "image": encoded_image,
            }
        )
    return profiles


# Endpoint pour récupérer tous les profils
@app.get("/profiles", response_model=List[Profile])
def get_profiles():
    profiles = get_profiles_data()
    return profiles


def get_memory_data(memory_id) -> Memory:
    metadata = json.load(open(f"data/memories/{memory_id}/metadata.json"))
    texts_paths = glob(f"data/memories/{memory_id}/texts/*")
    image_paths = glob(f"data/memories/{memory_id}/images/*")

    # Read and encode images
    encoded_images = []
    for image_path in image_paths:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
            encoded_images.append(encoded_image)
    # Read text files
    texts = []
    for text_path in texts_paths:
        with open(text_path, "r") as text_file:
            name = os.path.basename(text_path)
            texts.append(Text(id=int(name), text=text_file.read()))

    memory = Memory(
        id=memory_id,
        owner=metadata["owner"],
        name=metadata["name"],
        location=metadata["location"],
        date=metadata["date"],
        images=encoded_images,
        texts=texts,
    )
    return memory


def get_memory_preview(memory_id) -> MemoryPreview:
    metadata = json.load(open(f"data/memories/{memory_id}/metadata.json"))
    image_path = glob(f"data/memories/{memory_id}/images/*")[0]
    with open(image_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
    memory_preview = MemoryPreview(
        id=memory_id,
        owner=metadata["owner"],
        name=metadata["name"],
        location=metadata["location"],
        date=metadata["date"],
        end_date=metadata["end_date"],
        image=encoded_image,
    )
    return memory_preview


def get_memories_previews() -> List[MemoryPreview]:
    memories_previews = []
    for memory in glob("data/memories/*"):
        memory_id = memory.split("/")[-1]
        memories_previews.append(get_memory_preview(memory_id))
    return memories_previews


def get_memories_data() -> List[Memory]:
    memories = []
    for memory in glob("data/memories/*"):
        memories.append(get_memory_data(memory))
    return memories


@app.post("/memories", response_model=Memory)
def create_memory(new_memory: NewMemory):
    # Get the next available memory ID
    existing_memories = glob("data/memories/*")
    new_memory_id = len(existing_memories) + 1

    # Create directory structure
    memory_dir = f"data/memories/{new_memory_id}"
    os.makedirs(f"{memory_dir}/images", exist_ok=True)
    os.makedirs(f"{memory_dir}/texts", exist_ok=True)

    # Save metadata
    metadata = {
        "owner": new_memory.owner,
        "name": new_memory.name,
        "location": new_memory.location,
        "date": new_memory.date,
    }
    with open(f"{memory_dir}/metadata.json", "w") as f:
        json.dump(metadata, f)

    # Save images
    for i, image_data in enumerate(new_memory.images):
        image_bytes = base64.b64decode(image_data)
        with open(f"{memory_dir}/images/image_{i+1}.png", "wb") as f:
            f.write(image_bytes)

    # Save texts
    with open(f"{memory_dir}/texts/{new_memory.owner}", "w") as f:
        f.write(new_memory.text)

    # Return the created memory
    return get_memory_data(new_memory_id)


@app.get("/memories/{memory_id}", response_model=Memory)
def get_memory(memory_id: int):
    try:
        memory = get_memory_data(memory_id)
        return JSONResponse(content=memory.dict())
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"message": "Memory not found"})


@app.get("/memories", response_model=List[Memory])
def get_memories():
    memory_paths = glob("data/memories/*")
    memories = []
    for path in memory_paths:
        memory_id = int(os.path.basename(path))
        try:
            memory = get_memory_data(memory_id)
            memories.append(memory)
        except Exception as e:
            print(f"Error processing memory {memory_id}: {str(e)}")

    return sorted(memories, key=lambda x: x.date, reverse=True)


def add_text_to_memory(memory_id: int, text: str, user_id: int):
    memory_dir = f"data/memories/{memory_id}"
    with open(f"{memory_dir}/texts/{user_id}", "w") as f:
        f.write(text)

    return {"status": "Text added to memory"}


@app.post("/submit-answer")
def submit_answer(question_id: str, success: bool):
    # Log the question_id and success with a logger
    logger.info(f"Question ID: {question_id}, Success: {success}")
    quizs = load_quizs()
    if question_id not in quizs:
        raise HTTPException(status_code=404, detail="Question not found")

    quiz = quizs[question_id]
    if success:
        quiz.success += 1
    else:
        quiz.failure += 1
    save_quizs()
    return {"status": "Question updated"}


def thompson_sampling_quiz_selection(already_selected_quizes: list[uuid]) -> Quiz:
    quizs = load_quizs()
    if not quizs:
        return None

    max_score = float("-inf")
    selected_quiz = None

    for _, quiz in quizs.items():
        if quiz.question_id in already_selected_quizes:
            continue
        sample = beta.rvs(quiz.failure, quiz.success)

        if sample > max_score:
            max_score = sample
            selected_quiz = quiz

    return selected_quiz


@app.get("/generate-thompson-quiz", response_model=Quiz)
def generate_thompson_quiz() -> Quiz:
    return thompson_sampling_quiz_selection()


@app.get("/generate-quiz", response_model=list[Quiz])
async def generate_quiz(epsilon: float = 0, nb_quiz: int = 5):
    quizs = load_quizs()
    if not quizs:
        return None
    generated_quizs = []
    for _ in range(nb_quiz):
        if random.random() < epsilon:
            generated_quizs.append(await generate_random_quiz())
        else:
            quiz = thompson_sampling_quiz_selection(
                [quiz.question_id for quiz in generated_quizs]
            )
            if quiz:
                generated_quizs.append(quiz)
    return generated_quizs


@app.post("/start-quiz")
async def start_quiz():
    quiz_id = str(uuid.uuid4())
    questions = [await generate_quiz() for _ in range(5)]  # Generate 5 questions
    return {"quiz_id": quiz_id, "questions": questions}


@app.post("/finish-quiz")
async def finish_quiz(
    quiz_id: str = Body(...), score: int = Body(...), total_questions: int = Body(...)
):
    # Load existing quiz history
    try:
        with open("data/quiz_history.json", "r") as f:
            content = f.read()
            quiz_history = json.loads(content) if content else []
    except FileNotFoundError:
        quiz_history = []
    except json.JSONDecodeError:
        # If the file exists but contains invalid JSON, start with an empty list
        quiz_history = []

    # Add new quiz result
    quiz_history.append(
        {
            "id": quiz_id,
            "score": score,
            "total_questions": total_questions,
            "date": datetime.now().isoformat(),
        }
    )

    # Save updated quiz history
    with open("data/quiz_history.json", "w") as f:
        json.dump(quiz_history, f)

    return {"status": "Quiz results saved successfully"}


class QuizHistoryEntry(BaseModel):
    id: str
    score: int
    total_questions: int
    date: str


@app.get("/quiz-history", response_model=List[QuizHistoryEntry])
async def get_quiz_history():
    try:
        with open("data/quiz_history.json", "r") as f:
            quiz_history = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Quiz history not found")

    # Sort by date (newest first) and take the top 5
    sorted_history = sorted(quiz_history, key=lambda x: x["date"], reverse=True)[:5]

    return sorted_history


app.include_router(rag_router)
app.include_router(quiz_router)
