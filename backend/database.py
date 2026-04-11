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

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String)
    description = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False) # pending, dispatched, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    citizen = relationship("User", back_populates="complaints")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)
