import { useState, useRef, useCallback } from "react";
import { Client, ExtractedBrandData, simulatedExtractions } from "@/data/clients";
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
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [versions, setVersions] = useState<PdfVersion[]>([
    {
      id: 1,
      fileName: `${client.name}_BrandBook_2024.pdf`,
      uploadedAt: new Date(2024, 3, 15, 10, 30),
      uploadedBy: "דניאל כהן",
      isActive: true,
    },
  ]);

  const activeVersion = versions.find((v) => v.isActive);

  const startAnalysis = useCallback(
    (name: string) => {
      setIsAnalyzing(true);
      setCurrentStep(0);

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < STEPS.length) {
          setCurrentStep(step);
        } else {
          clearInterval(interval);
          setIsAnalyzing(false);

          // Archive old active version
          setVersions((prev) => {
            const archived = prev.map((v) => ({ ...v, isActive: false }));
            return [
              {
                id: Date.now(),
                fileName: name,
                uploadedAt: new Date(),
                uploadedBy: "דניאל כהן",
                isActive: true,
              },
              ...archived,
            ];
          });

          const data =
            simulatedExtractions[client.id] || simulatedExtractions.default;
          onExtracted(data);
          toast.success("הגיידליין עודכן בהצלחה במערכת", {
            description: `ספר המותג של ${client.name} נותח ונשמר`,
          });
        }
      }, 700);
    },
    [client, onExtracted]
  );

  const handleFile = (file: File) => {
    if (role !== "admin") {
      toast.error("אין לך הרשאה להחליף קובץ");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("יש להעלות קובץ PDF בלבד");
      return;
    }
    startAnalysis(file.name);
  };

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
                  הקובץ הקיים יועבר לארכיון אוטומטית
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
                        i <= currentStep
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Archive */}
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
                      <p className="text-sm font-medium text-foreground">
                        {v.fileName}
                      </p>
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
    </div>
  );
};

export default PdfBrandScanner;
