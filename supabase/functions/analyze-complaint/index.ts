import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an Indian legal AI assistant for the Nyaya-Sathi FIR system. Given a citizen complaint (in Hindi, English, or mixed) along with the complainant's personal details, you must:

1. Translate/normalize the complaint into clear English.
2. Extract key entities: Date, Time, Location, Items involved, Vehicle numbers, Suspect description, Estimated loss, etc.
3. Identify the most relevant Bharatiya Nyaya Sanhita (BNS) 2023 sections with confidence scores (0-100).
4. Generate a formal FIR draft using the complainant's REAL details (name, father's name, age, gender, phone, address, ID). Do NOT use placeholders like [YOUR_NAME] or [ADDRESS].

Respond ONLY with valid JSON in this exact format:
{
  "translatedText": "...",
  "entities": [
    {"label": "Date", "value": "..."},
    {"label": "Time", "value": "..."}
  ],
  "bnsSections": [
    {"section": "Section 303(2)", "title": "Theft (BNS)", "confidence": 85}
  ],
  "firDraft": "FIRST INFORMATION REPORT..."
}

Important rules:
- Use BNS 2023 sections, NOT old IPC sections.
- Include today's date in the FIR draft.
- Keep confidence scores realistic.
- Extract ALL entities you can find.
- The FIR draft should be formal and ready for submission.
- Use the complainant's actual name, father's name, age, gender, phone, address, and ID in the FIR draft. If a field is empty, omit that detail gracefully — never write placeholder text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const { complaint, complainant } = await req.json();
    if (!complaint || typeof complaint !== "string" || complaint.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Complaint text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Build complainant info string
    const cParts: string[] = [];
    if (complainant?.fullName) cParts.push(`Full Name: ${complainant.fullName}`);
    if (complainant?.fatherName) cParts.push(`Father's/Spouse's Name: ${complainant.fatherName}`);
    if (complainant?.age) cParts.push(`Age: ${complainant.age}`);
    if (complainant?.gender) cParts.push(`Gender: ${complainant.gender}`);
    if (complainant?.phone) cParts.push(`Phone: ${complainant.phone}`);
    if (complainant?.address) cParts.push(`Address: ${complainant.address}`);
    if (complainant?.idType && complainant?.idNumber) cParts.push(`${complainant.idType}: ${complainant.idNumber}`);

    const complainantInfo = cParts.length > 0 ? `\n\nComplainant details:\n${cParts.join("\n")}` : "";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Today's date: ${today}${complainantInfo}\n\nCitizen complaint:\n${complaint}` },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI service error [${response.status}]` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-complaint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
