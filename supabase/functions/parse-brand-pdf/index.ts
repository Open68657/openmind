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

    const systemPrompt = `You are a strict brand guideline data extractor. You extract ONLY factual data visible in uploaded brand book PDFs.

EXTRACTION RULES:
1. COLORS: Search for keywords "HEX", "RGB", "CMYK", "Pantone", "#" followed by 6 chars, or color swatches with labeled values. Extract the EXACT values written. If only CMYK is given, provide it as-is and set hex to null. Do NOT convert or guess hex values.
2. TYPOGRAPHY: Search for font family names (e.g. Almoni, Assistant, Heebo, Open Sans, Montserrat). Look for weight keywords (Light, Regular, Bold, Black). Extract exact names as written.
3. LOGO RULES: Find sections about logo usage, do's and don'ts, clear space, minimum size. Extract the exact rule text.
4. SUB-BRANDS: Find variant names like "BIG CENTERS", "BIG FASHION", etc.

For EVERY extracted item, you MUST note which page number it was found on.

CONFIDENCE LEVELS:
- "exact": The value is explicitly written in the document (e.g. "CMYK: C100 M70")
- "inferred": The value was derived from context but not explicitly stated
- "not_found": Could not locate this type of data in the document

Return ONLY valid JSON, no markdown fences:
{
  "colors": [
    { "name": "string", "hex": "string or null", "cmyk": "string or null", "rgb": "string or null", "pantone": "string or null", "page": number, "confidence": "exact"|"inferred" }
  ],
  "fonts": [
    { "name": "string", "weight": "string or null", "size": "string or null", "usage": "string or null", "page": number, "confidence": "exact"|"inferred" }
  ],
  "logoRules": [
    { "rule": "string", "type": "do"|"dont", "page": number, "confidence": "exact"|"inferred" }
  ],
  "subBrands": [
    { "name": "string", "nameHe": "string or null", "page": number }
  ],
  "summary": {
    "totalPages": number,
    "colorsFound": boolean,
    "fontsFound": boolean,
    "logoRulesFound": boolean,
    "subBrandsFound": boolean
  }
}

CRITICAL: If you CANNOT find a specific data type, return an empty array for it and set the corresponding "Found" flag to false. NEVER invent values. If unsure about a value, set confidence to "inferred".`;

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
                text: `Analyze this brand guideline PDF for "${clientName}". Extract all colors with their EXACT CMYK/RGB/HEX/Pantone codes as printed, all font names with weights, logo usage rules, and sub-brand names. For each item note the page number. Return ONLY the JSON object.`,
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
