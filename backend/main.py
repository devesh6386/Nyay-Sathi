from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database import get_db, User, Complaint
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_role
from rag_engine import process_complaint

app = FastAPI(title="Nyaya-Sathi API")

# Allow requests from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "citizen"

class UserLogin(BaseModel):
    email: str
    password: str

class ComplaintRequest(BaseModel):
    complaint: str
    complainant: Dict[str, Any]

class ComplaintStatusUpdate(BaseModel):
    status: str

# --- Auth Endpoints ---
@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        role=user.role if user.role in ["citizen", "officer"] else "citizen"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login after register
    token = create_access_token(data={"sub": new_user.id, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer", "role": new_user.role, "full_name": new_user.full_name}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = create_access_token(data={"sub": db_user.id, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer", "role": db_user.role, "full_name": db_user.full_name, "id": db_user.id}

# --- Complaint Endpoints ---

@app.post("/analyze-complaint")
def analyze_complaint(req: ComplaintRequest, current_user: User = Depends(get_current_user)):
    """AI analysis endpoint. Requires auth."""
    if not req.complaint:
        raise HTTPException(status_code=400, detail="Complaint text is required")
    try:
        result = process_complaint(req.complaint, req.complainant)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complaints")
def create_complaint(title: str, description: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Saves the final complaint (FIR draft) to SQLite database."""
    new_complaint = Complaint(
        citizen_id=current_user.id,
        title=title,
        description=description,
        status="pending"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/complaints")
def get_complaints(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Officers get all complaints, citizens get only theirs."""
    if current_user.role == "officer":
        complaints = db.query(Complaint, User.full_name).join(User, Complaint.citizen_id == User.id).order_by(Complaint.created_at.desc()).all()
    else:
        complaints = db.query(Complaint, User.full_name).join(User, Complaint.citizen_id == User.id).filter(Complaint.citizen_id == current_user.id).order_by(Complaint.created_at.desc()).all()
    
    # Format output
    result = []
    for c, full_name in complaints:
        result.append({
            "id": c.id,
            "citizen_id": c.citizen_id,
            "title": c.title,
            "description": c.description,
            "status": c.status,
            "created_at": c.created_at,
            "citizen_name": full_name
        })
    return result

@app.put("/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: str, status_upd: ComplaintStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["officer"]))):
    """Officers can update status."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.status = status_upd.status
    db.commit()
    return {"message": "Status updated successfully"}

@app.put("/complaints/{complaint_id}")
def update_complaint_description(complaint_id: str, description: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["officer"]))):
    """Officers can save edited drafts."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.description = description
    db.commit()
    return {"message": "Draft saved successfully"}

@app.get("/")
def read_root():
    return {"message": "Nyaya-Sathi API with Local Auth running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
