import json
import os
from typing import Dict, Any
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain.schema.document import Document
from dotenv import load_dotenv

load_dotenv()

# Resolve paths relative to this file so they work regardless of cwd (important on Render)
_HERE = os.path.dirname(os.path.abspath(__file__))

# Lazy singletons – initialized on first use, not at import time
_llm = None
_embedding_function = None
_vector_db = None

def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            temperature=0.1,
            model_name="llama-3.1-8b-instant",
            groq_api_key=os.environ.get("GROQ_API_KEY")
        )
    return _llm

def _get_embedding_function():
    global _embedding_function
    if _embedding_function is None:
        _embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embedding_function

# On Render: VECTOR_STORE_DIR=/opt/render/project/src/data/chroma_db
# Locally: ./chroma_db
VECTOR_STORE_DIR = os.environ.get("VECTOR_STORE_DIR", os.path.join(_HERE, "chroma_db"))

def _get_vector_db():
    """Lazy-initialize the ChromaDB vector store.
    db.persist() was removed in chromadb >= 0.4 – omit it.
    bns_data.json is resolved relative to this file, not cwd.
    """
    global _vector_db
    if _vector_db is None:
        bns_path = os.path.join(_HERE, "bns_data.json")
        with open(bns_path, "r") as f:
            data = json.load(f)

        documents = []
        for item in data:
            content = f"{item['title']}: {item['description']} Keywords: {', '.join(item['keywords'])}"
            doc = Document(
                page_content=content,
                metadata={"section": item["section"], "title": item["title"]}
            )
            documents.append(doc)

        _vector_db = Chroma.from_documents(
            documents,
            _get_embedding_function(),
            persist_directory=VECTOR_STORE_DIR
        )
        # NOTE: db.persist() was removed in chromadb >= 0.4 – data is auto-persisted.
    return _vector_db

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
    docs = _get_vector_db().similarity_search(complaint_text, k=5)
    relevant_law = "\n".join([f"- {d.metadata['section']} ({d.metadata['title']}): {d.page_content}" for d in docs])
    
    complainant_str = json.dumps(complainant_data, indent=2)
    
    # 2. Format Prompt
    formatted_prompt = prompt.format(
        complainant_details=complainant_str,
        complaint_text=complaint_text,
        relevant_law=relevant_law
    )
    
    # 3. Call Groq
    response = _get_llm().invoke(formatted_prompt)
    
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
    docs = _get_vector_db().similarity_search(query, k=3)
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

    response = _get_llm().invoke(chat_prompt)
    return response.content.strip()
