import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clients } from "@/data/clients";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBrandGuidelines } from "@/hooks/useBrandGuidelines";
import { ArrowRight, ShieldCheck, Palette, FileCheck, Sparkles, User, FileText, Circle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrandAssets from "@/components/BrandAssets";
import BrandBook from "@/components/BrandBook";
import GuidelineChecker from "@/components/GuidelineChecker";
import NanoBananaGenerator from "@/components/NanoBananaGenerator";
import PdfBrandScanner from "@/components/PdfBrandScanner";
import FileHistory, { FileVersion } from "@/components/FileHistory";
import { format } from "date-fns";

const ClientGuideline = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);
  const { extractedData, setExtractedData, isLoading, updatedAt } = useBrandGuidelines(clientId);
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [fileVersions, setFileVersions] = useState<FileVersion[]>([]);

  const handleExtracted = useCallback((data: Parameters<typeof setExtractedData>[0]) => {
    // Add to version history
    if (data.sourceFileName) {
      setFileVersions((prev) => {
        const archived = prev.map((v) => ({ ...v, isActive: false }));
        return [
          {
            id: Date.now().toString(),
            fileName: data.sourceFileName!,
            uploadedAt: new Date(),
            uploadedBy: "ליבי ג׳רבי",
            isActive: true,
          },
          ...archived,
        ];
      });
    }
    setExtractedData(data);
  }, [setExtractedData]);

  const handleDeleteVersion = useCallback((id: string) => {
    setFileVersions((prev) => prev.filter((v) => v.id !== id));
  }, []);




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

          <TabsContent value="brand" className="space-y-6">
            {/* Active File Indicator */}
            {extractedData?.sourceFileName && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm animate-in fade-in duration-300">
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 shrink-0" />
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    קובץ פעיל: {extractedData.sourceFileName}
                  </span>
                  {updatedAt && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      • {format(new Date(updatedAt), "dd/MM/yy HH:mm")}
                    </span>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-[10px] shrink-0">
                  Active
                </Badge>
              </div>
            )}

            {/* PDF Scanner */}
            <section>
              <PdfBrandScanner client={client} onExtracted={handleExtracted} role={role} />
            </section>

            {/* Brand Book or fallback */}
            {extractedData ? (
              <BrandBook extracted={extractedData} />
            ) : (
              <BrandAssets
                brandColors={client.brandColors}
                fonts={client.fonts}
                subBrands={client.subBrands}
              />
            )}

            {/* File History */}
            {fileVersions.length > 0 && (
              <section className="pt-2">
                <FileHistory
                  versions={fileVersions}
                  role={role}
                  onDelete={handleDeleteVersion}
                />
              </section>
            )}
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
