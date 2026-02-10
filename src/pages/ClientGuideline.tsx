import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clients } from "@/data/clients";
import { Button } from "@/components/ui/button";
import { useBrandGuidelines } from "@/hooks/useBrandGuidelines";
import { ArrowRight, ShieldCheck, Palette, FileCheck, Sparkles, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrandAssets from "@/components/BrandAssets";
import FindingsTable from "@/components/FindingsTable";
import GuidelineChecker from "@/components/GuidelineChecker";
import NanoBananaGenerator from "@/components/NanoBananaGenerator";
import PdfBrandScanner from "@/components/PdfBrandScanner";

const ClientGuideline = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);
  const { extractedData, setExtractedData, isLoading } = useBrandGuidelines(clientId);
  const [role, setRole] = useState<"admin" | "employee">("admin");

  const handleOverride = useCallback((id: string, newValue: string) => {
    if (!extractedData) return;
    const updated = { ...extractedData };
    const [category, indexStr] = id.split("-");
    const index = parseInt(indexStr, 10);
    if (category === "color" && !isNaN(index) && updated.colors[index]) {
      updated.colors = [...updated.colors];
      const hexMatch = newValue.match(/#[0-9a-fA-F]{6}/);
      if (hexMatch) updated.colors[index] = { ...updated.colors[index], hex: hexMatch[0] };
      updated.colors[index] = { ...updated.colors[index], name: newValue.split("|")[0]?.replace("HEX:", "").trim() || updated.colors[index].name, confidence: "exact" };
    } else if (category === "font" && !isNaN(index) && updated.fonts[index]) {
      updated.fonts = [...updated.fonts];
      updated.fonts[index] = { ...updated.fonts[index], name: newValue.split("•")[0]?.trim() || newValue, confidence: "exact" };
    } else if (category === "logo" && !isNaN(index) && updated.logoRules[index]) {
      updated.logoRules = [...updated.logoRules];
      updated.logoRules[index] = { ...updated.logoRules[index], rule: newValue, confidence: "exact" };
    }
    setExtractedData(updated);
  }, [extractedData, setExtractedData]);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">לקוח לא נמצא</h1>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה ללקוחות
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/clients")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה למאגר לקוחות
          </Button>

          {/* Role Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">הצגה בתור:</span>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "employee")}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    מנהל
                  </span>
                </SelectItem>
                <SelectItem value="employee">
                  <span className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    עובד
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Header */}
        <div className="h-2 rounded-t-lg bg-gradient-to-l from-brand-pink to-brand-purple" />
        <div className="rounded-b-lg border border-t-0 bg-card p-6 shadow-md mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink/10 to-brand-purple/10">
              <ShieldCheck className="h-7 w-7 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                גיידליין - {client.name}
              </h1>
              <p className="text-muted-foreground">{client.industry} • Brand Guard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="brand" dir="rtl" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="brand" className="gap-2">
              <Palette className="h-4 w-4" />
              נכסי מותג
            </TabsTrigger>
            <TabsTrigger value="checker" className="gap-2">
              <FileCheck className="h-4 w-4" />
              בדיקת תאימות
            </TabsTrigger>
            <TabsTrigger value="generator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              מחולל סקיצות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <section className="mb-8">
              <PdfBrandScanner client={client} onExtracted={setExtractedData} role={role} />
            </section>
            {extractedData && (
              <section className="mb-8">
                <FindingsTable
                  extracted={extractedData}
                  role={role}
                  onOverride={handleOverride}
                />
              </section>
            )}
            <BrandAssets
              brandColors={client.brandColors}
              fonts={client.fonts}
              extracted={extractedData}
              subBrands={client.subBrands}
            />
          </TabsContent>

          <TabsContent value="checker">
            <GuidelineChecker client={client} />
          </TabsContent>

          <TabsContent value="generator">
            <NanoBananaGenerator client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientGuideline;
