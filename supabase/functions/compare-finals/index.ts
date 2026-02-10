import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    // Get signed URLs
    const [sketchUrlResult, finalUrlResult] = await Promise.all([
      supabase.storage.from("finals-audit").createSignedUrl(sketchPath, 3600),
      supabase.storage.from("finals-audit").createSignedUrl(finalPath, 3600),
    ]);

    if (sketchUrlResult.error) throw new Error(`Failed to get sketch URL: ${sketchUrlResult.error.message}`);
    if (finalUrlResult.error) throw new Error(`Failed to get final URL: ${finalUrlResult.error.message}`);

    const sketchUrl = sketchUrlResult.data.signedUrl;
    const finalUrl = finalUrlResult.data.signedUrl;

    // Update progress
    await supabase.from("comparison_jobs").update({ progress: 20 }).eq("id", jobId);

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

    // Process sketch
    if (sketchIsImage) {
      contentParts.push({ type: "image_url", image_url: { url: sketchUrl } });
    } else {
      const resp = await fetch(sketchUrl);
      const buf = await resp.arrayBuffer();
      const b64 = base64Encode(new Uint8Array(buf));
      contentParts.push({ type: "image_url", image_url: { url: `data:${sketchMimeType};base64,${b64}` } });
    }

    await supabase.from("comparison_jobs").update({ progress: 40 }).eq("id", jobId);

    // Process final
    if (finalIsImage) {
      contentParts.push({ type: "image_url", image_url: { url: finalUrl } });
    } else {
      const resp = await fetch(finalUrl);
      const buf = await resp.arrayBuffer();
      const b64 = base64Encode(new Uint8Array(buf));
      contentParts.push({ type: "image_url", image_url: { url: `data:${finalMimeType};base64,${b64}` } });
    }

    await supabase.from("comparison_jobs").update({ progress: 60 }).eq("id", jobId);

    const model = "google/gemini-2.5-flash";
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
        status: "failed",
        error_message: errorMsg,
        progress: 100,
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
      status: "completed",
      result,
      progress: 100,
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

    // Create a job record
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

    // Start background processing
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
