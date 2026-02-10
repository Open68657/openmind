import { useState, useRef, useCallback, DragEvent } from "react";
import { CheckCircle2, FileUp, ArrowLeftRight, Loader2, AlertTriangle, Info, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Discrepancy {
  type: "content" | "visual" | "specs";
  severity: "critical" | "warning" | "info";
  description: string;
}

interface ComparisonResult {
  matchScore: number;
  summary: string;
  discrepancies: Discrepancy[];
}

async function uploadToStorage(file: File, prefix: string): Promise<string> {
  const timestamp = Date.now();
  const path = `${prefix}/${timestamp}_${file.name}`;
  const { error } = await supabase.storage
    .from("finals-audit")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

const severityConfig = {
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "קריטי" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", label: "אזהרה" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", label: "מידע" },
};

const typeLabels: Record<string, string> = {
  content: "תוכן",
  visual: "ויזואלי",
  specs: "מפרט מותג",
};

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
const ACCEPT_STRING = "image/*,application/pdf";

const FinalsAudit = () => {
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [finalPreview, setFinalPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [dragOver, setDragOver] = useState<"sketch" | "final" | null>(null);
  const sketchRef = useRef<HTMLInputElement>(null);
  const finalRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = useCallback((file: File, type: "sketch" | "final") => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "סוג קובץ לא נתמך", description: "יש להעלות תמונה או PDF", variant: "destructive" });
      return;
    }
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    if (type === "sketch") {
      setSketchFile(file);
      setSketchPreview(url);
    } else {
      setFinalFile(file);
      setFinalPreview(url);
    }
    setResult(null);
  }, [toast]);

  const handleFile = useCallback(
    (type: "sketch" | "final") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file, type);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (type: "sketch" | "final") => (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      processFile(file, type);
    },
    [processFile]
  );

  const handleDragOver = useCallback(
    (type: "sketch" | "final") => (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(type);
    },
    []
  );

  const handleDragLeave = useCallback(() => setDragOver(null), []);

  const handleCompare = async () => {
    if (!sketchFile || !finalFile) {
      toast({ title: "חסרים קבצים", description: "יש להעלות סקיצה וקובץ פיינל.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Upload files to storage first
      const [sketchPath, finalPath] = await Promise.all([
        uploadToStorage(sketchFile, "sketches"),
        uploadToStorage(finalFile, "finals"),
      ]);

      const { data, error } = await supabase.functions.invoke("compare-finals", {
        body: {
          sketchPath,
          finalPath,
          sketchName: sketchFile.name,
          finalName: finalFile.name,
          sketchMimeType: sketchFile.type || "image/png",
          finalMimeType: finalFile.type || "image/png",
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "שגיאה", description: data.error, variant: "destructive" });
        return;
      }

      setResult(data);
    } catch (err: any) {
      toast({ title: "שגיאה בהשוואה", description: err.message || "נסה שוב", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 95) return "text-green-600";
    if (score >= 80) return "text-amber-600";
    return "text-destructive";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 95) return "bg-green-500";
    if (score >= 80) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="h-2 rounded-t-lg bg-gradient-to-l from-brand-pink to-brand-purple" />
        <div className="rounded-b-lg border border-t-0 bg-card p-6 shadow-md mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink/10 to-brand-purple/10">
              <ArrowLeftRight className="h-7 w-7 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">בדיקת פיינלים</h1>
              <p className="text-muted-foreground">השוואה חכמה בין סקיצה מאושרת לקובץ פיינל</p>
            </div>
          </div>
        </div>

        {/* Upload Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sketch Upload */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer group ${
              dragOver === "sketch"
                ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
                : "border-border hover:border-brand-purple/40"
            }`}
            onClick={() => sketchRef.current?.click()}
            onDrop={handleDrop("sketch")}
            onDragOver={handleDragOver("sketch")}
            onDragLeave={handleDragLeave}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 min-h-[260px]">
              <input
                ref={sketchRef}
                type="file"
                accept={ACCEPT_STRING}
                className="hidden"
                onChange={handleFile("sketch")}
              />
              {sketchFile ? (
                <div className="w-full space-y-3">
                  {sketchPreview ? (
                    <img src={sketchPreview} alt="sketch preview" className="w-full h-40 object-contain rounded-lg" />
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center rounded-lg bg-muted/50">
                      <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">PDF</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground truncate">{sketchFile.name}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20 mb-4 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">סקיצה מאושרת</h3>
                  <p className="text-sm text-muted-foreground">לחצ/י להעלאת הסקיצה או גרור/י לכאן</p>
                  <p className="text-xs text-muted-foreground mt-1">תמונות ו-PDF</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Final Upload */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer group ${
              dragOver === "final"
                ? "border-brand-purple bg-brand-purple/5"
                : "border-border hover:border-brand-purple/40"
            }`}
            onClick={() => finalRef.current?.click()}
            onDrop={handleDrop("final")}
            onDragOver={handleDragOver("final")}
            onDragLeave={handleDragLeave}
          >
            <CardContent className="flex flex-col items-center justify-center py-10 min-h-[260px]">
              <input
                ref={finalRef}
                type="file"
                accept={ACCEPT_STRING}
                className="hidden"
                onChange={handleFile("final")}
              />
              {finalFile ? (
                <div className="w-full space-y-3">
                  {finalPreview ? (
                    <img src={finalPreview} alt="final preview" className="w-full h-40 object-contain rounded-lg" />
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center rounded-lg bg-muted/50">
                      <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">PDF</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <FileUp className="h-4 w-4 text-brand-purple" />
                    <span className="text-sm font-medium text-foreground truncate">{finalFile.name}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple/10 mb-4 group-hover:scale-105 transition-transform">
                    <FileUp className="h-8 w-8 text-brand-purple" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">קובץ פיינל</h3>
                  <p className="text-sm text-muted-foreground">לחצ/י להעלאת הקובץ הסופי או גרור/י לכאן</p>
                  <p className="text-xs text-muted-foreground mt-1">תמונות ו-PDF</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compare Button */}
        <div className="flex justify-center mb-10">
          <Button
            size="lg"
            onClick={handleCompare}
            disabled={!sketchFile || !finalFile || loading}
            className="px-10 py-6 text-lg gap-3 bg-gradient-to-l from-brand-pink to-brand-purple hover:opacity-90 shadow-lg shadow-brand-purple/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                מנתח קבצים...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                השווה קבצים
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Match Score */}
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-1.5 bg-gradient-to-l from-brand-pink to-brand-purple" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">תוצאת ההשוואה</h2>
                  <div className={`text-4xl font-bold ${scoreColor(result.matchScore)}`}>
                    {result.matchScore}%
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute inset-y-0 right-0 rounded-full transition-all duration-1000 ${scoreBarColor(result.matchScore)}`}
                    style={{ width: `${result.matchScore}%` }}
                  />
                </div>
                {result.summary && (
                  <p className="text-sm text-muted-foreground mt-4">{result.summary}</p>
                )}
              </CardContent>
            </Card>

            {/* Discrepancies */}
            {result.discrepancies.length > 0 ? (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    סטיות שנמצאו ({result.discrepancies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.discrepancies.map((d, i) => {
                    const config = severityConfig[d.severity];
                    const Icon = config.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-lg p-3 ${config.bg}`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{d.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {typeLabels[d.type] || d.type}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col items-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">הקבצים תואמים! ✅</h3>
                  <p className="text-sm text-muted-foreground">לא נמצאו סטיות בין הסקיצה לפיינל</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalsAudit;
