from fastapi import FastAPI
import base64
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from glob import glob
import json
from fastapi.responses import JSONResponse
from typing import List


# Initialisation de l'application FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Autoriser seulement ton frontend React
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)


# Modèle Pydantic pour représenter un profil
class Profile(BaseModel):
    id: int
    name: str
    image: str


class Memory(BaseModel):
    id: int
    owner: int
    name: str
    location: str
    start_date: str
    end_date: str
    images: List[str]
    texts: List[str]

class MemoryPreview(BaseModel):
    id: int
    owner: int
    name: str
    location: str
    start_date: str
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
    texts_paths = glob(f"data/memories/{memory_id}/texts/*.txt")
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
            texts.append(text_file.read())
    
    memory = Memory(
        id=memory_id,
        owner=metadata["owner"],
        name=metadata["name"],
        location=metadata["location"],
        start_date=metadata["start_date"],
        end_date=metadata["end_date"],
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
        start_date=metadata["start_date"],
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

@app.get("/memories", response_model=List[MemoryPreview])
def get_memories():
    return get_memories_previews()

@app.get("/memories/{memory_id}", response_model=Memory)
def get_memory(memory_id: int):
    return get_memory_data(memory_id)

@app.get("/memories/{memory_id}")
def get_memory(memory_id: int):
    try:
        memory = get_memory_data(memory_id)
        return JSONResponse(content=memory.dict())
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"message": "Memory not found"})


