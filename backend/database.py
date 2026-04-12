from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import uuid

DATABASE_URL = "sqlite:///./nyaysathi.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="citizen", nullable=False) # citizen, officer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaints = relationship("Complaint", back_populates="citizen")
    otps = relationship("PasswordResetOTP", back_populates="user")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String)
    description = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, dispatched, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    citizen = relationship("User", back_populates="complaints")
    evidence = relationship("Evidence", back_populates="complaint")

class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    file_hash = Column(String, nullable=False) # SHA-256
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    complaint = relationship("Complaint", back_populates="evidence")

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Integer, default=0) # 0 = fresh, 1 = used
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="otps")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)
