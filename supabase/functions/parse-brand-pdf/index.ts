import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientName = formData.get("clientName") as string || "Unknown";

    if (!file) {
      return new Response(
        JSON.stringify({ error: "לא הועלה קובץ" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file.type !== "application/pdf") {
      return new Response(
        JSON.stringify({ error: "יש להעלות קובץ PDF בלבד" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Convert PDF to base64 for vision API
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Pdf = btoa(binary);

    const systemPrompt = `You are a brand guideline analyzer. You extract ONLY factual data from uploaded brand books/PDFs. 
You MUST return a JSON object with the following structure. If a value cannot be found in the document, use null or an empty array - NEVER invent or hallucinate data.

Return ONLY valid JSON, no markdown fences, no extra text:
{
  "colors": [
    { "name": "string (color name from document)", "hex": "string or null", "cmyk": "string (e.g. 'C100 M70') or null", "rgb": "string or null" }
  ],
  "fonts": [
    { "name": "string (exact font name from document)", "size": "string or null", "usage": "string (e.g. headlines, body) or null" }
  ],
  "logoRules": [
    { "rule": "string (exact rule from document)", "type": "do" or "dont" }
  ],
  "subBrands": [
    { "name": "string (sub-brand name, e.g. BIG CENTERS)", "nameHe": "string (Hebrew name) or null" }
  ],
  "sourceFileName": "string (the filename)"
}

CRITICAL RULES:
- Extract ONLY values explicitly stated in the document
- For colors: look for CMYK, RGB, HEX values. Convert CMYK to approximate HEX if HEX is not given
- For fonts: extract exact font family names
- For sub-brands: extract any variant names (e.g. BIG CENTERS, BIG FASHION)
- If you cannot find specific data, return null or empty array - NEVER guess`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this brand guideline PDF for the brand "${clientName}". Extract all colors (with CMYK/RGB/HEX values), fonts, logo usage rules, and sub-brand names. Return ONLY the JSON object.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד דקה" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרשים קרדיטים נוספים" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "שגיאה בניתוח הקובץ" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response, stripping markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "לא הצלחנו לנתח את תוכן הקובץ", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    extracted.sourceFileName = file.name;

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-brand-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
