import os
from dotenv import load_dotenv
from langchain_fireworks import ChatFireworks
from PIL import Image
from PIL.ExifTags import TAGS
import json
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any

load_dotenv()
fireworks_api_key = os.getenv('FIREWORKS_API_KEY')

llm = ChatFireworks(
    fireworks_api_key=fireworks_api_key,
    model="accounts/fireworks/models/mixtral-8x7b-instruct",
)

@dataclass
class Memorie:
    title: Optional[str] = ""
    infos: Dict[str, Any] = field(default_factory=dict)
    paths: List[str] = field(default_factory=list)
    summary: Optional[str] = ""

def preprocess_context(name: str, sentence: str) -> str:
    """
    Replace first-person pronouns and possessive determiners with the provided name.
    """
    prompt = (
        f"My name is {name}.\n"
        "Instructions: Replace all first-person personal pronouns and possessive determiners with "
        f"**{name}'s** in the following sentence. "
        f"If a third-person pronoun refers to {name}, replace it with explicit wording. For example, replace 'his friend' with '{name}'s friend.'\n"
        "Return only the modified sentence without any explanations or additional text.\n"
        f"Sentence to modify:\n{sentence}"
    )
    return llm.invoke(prompt).content.strip()

def get_metadata_from_image(image_path: str) -> Dict[str, Any]:
    """
    Extract EXIF metadata from the given image.
    """
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data:
            return {"error": "No EXIF metadata found."}
        
        metadata = {}
        for tag, value in exif_data.items():
            tag_name = TAGS.get(tag, tag)
            metadata[tag_name] = value
        
        return metadata
    except Exception as e:
        return {"error": str(e)}

def process_image(image_path: str) -> Dict[str, Any]:
    """
    Generate a detailed description of the image based on its metadata.
    """
    metadata = get_metadata_from_image(image_path)
    if "error" in metadata:
        return {"error": metadata["error"]}
    
    prompt = (
        "Instructions: Based on the following image metadata, provide a detailed and informative description of the image. "
        "Include information about the ambiance, context, objects present, dominant colors, and any other relevant details you can infer from the provided data.\n\n"
        "Image Metadata:\n"
    )
    for key, value in metadata.items():
        prompt += f"- **{key}**: {value}\n"
    
    prompt += "\n**Image Description:**"
    
    description = llm.invoke(prompt).content.strip()
    
    return {
        "description": description,
        "metadata": metadata
    }

def process_description(description: str) -> Dict[str, Any]:
    """
    Generate a title and keywords from the memory description.
    """
    prompt = (
        "Instructions: From the following memory description, generate a relevant title and identify key themes or elements. "
        "Provide the output in a structured JSON format with two fields: 'title' and 'keywords'.\n\n"
        "Memory Description:\n"
        f"{description}\n\n"
        "Output Format:\n"
        "{\n"
        '  "title": "Generated Title",\n'
        '  "keywords": ["keyword1", "keyword2", "keyword3"]\n'
        "}"
    )
    
    response = llm.invoke(prompt).content.strip()
    
    try:
        # Attempt to parse the response as JSON
        parsed_response = json.loads(response)
    except json.JSONDecodeError:
        # If parsing fails, return the raw response with an error
        parsed_response = {
            "error": "Failed to parse the LLM response. Ensure the LLM returns valid JSON.",
            "raw_response": response
        }
    
    return parsed_response

def process_memorie(name: str,image_path: Optional[str] = None, description: Optional[str] = None) -> Memorie:
    """
    Process a memory that may include an image and/or a description.
    
    Args:
        image_path (str, optional): Path to the image file.
        description (str, optional): Text description of the memory.
    
    Returns:
        Memorie: An object containing the title, information, image paths, and a summary of the memory.
    """
    memory = Memorie()
    
    # Process Image if provided
    if image_path:
        image_result = process_image(image_path)
        if "error" not in image_result:
            memory.infos["image_description"] = image_result["description"]
            memory.infos["image_metadata"] = image_result["metadata"]
            memory.paths.append(image_path)
        else:
            memory.infos["image_error"] = image_result["error"]
    
    # Process Description if provided
    if description:
        description_result = process_description(preprocess_context(name, description))
        if "error" not in description_result:
            memory.title = description_result.get("title", "")
            memory.infos["description_keywords"] = description_result.get("keywords", [])
        else:
            memory.infos["description_error"] = description_result["error"]
            memory.infos["raw_description_response"] = description_result.get("raw_response", "")
    
    # Generate Summary
    # Collect all available information to create a comprehensive summary
    summary_prompt = "Instructions: Based on the following information, provide a comprehensive summary of the memory.\n\n"
    
    if memory.title:
        summary_prompt += f"**Title:** {memory.title}\n"
    
    if "image_description" in memory.infos:
        summary_prompt += f"**Image Description:** {memory.infos['image_description']}\n"
    
    if "description_keywords" in memory.infos:
        keywords = ', '.join(memory.infos["description_keywords"])
        summary_prompt += f"**Keywords:** {keywords}\n"
    
    # If there are errors, include them in the summary
    if "image_error" in memory.infos:
        summary_prompt += f"**Image Error:** {memory.infos['image_error']}\n"
    
    if "description_error" in memory.infos:
        summary_prompt += f"**Description Error:** {memory.infos['description_error']}\n"
        summary_prompt += f"**Raw Description Response:** {memory.infos.get('raw_description_response', '')}\n"
    
    summary_prompt += "\n**Memory Summary:**"
    
    summary = llm.invoke(summary_prompt).content.strip()
    memory.summary = summary
    
    return memory

# Example Usage:

# Preprocess Context Examples
print(preprocess_context(
    name="CamilLeBG",
    sentence="My uncle is a good teacher, he loves my dog!"
))
# Expected Output: "CamilLeBG's uncle is a good teacher, CamilLeBG loves CamilLeBG's dog!"

# print(preprocess_context(
#     name="Eithan",
#     sentence="My friend Camil is a great student, but I don't like his favorite football club"
# ))
# Expected Output: "Eithan's friend Camil is a great student, but Eithan doesn't like Eithan's favorite football club"

# print(preprocess_context(
#     name="Kevin",
#     sentence="LA is my favorite city, but my family doesn't live here."
# ))
# Expected Output: "LA is Kevin's favorite city, but Kevin's family doesn't live here."

# Process Memorie Example with Image and Description
# memory = process_memorie(
#     name="Eithan",
#     image_path="back/images_memories/mountain.DNG",
#     description="I spent a sunny afternoon at the top of a mountain, surrounded by lush greenery and a clear blue sky."
# )
# print(json.dumps(memory.__dict__, indent=2))
