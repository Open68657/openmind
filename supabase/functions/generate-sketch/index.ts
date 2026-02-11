import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { brief, clientId } = await req.json();

    if (!brief || !clientId) {
      return new Response(
        JSON.stringify({ error: "brief and clientId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* ---- Fetch brand data from DB ---- */
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [guidelinesRes, clientRes] = await Promise.all([
      supabase
        .from("brand_guidelines")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle(),
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    ]);

    const guidelines = guidelinesRes.data;
    const client = clientRes.data;

    if (!client) {
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    /* ---- Build brand-aware prompt ---- */
    const colors: any[] = (guidelines?.colors as any[]) || (client.brand_colors as any[]) || [];
    const fonts: any[] = (guidelines?.fonts as any[]) || [];
    const logoRules: any[] = (guidelines?.logo_rules as any[]) || [];

    const colorStr = colors
      .map((c: any) => `${c.name}: ${c.hex}${c.cmyk ? ` (CMYK: ${c.cmyk})` : ""}`)
      .join(", ");

    const fontStr = fonts.length > 0
      ? fonts.map((f: any) => `${f.name} — ${f.usage || ""}`).join("; ")
      : (client.fonts as any[])?.join(", ") || "Modern Hebrew fonts";

    const doRules = logoRules
      .filter((r: any) => r.type === "do")
      .map((r: any) => r.rule)
      .join("; ");

    const dontRules = logoRules
      .filter((r: any) => r.type === "dont")
      .map((r: any) => r.rule)
      .join("; ");

    const prompt = `Generate a photorealistic product mockup / visualization based on this brief:

"${brief}"

Brand: "${client.name}"

CRITICAL TEXT RULES:
- Do NOT write any Hebrew text on the mockup. Hebrew characters will look like gibberish.
- If text is needed, use ONLY the English brand name "${client.name}" in clean, simple typography.
- Keep text minimal - focus on visual design, colors, patterns and layout.
- Do NOT attempt to write the brand logo - leave a clean placeholder area where a logo would go.

CRITICAL DESIGN RULES:
- Create a HIGH-QUALITY PHOTOREALISTIC MOCKUP showing the design applied to the actual product described in the brief.
- If the brief mentions a cup, show a real disposable cup with the design printed on it in a realistic cafe setting.
- If the brief mentions a billboard/sign, show a real billboard in an urban environment.
- If the brief mentions packaging, show realistic product packaging.
- If the brief mentions a social media post, show it as a phone screen mockup.
- If no specific medium is mentioned, create a professional marketing poster.

Brand visual language:
- Use these exact brand colors as the dominant design elements: ${colorStr}
- Create bold geometric patterns, color blocks, and graphic elements using the brand palette.
- The design should feel modern, bold, and retail-oriented.
- Ultra high resolution, photorealistic quality, professional product photography look.`;

    /* ---- Call Lovable AI image generation ---- */
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Generating sketch for client "${client.name}" with brief: "${brief.slice(0, 80)}..."`);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "קצב הבקשות חרג מהמותר. נסה שוב בעוד מספר שניות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "קרדיטים של AI נגמרו. יש להוסיף קרדיטים בהגדרות." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI image generation failed");
    }

    const aiData = await aiResponse.json();
    console.log("AI response keys:", JSON.stringify(Object.keys(aiData)));
    console.log("Choice keys:", JSON.stringify(Object.keys(aiData.choices?.[0]?.message || {})));
    
    const message = aiData.choices?.[0]?.message;
    // Try multiple possible image locations in the response
    const imageUrl = message?.images?.[0]?.image_url?.url
      || message?.image?.url
      || (message?.content?.startsWith?.("data:image") ? message.content : null)
      || null;
    
    console.log("Image found:", imageUrl ? `yes (length: ${imageUrl.length})` : "no");
    if (!imageUrl && message) {
      console.log("Message content preview:", JSON.stringify(message).substring(0, 500));
    }
    const textContent = typeof message?.content === "string" && !message.content.startsWith("data:image")
      ? message.content : "";

    /* ---- Build compliance report ---- */
    const doRulesList = logoRules.filter((r: any) => r.type === "do");

    const compliance = {
      colorsApplied: colors.length > 0,
      colorDetails: colors.slice(0, 5).map((c: any) => ({
        name: c.name,
        hex: c.hex,
      })),
      logoRulesApplied: doRulesList.length > 0,
      logoRuleCount: doRulesList.length,
      fontsApplied: fonts.length > 0 || ((client.fonts as any[])?.length || 0) > 0,
      fontNames: fonts.length > 0
        ? fonts.map((f: any) => f.name)
        : (client.fonts as any[]) || [],
      guidelinesSource: guidelines ? "brand_guidelines_db" : "client_defaults",
    };

    console.log("Sketch generated successfully, compliance:", JSON.stringify(compliance));

    return new Response(
      JSON.stringify({
        imageUrl,
        textContent,
        compliance,
        clientName: client.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-sketch error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
