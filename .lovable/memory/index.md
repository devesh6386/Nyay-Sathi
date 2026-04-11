# Project Memory

## Core
Dark navy/saffron theme. BNS-ready justice portal for India.
Sarvam AI for STT (speech-to-text). API key stored as SARVAM_API_KEY secret.
Groq + Llama 3.1 8B for complaint analysis. API key stored as GROQ_API_KEY secret.
Lovable Cloud enabled for backend.

## Memories
- [Sarvam STT integration](mem://features/sarvam-stt) — Edge function proxying audio to Sarvam API, used in CitizenComplaint
- [Groq AI analysis](mem://features/groq-analysis) — Edge function analyze-complaint using Llama 3.1 8B for translation, entity extraction, BNS matching, FIR generation
