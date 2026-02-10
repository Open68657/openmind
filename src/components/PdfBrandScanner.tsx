import { useState, useRef, useCallback } from "react";
import { Client, ExtractedBrandData, simulatedExtractions } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Loader2, CheckCircle, FileText } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface PdfBrandScannerProps {
  client: Client;
  onExtracted: (data: ExtractedBrandData) => void;
}

const STEPS = [
  "מנתח חוקי מותג...",
  "מזהה צבעים ופלטות...",
  "מחלץ טיפוגרפיה...",
  "סורק הנחיות לוגו...",
  "מסכם ממצאים...",
];

const PdfBrandScanner = ({ client, onExtracted }: PdfBrandScannerProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = useCallback(
    (name: string) => {
      setFileName(name);
      setIsAnalyzing(true);
      setIsDone(false);
      setCurrentStep(0);

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < STEPS.length) {
          setCurrentStep(step);
        } else {
          clearInterval(interval);
          setIsAnalyzing(false);
          setIsDone(true);

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
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-brand-purple" />
          סריקת ספר מותג (PDF)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {!isAnalyzing && !isDone && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-10 text-center group ${
              isDragOver
                ? "border-brand-purple bg-brand-purple/5 scale-[1.01]"
                : "border-border hover:border-brand-purple/50"
            }`}
          >
            <FileUp
              className={`h-12 w-12 mx-auto mb-3 transition-colors ${
                isDragOver
                  ? "text-brand-purple"
                  : "text-muted-foreground/40 group-hover:text-brand-purple/60"
              }`}
            />
            <p className="text-sm font-medium text-foreground">
              גרור קובץ PDF לכאן או לחץ להעלאה
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ספר מותג / Brand Book בפורמט PDF
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="rounded-xl border border-border bg-muted/30 p-8 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <Loader2 className="h-10 w-10 mx-auto text-brand-purple animate-spin mb-3" />
              <p className="text-sm font-medium text-foreground">{fileName}</p>
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

        {isDone && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-3" />
            <p className="text-sm font-bold text-green-800 dark:text-green-200">
              הגיידליין עודכן בהצלחה במערכת
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ספר המותג "{fileName}" נותח — נכסי המותג עודכנו למטה
            </p>
            <button
              onClick={() => {
                setIsDone(false);
                setFileName(null);
              }}
              className="mt-3 text-xs text-green-700 dark:text-green-300 underline underline-offset-2 hover:no-underline"
            >
              סרוק קובץ נוסף
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfBrandScanner;
