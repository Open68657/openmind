import { useState, useRef, useCallback } from "react";
import { Client, ExtractedBrandData } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  Loader2,
  CheckCircle,
  FileText,
  Download,
  Clock,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface PdfVersion {
  id: number;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  isActive: boolean;
}

interface PdfBrandScannerProps {
  client: Client;
  onExtracted: (data: ExtractedBrandData) => void;
  role: "admin" | "employee";
}

const STEPS = [
  "מעלה קובץ לשרת...",
  "מנתח חוקי מותג...",
  "מזהה צבעים ופלטות...",
  "מחלץ טיפוגרפיה...",
  "סורק הנחיות לוגו...",
  "מסכם ממצאים...",
];

const PdfBrandScanner = ({ client, onExtracted, role }: PdfBrandScannerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<PdfVersion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeVersion = versions.find((v) => v.isActive);

  const startStepAnimation = useCallback(() => {
    setCurrentStep(0);
    let step = 0;
    stepIntervalRef.current = setInterval(() => {
      step++;
      if (step < STEPS.length) {
        setCurrentStep(step);
      }
    }, 2000);
  }, []);

  const stopStepAnimation = useCallback(() => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
    setCurrentStep(STEPS.length - 1);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (role !== "admin") {
        toast.error("אין לך הרשאה להחליף קובץ");
        return;
      }
      if (file.type !== "application/pdf") {
        toast.error("יש להעלות קובץ PDF בלבד");
        return;
      }

      setIsAnalyzing(true);
      setErrorMessage(null);
      startStepAnimation();

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientName", client.name);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-brand-pdf`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );

        stopStepAnimation();

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const msg = errorData?.error || "שגיאה בניתוח הקובץ";
          setErrorMessage(msg);
          setIsAnalyzing(false);
          toast.error(msg);
          return;
        }

        const extracted = await response.json();

        // Transform to ExtractedBrandData format - preserve all fields including page & confidence
        const brandData: ExtractedBrandData = {
          colors: (extracted.colors || []).map((c: any) => ({
            name: c.name || "לא ידוע",
            hex: c.hex || null,
            cmyk: c.cmyk || undefined,
            rgb: c.rgb || undefined,
            pantone: c.pantone || undefined,
            page: c.page || undefined,
            confidence: c.confidence || "exact",
          })),
          fonts: (extracted.fonts || []).map((f: any) => ({
            name: f.name || "לא נמצא",
            weight: f.weight || undefined,
            size: f.size || "לא נמצא",
            usage: f.usage || "לא נמצא",
            page: f.page || undefined,
            confidence: f.confidence || "exact",
          })),
          logoRules: (extracted.logoRules || []).map((r: any) => ({
            rule: r.rule,
            type: r.type === "dont" ? "dont" : "do",
            page: r.page || undefined,
            confidence: r.confidence || "exact",
          })),
          subBrands: (extracted.subBrands || []).map((sb: any) => ({
            name: sb.name,
            nameHe: sb.nameHe || null,
            page: sb.page || undefined,
          })),
          sourceFileName: extracted.sourceFileName || file.name,
          summary: extracted.summary || undefined,
        };

        // Archive old versions and add new
        setVersions((prev) => {
          const archived = prev.map((v) => ({ ...v, isActive: false }));
          return [
            {
              id: Date.now(),
              fileName: file.name,
              uploadedAt: new Date(),
              uploadedBy: "ליבי ג׳רבי",
              isActive: true,
            },
            ...archived,
          ];
        });

        onExtracted(brandData);
        setIsAnalyzing(false);
        toast.success("הגיידליין עודכן בהצלחה במערכת", {
          description: `ערכים חולצו מ-${file.name}`,
        });
      } catch (err) {
        stopStepAnimation();
        setIsAnalyzing(false);
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [client, onExtracted, role, startStepAnimation, stopStepAnimation]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-brand-purple" />
              סריקת ספר מותג (PDF)
            </CardTitle>
            {role === "admin" && (
              <Badge className="bg-gradient-to-l from-brand-pink to-brand-purple text-white border-0 gap-1">
                <ShieldCheck className="h-3 w-3" />
                מנהל
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active file status */}
          {activeVersion && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      קובץ פעיל: {activeVersion.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      עודכן לאחרונה ע"י: {activeVersion.uploadedBy} •{" "}
                      {format(activeVersion.uploadedAt, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  הורדה
                </Button>
              </div>
            </div>
          )}

          {/* Upload area - Admin only */}
          {role === "admin" && !isAnalyzing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  if (e.target) e.target.value = "";
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center group ${
                  isDragOver
                    ? "border-brand-purple bg-brand-purple/5 scale-[1.01]"
                    : "border-border hover:border-brand-purple/50"
                }`}
              >
                <FileUp
                  className={`h-10 w-10 mx-auto mb-3 transition-colors ${
                    isDragOver
                      ? "text-brand-purple"
                      : "text-muted-foreground/40 group-hover:text-brand-purple/60"
                  }`}
                />
                <p className="text-sm font-medium text-foreground">
                  העלה ספר מותג חדש (PDF)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  המערכת תחלץ אוטומטית צבעים, פונטים וחוקי לוגו
                </p>
              </div>
            </>
          )}

          {/* Employee locked view */}
          {role === "employee" && !isAnalyzing && (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                רק מנהלים יכולים להעלות ולעדכן קבצי גיידליין
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                באפשרותך לצפות ולהוריד את הגרסה הפעילה
              </p>
            </div>
          )}

          {/* Analysis progress */}
          {isAnalyzing && (
            <div className="rounded-xl border border-border bg-muted/30 p-8 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <Loader2 className="h-10 w-10 mx-auto text-brand-purple animate-spin mb-3" />
                <p className="text-sm font-medium text-foreground">מנתח ספר מותג...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  החילוץ מתבצע באמצעות AI — עשוי לקחת עד 30 שניות
                </p>
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i < currentStep ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : i === currentStep ? (
                      <Loader2 className="h-4 w-4 text-brand-purple animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && !isAnalyzing && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 animate-in fade-in duration-300">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">שגיאה בניתוח</p>
                <p className="text-xs text-destructive/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Archive - only show if there are versions */}
      {versions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                ארכיון גרסאות
                <Badge variant="secondary" className="text-[10px]">
                  {versions.length}
                </Badge>
              </CardTitle>
              {showArchive ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showArchive && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      v.isActive
                        ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${
                          v.isActive ? "text-green-600" : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{v.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(v.uploadedAt, "dd/MM/yyyy HH:mm")} • {v.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.isActive && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-[10px]">
                          פעיל
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default PdfBrandScanner;
