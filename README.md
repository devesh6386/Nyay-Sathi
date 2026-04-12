# ⚖️ Nyaya-Sathi

### BNS-Ready AI Justice Infrastructure for FIR Intelligence & Court-Admissible Evidence

Nyaya-Sathi converts unstructured citizen complaints into legally valid FIRs mapped to India’s new BNS framework, while generating court-admissible digital evidence certificates using local-first cryptographic hashing.

---

## 🚀 Overview

Nyaya-Sathi is an AI-powered legal-tech platform built to modernize the Indian justice intake pipeline.

The platform solves the core trust gap in complaint-to-court workflows by combining:

* 🧠 Deterministic RAG-based legal intelligence
* ⚖️ BNS / BNSS aligned FIR generation
* 🔐 Client-side SHA-256 evidence hashing
* 📄 BSA Section 63(4) compliant digital certificates
* 👮 Separate Citizen & Officer dashboards
* 💬 Embedded legal guidance chatbot

From first complaint to evidence admissibility, every step is engineered for **traceability, legal validity, and operational efficiency**.

---

## 🎯 Problem Statement

Traditional complaint systems fail due to:

* ❌ Unstructured multilingual complaints
* ❌ Incorrect legal section mapping
* ❌ Weak FIR drafting workflows
* ❌ Lack of citizen legal guidance
* ❌ Digitally uploaded evidence lacking court validity
* ❌ Broken chain of trust between citizen → police → court

Nyaya-Sathi fixes this by building an **end-to-end legal trust pipeline**.

---

## ✨ Core Features

### 🧍 Citizen Complaint Intelligence

* Hindi + English mixed-language support
* Voice complaint intake
* Structured fact extraction:

  * Who
  * What
  * When
  * Where
* Smart complaint drafting

---

### 🧠 Legal AI Brain (Deterministic RAG)

* LangChain-powered legal retrieval
* BNS / BNSS corpus grounding
* Exact section mapping
* FIR auto-generation
* RTI / complaint draft generation
* Anti-hallucination workflow

> Uses retrieval-grounded legal reasoning, not blind LLM generation.

---

### 💬 Nyaya AI Assistant

Provides:

* legal rights guidance
* FIR filing help
* BNS section explanation
* process clarity
* next-step recommendations

---

### 🔐 Evidence Trust Engine

* Local-first SHA-256 hashing
* File fingerprint generation
* Metadata preservation
* Tamper detection
* Integrity verification
* Browser-side hashing via Web Crypto API

> File integrity is established before server upload.

---

### 📄 Court-Admissible Certificate Engine

Generates:

* BSA Section 63(4) certificate
* hash metadata
* timestamp-ready digital proof sheet
* officer verification trail

---

### 👮 Officer Dashboard

* Review AI-generated FIR
* Verify uploaded evidence
* Preview images / PDFs
* Approve & dispatch case
* Resolve case
* View case status metrics

---

### 🔐 Role-Based Access Control

**👤 Citizen Portal**

* complaint filing
* evidence upload
* AI legal assistance

**👮 Officer Portal**

* investigation workflows
* evidence verification
* case resolution

---

## 🏗️ System Architecture

```text
Citizen Input
   ↓
AI Fact Extraction
   ↓
Deterministic RAG
   ↓
BNS Section Mapping
   ↓
FIR Generation
   ↓
Evidence Hashing (SHA-256)
   ↓
BSA Certificate Generation
   ↓
Officer Review
   ↓
Court-Ready Digital Case File
```

---

## 🛠️ Tech Stack

### 🎨 Frontend

* Next.js
* Tailwind CSS
* React Components
* Glassmorphism UI
* Responsive dashboards

---

### ⚙️ Backend

* FastAPI
* Async REST APIs
* Evidence processing routes
* Auth routes
* FIR generation APIs

---

### 🧠 AI Layer

* LangChain
* OpenAI / Gemini
* Mistral fallback
* Deterministic RAG orchestration

---

### 🗂️ Vector Database

* ChromaDB
* Pinecone-ready architecture
* Legal corpus chunk retrieval

---

### 🔐 Cryptography

* Web Crypto API
* SHA-256 hashing
* Client-side integrity generation

---

### 📄 PDF Engine

* pdf-lib
* BSA legal certificate generation

---

### 🗃️ Storage

* Evidence-linked complaint storage
* Metadata persistence
* Hash verification records

---

## 🔍 Key Innovations

### 1) 🧠 Deterministic Legal RAG

* Exact legal retrieval
* Zero hallucinated sections
* Consistent FIR outputs

---

### 2) 🔐 Local-First Cryptographic Evidence

* Evidence hashed in-browser
* Integrity + tamper visibility
* Chain-of-custody trust

---

### 3) ⚖️ Court-Ready Digital Evidence

Nyaya-Sathi pipeline:

> Complaint → FIR → Evidence → Certificate → Court

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/devesh6386/Nyay-Sathi.git
cd Nyay-Sathi
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🔐 Environment Variables

Create `.env` inside backend:

```env
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key
MISTRAL_API_KEY=your_key
CHROMA_DB_PATH=./chroma
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_app_password
JWT_SECRET=your_secret
```

---

## 🧪 Demo Workflow

### 👤 Citizen Flow

* Login as citizen
* Speak / type complaint
* AI extracts facts
* BNS sections mapped
* FIR draft generated
* Upload evidence
* SHA-256 generated locally

---

### 👮 Officer Flow

* Login as officer
* Review FIR
* Verify evidence hash
* Generate BSA certificate
* Approve / dispatch
* Resolve case

---

## 🔒 Security Considerations

* Role-based route protection
* File type validation
* Secure upload controls
* Local cryptographic hashing
* Protected officer actions
* Async backend isolation
* Logging: `[AUTH]`, `[EVIDENCE]`

---

## 🌍 Real-World Use Cases

* Police complaint filing
* Cybercrime evidence preservation
* RTI assistance
* Citizen legal literacy
* Digital FIR modernization
* E-court readiness

---

## 🚀 Future Roadmap

* ⛓ Blockchain notarization
* 📍 Geo-tagged evidence
* 🎥 Large video integrity support
* 📴 Offline-first rural upload
* 🧑‍⚖️ Court portal integration
* 📡 Police dispatch API integration
* 🗣 Multilingual expansion

---

## 🏆 Why This Matters

Nyaya-Sathi is not just another AI chatbot.

It is **digital justice infrastructure** designed for:

* legal validity
* operational trust
* evidence integrity
* citizen empowerment

Built for India’s new criminal law ecosystem:

* BNS
* BNSS
* BSA

---

## 👥 Team

Built with ❤️ by the Nyaya-Sathi Team

* AI Systems
* Legal Retrieval
* Evidence Integrity
* FastAPI Infrastructure
* Frontend Experience
* Cryptographic Trust Layer

---

## 📜 License

MIT License

---

## ⭐ Final One-Liner

> AI-powered legal infrastructure that transforms citizen complaints into BNS-mapped FIRs and court-admissible cryptographically verified evidence.
