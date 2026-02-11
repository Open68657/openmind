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
    const { brief, clientId, styleImage } = await req.json();

    if (!brief || !clientId) {
      return new Response(
        JSON.stringify({ error: "brief and clientId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [guidelinesRes, clientRes] = await Promise.all([
      supabase.from("brand_guidelines").select("*").eq("client_id", clientId).maybeSingle(),
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

    const colors: any[] = (guidelines?.colors as any[]) || (client.brand_colors as any[]) || [];
    const fonts: any[] = (guidelines?.fonts as any[]) || [];

    const colorStr = colors
      .map((c: any) => `${c.name}: ${c.hex}${c.cmyk ? ` (CMYK: ${c.cmyk})` : ""}`)
      .join(", ");

    const fontStr = fonts.length > 0
      ? fonts.map((f: any) => `${f.name} — ${f.usage || ""}`).join("; ")
      : (client.fonts as any[])?.join(", ") || "Modern fonts";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Generate 5 logos in parallel
    const basePrompt = `You are a world-class logo designer. Create a SINGLE professional logo design based on this brief:

"${brief}"

Brand: "${client.name}"
Brand colors: ${colorStr}
Brand fonts: ${fontStr}

CRITICAL RULES:
- Create a CLEAN, PROFESSIONAL logo design on a pure white background.
- The logo should be SIMPLE, MEMORABLE, and SCALABLE.
- Use ONLY the brand colors specified above.
- Do NOT write any Hebrew text. Use only the English brand name "${client.name}" if text is needed, or make it purely symbolic/iconic.
- The logo should work at small sizes (favicon) and large sizes (billboard).
- Output a single logo centered on white background.
- Make it look like a real professional logo, not an illustration.
- Ultra high resolution, vector-style clean edges.`;

    const variations = [
      "Create a WORDMARK style logo — focus on beautiful typography and letterforms.",
      "Create an ICON/SYMBOL style logo — a memorable abstract or figurative symbol without text.",
      "Create a COMBINATION MARK — an icon paired with the brand name in clean typography.",
      "Create a LETTERMARK/MONOGRAM style logo — using the brand initials in a creative way.",
      "Create an EMBLEM style logo — the brand name integrated into a shape or badge design.",
    ];

    console.log(`Generating 5 logos for client "${client.name}" with brief: "${brief.slice(0, 80)}..."`);

    const generateOne = async (variationPrompt: string, index: number) => {
      const explanationRequest = `\n\nAFTER generating the logo, write a SHORT explanation in Hebrew (2-3 sentences) covering:
1. How this logo matches the brief "${brief}"
2. How it adheres to the brand guidelines (colors, fonts, style)
${styleImage ? "3. How it draws inspiration from the provided reference image" : ""}
Keep the explanation concise and professional.`;

      const messageContent: any[] = [
        { type: "text", text: `${basePrompt}\n\nSTYLE DIRECTION: ${variationPrompt}${explanationRequest}` },
      ];

      if (styleImage) {
        messageContent[0].text += `\n\nIMPORTANT: I am attaching a reference image showing the style/aesthetic I want. Use it as INSPIRATION for the overall look and feel, but create an ORIGINAL logo design.`;
        messageContent.push({ type: "image_url", image_url: { url: styleImage } });
      }

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
            messages: [{ role: "user", content: messageContent }],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) throw new Error("rate_limit");
        if (aiResponse.status === 402) throw new Error("credits_exhausted");
        const errText = await aiResponse.text();
        console.error(`Logo ${index + 1} error:`, aiResponse.status, errText);
        return null;
      }

      const aiData = await aiResponse.json();
      const message = aiData.choices?.[0]?.message;
      const imageUrl = message?.images?.[0]?.image_url?.url
        || message?.image?.url
        || (message?.content?.startsWith?.("data:image") ? message.content : null)
        || null;

      // Extract text explanation
      const explanation = typeof message?.content === "string" && !message.content.startsWith("data:image")
        ? message.content.trim()
        : "";

      console.log(`Logo ${index + 1}: ${imageUrl ? "success" : "no image"}, explanation: ${explanation ? "yes" : "no"}`);
      return { imageUrl, explanation };
    };

    // Run all 5 in parallel
    const results = await Promise.allSettled(
      variations.map((v, i) => generateOne(v, i))
    );

    const logoResults = results.map((r) =>
      r.status === "fulfilled" ? r.value : null
    );

    // Check for rate limit / credits errors
    const firstError = results.find(
      (r) => r.status === "rejected"
    );
    if (firstError && firstError.status === "rejected") {
      const errMsg = firstError.reason?.message;
      if (errMsg === "rate_limit") {
        return new Response(
          JSON.stringify({ error: "קצב הבקשות חרג מהמותר. נסה שוב בעוד מספר שניות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (errMsg === "credits_exhausted") {
        return new Response(
          JSON.stringify({ error: "קרדיטים של AI נגמרו. יש להוסיף קרדיטים בהגדרות." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const successCount = logoResults.filter((r) => r?.imageUrl).length;
    console.log(`Generated ${successCount}/5 logos successfully`);

    if (successCount === 0) {
      throw new Error("לא הצלחנו ליצור לוגואים. נסה שוב.");
    }

    return new Response(
      JSON.stringify({
        clientName: client.name,
        variations: variations.map((v, i) => ({
          type: ["Wordmark", "Icon/Symbol", "Combination", "Lettermark", "Emblem"][i],
          imageUrl: logoResults[i]?.imageUrl || null,
          explanation: logoResults[i]?.explanation || "",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-logos error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
