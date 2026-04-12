from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import os
import shutil

from database import get_db, User, Complaint, PasswordResetOTP, Evidence
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_role
from rag_engine import process_complaint
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv(override=True)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

app = FastAPI(title="Nyaya-Sathi API")

# Allow requests from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve files
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "citizen"

class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

class ComplaintRequest(BaseModel):
    complaint: str
    complainant: Dict[str, Any]

class ComplaintStatusUpdate(BaseModel):
    status: str

class ChatRequest(BaseModel):
    message: str

class GoogleAuthRequest(BaseModel):
    credential: str

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
    print(f"\n[AUTH] Login attempt for: {user.email} as {user.role}")
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, db_user.password_hash):
        print(f"[AUTH] Login failed: Incorrect email or password for {user.email}")
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if db_user.role != user.role:
        print(f"[AUTH] Role mismatch: User {user.email} is registered as {db_user.role}, but tried logging in as {user.role}")
        raise HTTPException(
            status_code=403, 
            detail=f"Access denied. This account is registered as a {db_user.role.capitalize()}.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": db_user.id, "role": db_user.role})
    print(f"[AUTH] Login successful for {db_user.email} ({db_user.role})")
    return {"access_token": token, "token_type": "bearer", "role": db_user.role, "full_name": db_user.full_name, "id": db_user.id}

@app.post("/auth/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "your_google_client_id_here":
        # Accept mock validation for frontend testing without a real project ID initially if needed,
        # but in production we require the true client ID.
        pass
    
    try:
        # Validate Google JWT
        idinfo = id_token.verify_oauth2_token(
            req.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = idinfo['email']
        full_name = idinfo.get('name', 'Google User')
        
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user:
            # Create a new citizen user
            # We assign a random string password since they use Google to auth
            random_pass = os.urandom(16).hex()
            hashed_password = get_password_hash(random_pass)
            db_user = User(
                email=email,
                password_hash=hashed_password,
                full_name=full_name,
                role="citizen"
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            print(f"[AUTH] New Google user registered: {email}")
        
        # In both cases (login/register), we issue our own JWT access token
        token = create_access_token(data={"sub": db_user.id, "role": db_user.role})
        print(f"[AUTH] Google Login successful for {db_user.email}")
        return {"access_token": token, "token_type": "bearer", "role": db_user.role, "full_name": db_user.full_name, "id": db_user.id}
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

# --- Password Reset Flow ---

from email_utils import send_otp_email

@app.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Normalize email
    target_email = req.email.strip().lower()
    print(f"\n[AUTH] Password reset requested for: {target_email}")
    
    user = db.query(User).filter(User.email == target_email).first()
    
    if not user:
        print(f"[AUTH] Email {target_email} not found in database. Returning generic success.")
        # Avoid user enumeration by returning success anyway
        return {"message": "If this email is registered, an OTP has been sent."}
    
    print(f"[AUTH] User found: {user.full_name} ({user.id})")
    
    # Check rate limit: Max 3 per 10 minutes
    now = datetime.utcnow()
    ten_mins_ago = now - timedelta(minutes=10)
    
    recent_otps_count = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.created_at >= ten_mins_ago
    ).count()
    
    if recent_otps_count >= 3:
        print(f"[AUTH] Rate limit triggered for {target_email}. Requested {recent_otps_count} times in last 10 mins.")
        raise HTTPException(status_code=429, detail="Too many requests. Please wait 10 minutes before requesting another code.")

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    print(f"[AUTH] Generated 6-digit OTP for {user.email}. Expiry set to 5 minutes.")

    # Try sending email FIRST before saving to DB
    print(f"[AUTH] Sending OTP email to recipient: {user.email}")
    email_sent = send_otp_email(to_email=user.email, otp_code=otp_code)
    
    if not email_sent:
        print(f"[AUTH] CRITICAL: Email delivery failed for {user.email}.")
        raise HTTPException(
            status_code=500, 
            detail="Failed to send OTP email. Please ensure the server has valid SMTP credentials configured."
        )

    # Invalidate previous OTPs for this user
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.is_used == 0
    ).update({"is_used": 1})
    print(f"[AUTH] Invalidated previous active OTPs for user {user.id}")

    # Save new OTP to DB only after successful send
    new_otp = PasswordResetOTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.add(new_otp)
    db.commit()
    print(f"[AUTH] New OTP saved and activated for {req.email}.")
    
    return {"message": "If this email is registered, an OTP has been sent."}

@app.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.otp_code == req.otp_code,
        PasswordResetOTP.is_used == 0,
        PasswordResetOTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    return {"message": "OTP verified successfully."}

@app.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id,
        PasswordResetOTP.otp_code == req.otp_code,
        PasswordResetOTP.is_used == 0,
        PasswordResetOTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid reset session")
    
    # Update password
    user.password_hash = get_password_hash(req.new_password)
    otp.is_used = 1
    db.commit()
    
    return {"message": "Password reset successfully."}

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

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/complaints/{complaint_id}/evidence")
async def upload_evidence(
    complaint_id: str,
    file: UploadFile = File(...),
    file_hash: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["citizen", "officer"]))
):
    print(f"\n[EVIDENCE] Upload attempt for Complaint: {complaint_id} by User: {current_user.id}")
    
    # Verify complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        print(f"[EVIDENCE] Error: Complaint {complaint_id} not found.")
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Generate unique filename to prevent collisions
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{complaint_id}_{random.randint(1000, 9999)}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        print(f"[EVIDENCE] Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"[EVIDENCE] File saved successfully.")
    except Exception as e:
        print(f"[EVIDENCE] CRITICAL: File system error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File storage failed: {str(e)}")

    # Save to database
    try:
        new_evidence = Evidence(
            complaint_id=complaint_id,
            file_name=file.filename,
            file_path=f"/uploads/{unique_filename}",
            file_type=file.content_type,
            file_hash=file_hash
        )
        db.add(new_evidence)
        db.commit()
        db.refresh(new_evidence)
        print(f"[EVIDENCE] Database record created: {new_evidence.id}")
        return {
            "id": new_evidence.id,
            "file_name": file.filename,
            "file_path": new_evidence.file_path,
            "file_type": new_evidence.file_type,
            "file_hash": new_evidence.file_hash
        }
    except Exception as e:
        db.rollback()
        print(f"[EVIDENCE] Database error: {str(e)}")
        # Remove the file if DB insert fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Database persistence failed")

@app.get("/complaints/{complaint_id}/evidence")
def get_evidence(
    complaint_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["citizen", "officer"]))
):
    print(f"\n[EVIDENCE] Fetching evidence for Complaint: {complaint_id} requested by {current_user.full_name}")
    
    # Check if complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        print(f"[EVIDENCE] Error: Complaint {complaint_id} not found.")
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # Authorization check
    if current_user.role != "officer" and complaint.citizen_id != current_user.id:
        print(f"[EVIDENCE] Security Warning: Unauthorized access attempt to evidence of complaint {complaint_id} by user {current_user.id}")
        raise HTTPException(status_code=403, detail="Not authorized to access this evidence")

    evidence = db.query(Evidence).filter(Evidence.complaint_id == complaint_id).all()
    print(f"[EVIDENCE] Returning {len(evidence)} items.")
    return evidence

@app.get("/")
def read_root():
    return {"message": "Nyaya-Sathi API with Local Auth running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
from rag_engine import process_complaint, simple_chat

@app.post("/chat")
def chat_with_ai(req: ChatRequest):
    try:
        response = simple_chat(req.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
