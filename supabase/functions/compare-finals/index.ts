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
    const { sketchBase64, finalBase64, sketchName, finalName, sketchMimeType, finalMimeType, clientBrandData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const brandContext = clientBrandData
      ? `\n\nBrand Assets for this client:\n- Colors: ${JSON.stringify(clientBrandData.colors)}\n- Fonts: ${JSON.stringify(clientBrandData.fonts)}`
      : "";

    const systemPrompt = `You are an expert QA auditor for a creative advertising agency. You compare an approved sketch against a final production file.

Your job:
1. CONTENT CHECK: Verify every word/sentence from the sketch appears identically in the final. Flag typos, missing text, or changed text.
2. VISUAL INTEGRITY: Detect if graphical elements (logos, images, shapes, layout) shifted, disappeared, or changed.
3. SPECS CHECK: If brand data is provided, verify colors and fonts match.${brandContext}

Respond in Hebrew with this exact JSON structure (no markdown, just raw JSON):
{
  "matchScore": <number 0-100>,
  "summary": "<brief Hebrew summary>",
  "discrepancies": [
    {
      "type": "content" | "visual" | "specs",
      "severity": "critical" | "warning" | "info",
      "description": "<Hebrew description of the issue>"
    }
  ]
}

If files are identical, return matchScore 100 with empty discrepancies array.`;

    // Build content parts - only use image_url for actual images
    const contentParts: any[] = [
      {
        type: "text",
        text: `Compare the approved sketch "${sketchName}" with the final file "${finalName}". Analyze content, visual integrity, and brand specs compliance.`,
      },
    ];

    const sketchIsImage = (sketchMimeType || "").startsWith("image/");
    const finalIsImage = (finalMimeType || "").startsWith("image/");

    if (sketchIsImage) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${sketchMimeType};base64,${sketchBase64}` },
      });
    } else {
      // For PDFs and other non-image files, describe as attached file
      contentParts.push({
        type: "text",
        text: `[Sketch file "${sketchName}" is a ${sketchMimeType} file - base64 data provided below for analysis]\nBase64 data (first 500 chars for reference): ${sketchBase64.substring(0, 500)}...`,
      });
    }

    if (finalIsImage) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${finalMimeType};base64,${finalBase64}` },
      });
    } else {
      contentParts.push({
        type: "text",
        text: `[Final file "${finalName}" is a ${finalMimeType} file - base64 data provided below for analysis]\nBase64 data (first 500 chars for reference): ${finalBase64.substring(0, 500)}...`,
      });
    }

    // If both files are PDFs, we can't do visual comparison via this API
    // Use gemini-2.5-pro which has better document understanding
    const model = (!sketchIsImage || !finalIsImage) ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: contentParts },
    ];

    console.log(`Comparing files: sketch=${sketchName} (${sketchMimeType}, isImage=${sketchIsImage}), final=${finalName} (${finalMimeType}, isImage=${finalIsImage}), model=${model}`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסה שוב מאוחר יותר." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום. הוסף קרדיטים לחשבון." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `שגיאה בשירות ה-AI (${response.status})` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { matchScore: 0, summary: "לא ניתן לנתח", discrepancies: [] };
    } catch {
      result = { matchScore: 0, summary: content, discrepancies: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compare-finals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
