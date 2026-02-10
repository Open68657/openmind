import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
    const { sketchPath, finalPath, sketchName, finalName, sketchMimeType, finalMimeType, clientBrandData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Create Supabase client to get signed URLs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get signed URLs for both files (valid for 1 hour)
    const [sketchUrlResult, finalUrlResult] = await Promise.all([
      supabase.storage.from("finals-audit").createSignedUrl(sketchPath, 3600),
      supabase.storage.from("finals-audit").createSignedUrl(finalPath, 3600),
    ]);

    if (sketchUrlResult.error) throw new Error(`Failed to get sketch URL: ${sketchUrlResult.error.message}`);
    if (finalUrlResult.error) throw new Error(`Failed to get final URL: ${finalUrlResult.error.message}`);

    const sketchUrl = sketchUrlResult.data.signedUrl;
    const finalUrl = finalUrlResult.data.signedUrl;

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

    const contentParts: any[] = [
      {
        type: "text",
        text: `Compare the approved sketch "${sketchName}" with the final file "${finalName}". Analyze content, visual integrity, and brand specs compliance.`,
      },
    ];

    const sketchIsImage = (sketchMimeType || "").startsWith("image/");
    const finalIsImage = (finalMimeType || "").startsWith("image/");

    // Helper: download PDF and encode to base64 data URL
    async function pdfToDataUrl(url: string, mimeType: string): Promise<string> {
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      const b64 = base64Encode(new Uint8Array(buf));
      return `data:${mimeType};base64,${b64}`;
    }

    // Process sketch first
    if (sketchIsImage) {
      contentParts.push({ type: "image_url", image_url: { url: sketchUrl } });
    } else {
      const dataUrl = await pdfToDataUrl(sketchUrl, sketchMimeType);
      contentParts.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    // Then process final
    if (finalIsImage) {
      contentParts.push({ type: "image_url", image_url: { url: finalUrl } });
    } else {
      const dataUrl = await pdfToDataUrl(finalUrl, finalMimeType);
      contentParts.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    // Use pro for PDFs since they need better document understanding
    const model = "google/gemini-2.5-flash";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: contentParts },
    ];

    console.log(`Comparing: sketch=${sketchName} (${sketchMimeType}), final=${finalName} (${finalMimeType}), model=${model}`);

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
