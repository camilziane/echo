from fastapi import FastAPI, UploadFile, File
import base64
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from glob import glob
import json
from fastapi.responses import JSONResponse
from typing import List, Dict
import os
from groq import Groq
from dotenv import load_dotenv
import logging
from datetime import datetime
from fastapi import Body, HTTPException
from rag import router as rag_router
from quiz import router as quiz_router
from rag import add_document
from typing import Optional
import uuid
from quiz import *
from rag import generate_title
import uuid

# Add this at the beginning of your app.py file
if not os.path.exists("data"):
    os.makedirs("data")

# Initialisation de l'application FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
    ],  # Autoriser seulement ton frontend React
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
    owner: int
    id: str
    text: str


class NewMemory(BaseModel):
    owner: int
    images: List[str] = []
    text: str


class Memory(BaseModel):
    id: int
    owner: int
    name: str
    date: str
    images: List[str]
    texts: List[Text]


def get_profiles_data():
    profiles = []
    for profile in glob("data/profiles/*"):
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
            name = os.path.basename(text_path).split(".json")[0]
            for id, text in json.load(text_file).items():
                texts.append(Text(owner=int(name), id=id, text=text))

    memory = Memory(
        id=memory_id,
        owner=metadata["owner"],
        name=metadata["name"],
        date=metadata["date"],
        images=encoded_images,
        texts=texts,
    )
    return memory


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

    name = generate_title(new_memory.text)
    # Save metadata
    metadata = {
        "owner": new_memory.owner,
        "name": name,
        "date": datetime.now().strftime("%Y-%m-%d"),
    }
    with open(f"{memory_dir}/metadata.json", "w") as f:
        json.dump(metadata, f)

    # Save images
    for i, image_data in enumerate(new_memory.images):
        image_bytes = base64.b64decode(image_data)
        with open(f"{memory_dir}/images/image_{i+1}.png", "wb") as f:
            f.write(image_bytes)

    # Save texts
    with open(f"{memory_dir}/texts/{new_memory.owner}.json", "w") as f:
        memory = {str(uuid.uuid4()): new_memory.text}
        f.write(json.dumps(memory))

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


# Charger les variables d'environnement
load_dotenv()

# Configuration de logging
logging.basicConfig(
    level=logging.INFO,  # Niveau de journalisation
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # Format des messages
    handlers=[
        logging.FileHandler("app.log"),  # Enregistrer les logs dans un fichier
        logging.StreamHandler(),  # Afficher les logs dans la console
    ],
)

logger = logging.getLogger(__name__)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
    ],  # Assurez-vous que c'est l'URL de votre frontend
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)

load_dotenv()

# Configuration de logging
logging.basicConfig(
    level=logging.INFO,  # Niveau de journalisation
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # Format des messages
    handlers=[
        logging.FileHandler("app.log"),  # Enregistrer les logs dans un fichier
        logging.StreamHandler(),  # Afficher les logs dans la console
    ],
)

logger = logging.getLogger(__name__)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
    ],  # Autoriser seulement votre frontend React
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)

# Initialisation du client Groq
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# Modèles de données
class Transcription(BaseModel):
    transcription: str


class NewTranscription(BaseModel):
    audio_data: str  # Base64 encodé


# Fonction pour sauvegarder et traiter le fichier audio
def save_audio_file(audio: UploadFile, save_path: str):
    try:
        with open(save_path, "wb") as buffer:
            content = audio.file.read()
            buffer.write(content)
        logger.info(f"Fichier audio sauvegardé : {save_path}")
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier audio : {str(e)}")
        raise e


