import { useState, useRef } from "react";
import { Client } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle, XCircle, FileCheck } from "lucide-react";

interface GuidelineCheckerProps {
  client: Client;
}

const GuidelineChecker = ({ client }: GuidelineCheckerProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<{ font: boolean; color: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    // Simulate a guideline check with random results
    setTimeout(() => {
      setResults({
        font: Math.random() > 0.3,
        color: Math.random() > 0.4,
      });
    }, 800);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5 text-brand-purple" />
          בודק תאימות גיידליין
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.ai,.psd"
          onChange={handleFileSelect}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-brand-purple/50 transition-colors p-8 text-center group"
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground/40 group-hover:text-brand-purple/60 transition-colors mb-3" />
          {fileName ? (
            <p className="text-sm font-medium text-foreground">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                גרור קובץ לכאן או לחץ להעלאה
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                תמונה, PDF, AI, PSD
              </p>
            </>
          )}
        </div>

        {results && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Alert
              variant={results.font ? "default" : "destructive"}
              className={results.font ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : ""}
            >
              {results.font ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle className={results.font ? "text-green-800 dark:text-green-200" : ""}>
                {results.font ? "הפונט תקין ✓" : "הפונט לא תואם לגיידליין"}
              </AlertTitle>
              <AlertDescription className={results.font ? "text-green-700 dark:text-green-300" : ""}>
                {results.font
                  ? `הגופן תואם לגיידליין של ${client.name}`
                  : `יש להשתמש בגופנים: ${client.fonts.join(", ")}`}
              </AlertDescription>
            </Alert>

            <Alert
              variant={results.color ? "default" : "destructive"}
              className={results.color ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : ""}
            >
              {results.color ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle className={results.color ? "text-green-800 dark:text-green-200" : ""}>
                {results.color ? "הצבעים תקינים ✓" : "צבע לא בערכי המותג"}
              </AlertTitle>
              <AlertDescription className={results.color ? "text-green-700 dark:text-green-300" : ""}>
                {results.color
                  ? `הצבעים תואמים לפלטת ${client.name}`
                  : `הצבעים המותרים: ${client.brandColors.map((c) => c.hex).join(", ")}`}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuidelineChecker;
