import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clients, ExtractedBrandData } from "@/data/clients";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Palette, FileCheck, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BrandAssets from "@/components/BrandAssets";
import GuidelineChecker from "@/components/GuidelineChecker";
import NanoBananaGenerator from "@/components/NanoBananaGenerator";
import PdfBrandScanner from "@/components/PdfBrandScanner";

const ClientGuideline = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);
  const [extractedData, setExtractedData] = useState<ExtractedBrandData | null>(null);

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
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/clients")}>
          <ArrowRight className="h-4 w-4 ml-2" />
          חזרה למאגר לקוחות
        </Button>

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
              <PdfBrandScanner client={client} onExtracted={setExtractedData} />
            </section>
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
