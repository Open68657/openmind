import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function processComparison(jobId: string, params: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  try {
    const { sketchPath, finalPath, sketchName, finalName, sketchMimeType, finalMimeType, clientBrandData } = params;

    const [sketchUrlResult, finalUrlResult] = await Promise.all([
      supabase.storage.from("finals-audit").createSignedUrl(sketchPath, 3600),
      supabase.storage.from("finals-audit").createSignedUrl(finalPath, 3600),
    ]);

    if (sketchUrlResult.error) throw new Error(`Failed to get sketch URL: ${sketchUrlResult.error.message}`);
    if (finalUrlResult.error) throw new Error(`Failed to get final URL: ${finalUrlResult.error.message}`);

    await supabase.from("comparison_jobs").update({ progress: 30 }).eq("id", jobId);

    const brandContext = clientBrandData
      ? `\n\nBrand Assets for this client:\n- Colors: ${JSON.stringify(clientBrandData.colors)}\n- Fonts: ${JSON.stringify(clientBrandData.fonts)}`
      : "";

    const systemPrompt = `You are a meticulous QA auditor at an advertising agency. You will receive exactly TWO images.

IMAGE 1 = SKETCH (the approved reference)
IMAGE 2 = FINAL (the produced file)

YOUR TASK: Find EVERY difference between IMAGE 1 and IMAGE 2.

METHODOLOGY - Follow these steps IN ORDER:
1. TEXT COMPARISON: Read every single word, number, date, phone number, URL, barcode, and label in IMAGE 1. Then check if each one appears IDENTICALLY in IMAGE 2. Report ANY change.
2. IMAGE/PHOTO COMPARISON: Identify every photograph, illustration, product shot, and graphic in IMAGE 1. Verify each one is the SAME in IMAGE 2. Report ANY replacement, crop change, or removal.
3. LAYOUT COMPARISON: Check positions, sizes, and alignment of all elements. Report ANY shift, resize, or reflow.
4. COLOR COMPARISON: Compare background colors, text colors, accent colors. Report ANY change.
5. ELEMENT COUNT: Count distinct visual elements in each image. Report if counts differ.

CRITICAL RULES:
- DEFAULT ASSUMPTION: The files are DIFFERENT. You must PROVE they are identical to give 100.
- If you see ANY difference at all, the score MUST be below 95.
- If text content differs (different words, missing text, added text), score MUST be below 80.
- If images/photos are different (different product, different person, different scene), score MUST be below 60.
- Be EXHAUSTIVE. Missing even one difference is a failure on your part.
- When in doubt, report it as info severity.

SCORING:
- 100: Pixel-perfect identical (extremely rare)
- 90-99: Only trivial rendering artifacts (anti-aliasing, compression)
- 70-89: Minor differences (slight position shifts, small color variations)
- 50-69: Significant differences (changed text, swapped images, layout changes)
- Below 50: Completely different content

Respond in Hebrew. Return ONLY raw JSON (no markdown):
{
  "matchScore": <number 0-100>,
  "summary": "<Hebrew summary listing the main differences found>",
  "discrepancies": [
    {
      "type": "content" | "visual" | "specs",
      "severity": "critical" | "warning" | "info",
      "description": "<Hebrew description of this specific difference>"
    }
  ]
}

If and ONLY if the two images are truly pixel-perfect identical, return matchScore 100 with empty discrepancies.`;

    // Files are always images (PDFs converted client-side), so use URLs directly
    const contentParts: any[] = [
      {
        type: "text",
        text: `Compare the approved sketch "${sketchName}" with the final file "${finalName}". Analyze content, visual integrity, and brand specs compliance.`,
      },
      { type: "image_url", image_url: { url: sketchUrlResult.data.signedUrl } },
      { type: "image_url", image_url: { url: finalUrlResult.data.signedUrl } },
    ];

    await supabase.from("comparison_jobs").update({ progress: 50 }).eq("id", jobId);

    const model = "google/gemini-2.5-pro";
    console.log(`Comparing: sketch=${sketchName} (${sketchMimeType}), final=${finalName} (${finalMimeType}), model=${model}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts },
        ],
        stream: false,
        temperature: 0,
      }),
    });

    await supabase.from("comparison_jobs").update({ progress: 80 }).eq("id", jobId);

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      let errorMsg = `שגיאה בשירות ה-AI (${response.status})`;
      if (response.status === 429) errorMsg = "יותר מדי בקשות, נסה שוב מאוחר יותר.";
      if (response.status === 402) errorMsg = "נדרש תשלום. הוסף קרדיטים לחשבון.";
      
      await supabase.from("comparison_jobs").update({
        status: "failed", error_message: errorMsg, progress: 100,
      }).eq("id", jobId);
      return;
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

    await supabase.from("comparison_jobs").update({
      status: "completed", result, progress: 100,
    }).eq("id", jobId);

    console.log(`Job ${jobId} completed successfully`);
  } catch (e) {
    console.error(`Job ${jobId} failed:`, e);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from("comparison_jobs").update({
      status: "failed",
      error_message: e instanceof Error ? e.message : "Unknown error",
      progress: 100,
    }).eq("id", jobId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: job, error: jobError } = await supabase
      .from("comparison_jobs")
      .insert({
        user_id: params.userId,
        sketch_path: params.sketchPath,
        final_path: params.finalPath,
        sketch_name: params.sketchName,
        final_name: params.finalName,
        sketch_mime_type: params.sketchMimeType,
        final_mime_type: params.finalMimeType,
        status: "processing",
        progress: 0,
      })
      .select()
      .single();

    if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

    EdgeRuntime.waitUntil(processComparison(job.id, params));

    return new Response(JSON.stringify({ jobId: job.id }), {
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
