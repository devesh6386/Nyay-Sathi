import json
import os
from typing import Dict, Any
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain.schema.document import Document
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
llm = ChatGroq(
    temperature=0.1,
    model_name="llama-3.1-8b-instant",
    groq_api_key=os.environ.get("GROQ_API_KEY")
)

# Initialize Embeddings
embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

# Create local Chroma Vector Store
VECTOR_STORE_DIR = "./chroma_db"

def initialize_vector_store():
    # If the collection already exists and has documents, we can just load it.
    # For simplicity in the demo, we will recreate it from the JSON.
    with open("bns_data.json", "r") as f:
        data = json.load(f)
    
    documents = []
    for item in data:
        # Combine text for better embedding matches
        content = f"{item['title']}: {item['description']} Keywords: {', '.join(item['keywords'])}"
        doc = Document(page_content=content, metadata={"section": item["section"], "title": item["title"]})
        documents.append(doc)
        
    db = Chroma.from_documents(documents, embedding_function, persist_directory=VECTOR_STORE_DIR)
    db.persist()
    return db

# Initialize or load
db = initialize_vector_store()

# Prompt Template for parsing and generating FIR
prompt_template = """
You are an expert Indian Legal Assistant system (Nyaya-Sathi). 
Your job is to analyze a citizen's complaint (which may be in Hindi, English, or mixed) and generate a structured JSON response.

Complainant Details: {complainant_details}

Citizen Complaint: {complaint_text}

Here are the most relevant Bharatiya Nyaya Sanhita (BNS) sections retrieved from our database regarding this incident:
{relevant_law}

Instructions:
1. Translate the complaint to clear, formal English if it is in another language, or just refine it.
2. Extract key entities (e.g., Suspect, Location, Time, Stolen Item, Vehicle).
3. Evaluate the provided BNS sections and select ALL applicable sections that best fit the incident. Assign a confidence score (0-100) to each.
4. Draft a formal Police FIR (First Information Report) using the complainant details, facts, and chosen BNS section.
5. You MUST output ONLY valid JSON in the exact format specified below. Do not add markdown blocks like ```json or any conversational text.

Output Format:
{{
  "translatedText": "Formal English translation of the complaint...",
  "entities": [
    {{"label": "Suspect", "value": "Unknown person / Name..."}},
    {{"label": "Location", "value": "Place mentioned..."}}
  ],
  "bnsSections": [
    {{"section": "BNS Section XXX", "title": "Section Title", "confidence": 95}}
  ],
  "firDraft": "FIRST INFORMATION REPORT\\n\\nUnder Section: ...\\nComplainant: ...\\n\\nIncident Details: ..."
}}
"""
prompt = PromptTemplate(template=prompt_template, input_variables=["complainant_details", "complaint_text", "relevant_law"])

def process_complaint(complaint_text: str, complainant_data: Dict[str, Any]) -> Dict[str, Any]:
    # 1. Retrieve relevant BNS sections (Top 5)
    docs = db.similarity_search(complaint_text, k=5)
    relevant_law = "\n".join([f"- {d.metadata['section']} ({d.metadata['title']}): {d.page_content}" for d in docs])
    
    complainant_str = json.dumps(complainant_data, indent=2)
    
    # 2. Format Prompt
    formatted_prompt = prompt.format(
        complainant_details=complainant_str,
        complaint_text=complaint_text,
        relevant_law=relevant_law
    )
    
    # 3. Call Groq
    response = llm.invoke(formatted_prompt)
    
    # 4. Parse JSON
    try:
        # Clean up in case the LLM wrapped it in markdown
        output_str = response.content.strip()
        if output_str.startswith("```json"):
            output_str = output_str[7:]
        if output_str.startswith("```"):
            output_str = output_str[3:]
        if output_str.endswith("```"):
            output_str = output_str[:-3]
            
        result_json = json.loads(output_str.strip())
        return result_json
    except Exception as e:
        print(f"Error parsing JSON: {e}\nRaw Response: {response.content}")
        # Fallback response
        return {
            "translatedText": "Error processing complaint translation.",
            "entities": [],
            "bnsSections": [],
            "firDraft": "An error occurred while generating the FIR draft. Please try again."
        }
def simple_chat(query: str) -> str:
    # 1. Retrieve relevant BNS sections (Top 3 for chat)
    docs = db.similarity_search(query, k=3)
    relevant_law = "\n".join([f"- {d.metadata['section']} ({d.metadata['title']}): {d.page_content}" for d in docs])
    
    chat_prompt = f"""
    You are Nyaya AI Assistant, a helpful and empathetic legal guide for the Nyay-Sathi platform.
    Your goal is to explain Indian laws (BNS) clearly to common citizens.
    
    User Query: {query}
    
    Relevant Law context:
    {relevant_law}
    
    Guidelines:
    - Be professional yet accessible.
    - If the query is about a specific crime, mention the relevant BNS sections.
    - If you don't know the answer or it's outside BNS, politely say so.
    - Keep responses concise (under 3-4 paragraphs).
    - Use bullet points for clarity if needed.
    """
    
    response = llm.invoke(chat_prompt)
    return response.content.strip()