# Endpoint pour la transcription
@app.post("/transcribe", response_model=Transcription)
async def transcribe(audio: UploadFile = File(...)):
    logger.info("Requête de transcription reçue")
    if not audio:
        logger.warning("Aucun fichier audio trouvé")
        return JSONResponse(
            status_code=400, content={"error": "Aucun fichier audio trouvé"}
        )

    # Vérifier le type MIME
    if audio.content_type not in ["audio/mp3", "audio/mpeg"]:
        logger.warning(f"Type de fichier non pris en charge: {audio.content_type}")
        return JSONResponse(
            status_code=400,
            content={"error": "Type de fichier audio non pris en charge."},
        )

    try:
        # Sauvegarder le fichier temporairement
        temp_dir = "./tmp/"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, audio.filename)
        save_audio_file(audio, temp_path)

        # Effectuer la transcription avec Groq
        with open(temp_path, "rb") as f:
            logger.info("Envoi du fichier audio au client Groq pour transcription")
            transcription = client.audio.transcriptions.create(
                file=f,
                model="whisper-large-v3-turbo",  # Assurez-vous que le modèle est correct
            )

        logger.info("Transcription réussie")

        # Supprimer le fichier temporaire
        os.remove(temp_path)
        logger.info(f"Fichier temporaire supprimé : {temp_path}")

        return Transcription(transcription=transcription.text)
    except Exception as e:
        logger.error(f"Erreur lors de la transcription : {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/memories/{memory_id}/texts", response_model=dict)
def add_text_to_memory(memory_id: int, text: str = Body(...), user_id: int = Body(...)):
    memory_dir = f"data/memories/{memory_id}"
    texts_dir = f"{memory_dir}/texts"

    # Ensure the directory structure exists
    os.makedirs(texts_dir, exist_ok=True)

    file_path = f"{texts_dir}/{user_id}.json"
    texts = {}
    text_uuid = str(uuid.uuid4())
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            texts = json.load(f)

    texts[text_uuid] = text

    with open(file_path, "w") as f:
        json.dump(texts, f, indent=2)

    add_document(text)
    return {"status": "Text added to memory", "id": text_uuid}


# Add this Pydantic model for quiz results
class QuizResult(BaseModel):
    id: str
    type: str
    score: int
    total_questions: int
    date: str


# Update the finish-quiz endpoint
@app.post("/finish-quiz")
async def finish_quiz(quiz_result: QuizResult):
    # Ensure the data directory exists
    os.makedirs("data", exist_ok=True)

    # Load existing quiz history
    try:
        with open("data/quiz_history.json", "r") as f:
            quiz_history = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        quiz_history = []

    # Add new quiz result
    quiz_history.append(quiz_result.dict())

    # Save updated quiz history
    with open("data/quiz_history.json", "w") as f:
        json.dump(quiz_history, f)

    return {"status": "Quiz results saved successfully"}


# Update the get-quiz-history endpoint
@app.get("/quiz-history", response_model=List[QuizResult])
async def get_quiz_history():
    try:
        with open("data/quiz_history.json", "r") as f:
            quiz_history = json.load(f)
    except FileNotFoundError:
        return []  # Return an empty list if the file doesn't exist
    except json.JSONDecodeError:
        return []  # Return an empty list if the file is empty or contains invalid JSON

    # Sort by date (newest first) and take the top 5
    sorted_history = sorted(quiz_history, key=lambda x: x["date"], reverse=True)[:5]

    return sorted_history


class MemberStats(BaseModel):
    misrecognitions: int
    totalTime: float
    attempts: int


@app.post("/update-member-stats")
async def update_member_stats(new_stats: Dict[str, MemberStats]):
    try:
        # Read existing stats
        try:
            with open("data/member_stats.json", "r") as f:
                existing_stats = json.load(f)
        except FileNotFoundError:
            existing_stats = {}

        # Update existing stats with new stats
        for member, stats in new_stats.items():
            if member not in existing_stats:
                existing_stats[member] = stats.dict()
            else:
                existing_stats[member]["misrecognitions"] += stats.misrecognitions
                existing_stats[member]["totalTime"] += stats.totalTime
                existing_stats[member]["attempts"] += stats.attempts

        # Write updated stats back to file
        with open("data/member_stats.json", "w") as f:
            json.dump(existing_stats, f)

        return {"status": "Member stats updated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update member stats: {str(e)}"
        )


@app.get("/member-stats")
async def get_member_stats():
    try:
        with open("data/member_stats.json", "r") as f:
            stats = json.load(f)
        return stats
    except FileNotFoundError:
        return {}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve member stats: {str(e)}"
        )


app.include_router(rag_router)
app.include_router(quiz_router)
