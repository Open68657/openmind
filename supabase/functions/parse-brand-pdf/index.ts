import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

declare const EdgeRuntime: { waitUntil: (promise: Promise<void>) => void };

async function processInBackground(
  jobId: string,
  storagePath: string,
  clientName: string,
  fileName: string,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  try {
    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("brand-pdfs")
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      await supabase.from("brand_parse_jobs").update({
        status: "failed",
        error_message: "לא הצלחנו להוריד את הקובץ מהאחסון",
      }).eq("id", jobId);
      return;
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = base64Encode(new Uint8Array(arrayBuffer));

    const systemPrompt = `You are a strict brand guideline data extractor. You extract ONLY factual data visible in uploaded brand book PDFs.

EXTRACTION RULES:
1. COLORS: Search for keywords "HEX", "RGB", "CMYK", "Pantone", "#" followed by 6 chars, or color swatches with labeled values. Extract the EXACT values written. If only CMYK is given, provide it as-is and set hex to null. Do NOT convert or guess hex values.
2. TYPOGRAPHY: Search for font family names (e.g. Almoni, Assistant, Heebo, Open Sans, Montserrat). Look for weight keywords (Light, Regular, Bold, Black). Extract exact names as written.
3. LOGO RULES: Find sections about logo usage, do's and don'ts, clear space, minimum size. Extract the exact rule text.
4. SUB-BRANDS: Find variant names like "BIG CENTERS", "BIG FASHION", etc.

For EVERY extracted item, you MUST note which page number it was found on.

CONFIDENCE LEVELS:
- "exact": The value is explicitly written in the document
- "inferred": The value was derived from context but not explicitly stated

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

CRITICAL: If you CANNOT find a specific data type, return an empty array for it and set the corresponding "Found" flag to false. NEVER invent values.`;

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
                text: `Analyze this brand guideline PDF for "${clientName}". Extract all colors, fonts, logo rules, and sub-brands. Return ONLY the JSON object.`,
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      await supabase.from("brand_parse_jobs").update({
        status: "failed",
        error_message: response.status === 429 ? "יותר מדי בקשות, נסה שוב בעוד דקה" : "שגיאה בניתוח הקובץ",
      }).eq("id", jobId);
      return;
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
      await supabase.from("brand_parse_jobs").update({
        status: "failed",
        error_message: "לא הצלחנו לנתח את תוכן הקובץ",
      }).eq("id", jobId);
      return;
    }

    extracted.sourceFileName = fileName || "unknown.pdf";

    // Success - save result
    await supabase.from("brand_parse_jobs").update({
      status: "completed",
      result: extracted,
    }).eq("id", jobId);

    console.log("Successfully parsed brand PDF for job:", jobId);
  } catch (e) {
    console.error("Background processing error:", e);
    await supabase.from("brand_parse_jobs").update({
      status: "failed",
      error_message: e instanceof Error ? e.message : "שגיאה לא ידועה",
    }).eq("id", jobId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storagePath, clientName, fileName, userId } = await req.json();

    if (!storagePath || !userId) {
      return new Response(
        JSON.stringify({ error: "חסרים פרטים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from("brand_parse_jobs")
      .insert({
        user_id: userId,
        client_id: clientName || "unknown",
        storage_path: storagePath,
        file_name: fileName,
        status: "processing",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("Failed to create job:", jobError);
      return new Response(
        JSON.stringify({ error: "שגיאה ביצירת משימת ניתוח" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start background processing
    EdgeRuntime.waitUntil(
      processInBackground(job.id, storagePath, clientName || "Unknown", fileName || "unknown.pdf")
    );

    // Return immediately with job ID
    return new Response(JSON.stringify({ jobId: job.id }), {
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
