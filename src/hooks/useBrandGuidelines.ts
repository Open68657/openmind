import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExtractedBrandData } from "@/data/clients";
import { toast } from "@/components/ui/sonner";

export function useBrandGuidelines(clientId: string | undefined) {
  const [extractedData, setExtractedData] = useState<ExtractedBrandData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Load from DB on mount
  useEffect(() => {
    if (!clientId) return;
    setIsLoading(true);
    supabase
      .from("brand_guidelines")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading brand guidelines:", error);
        } else if (data) {
          setExtractedData({
            colors: (data.colors as any[]) || [],
            fonts: (data.fonts as any[]) || [],
            logoRules: (data.logo_rules as any[]) || [],
            subBrands: (data.sub_brands as any[]) || [],
            sourceFileName: data.source_file_name || undefined,
            summary: typeof data.summary === 'object' ? data.summary as any : undefined,
          });
          setUpdatedAt(data.updated_at);
        }
        setIsLoading(false);
      });
  }, [clientId]);

  // Save to DB
  const saveData = useCallback(
    async (data: ExtractedBrandData) => {
      if (!clientId) return;
      setExtractedData(data);

      const row = {
        client_id: clientId,
        colors: data.colors as any,
        fonts: data.fonts as any,
        logo_rules: data.logoRules as any,
        sub_brands: data.subBrands as any,
        source_file_name: data.sourceFileName || null,
        summary: data.summary || null,
      };

      const { data: result, error } = await supabase
        .from("brand_guidelines")
        .upsert(row as any, { onConflict: "client_id" })
        .select("updated_at")
        .maybeSingle();

      if (error) {
        console.error("Error saving brand guidelines:", error);
        toast.error("שגיאה בשמירת הנתונים");
      } else if (result) {
        setUpdatedAt(result.updated_at);
      }
    },
    [clientId]
  );

  return { extractedData, setExtractedData: saveData, isLoading, updatedAt };
}
