---
name: Groq AI complaint analysis
description: Edge function using Groq Llama 3.1 8B for translating complaints, extracting entities, matching BNS sections, and generating FIR drafts
type: feature
---
- Edge function: supabase/functions/analyze-complaint/index.ts
- Model: llama-3.1-8b-instant via Groq API
- Secret: GROQ_API_KEY
- Returns: translatedText, entities[], bnsSections[], firDraft
- Called from CitizenComplaint.tsx handleSubmit
