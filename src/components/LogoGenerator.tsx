import { useState, useRef } from "react";
import { Client } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ImageIcon, Loader2, Upload, Trash2, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface LogoGeneratorProps {
  client: Client;
}

interface LogoVariation {
  type: string;
  imageUrl: string | null;
}

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff";

const LogoGenerator = ({ client }: LogoGeneratorProps) => {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<LogoVariation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [styleImage, setStyleImage] = useState<{ file: File; preview: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי. מקסימום 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) =>
      setStyleImage({ file, preview: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeStyleImage = () => {
    setStyleImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setError(null);
    setVariations([]);

    try {
      let styleBase64: string | null = null;
      if (styleImage) {
        styleBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(styleImage.file);
        });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-logos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            brief,
            clientId: client.id,
            styleImage: styleBase64,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "שגיאה ביצירת הלוגואים");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setVariations(data.variations || []);
      const count = (data.variations || []).filter((v: LogoVariation) => v.imageUrl).length;
      toast.success(`${count} לוגואים נוצרו בהצלחה!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה ביצירת הלוגואים";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${client.name}-logo-${index + 1}.png`;
    link.click();
  };

  const LOGO_TYPES_HE: Record<string, string> = {
    Wordmark: "וורדמארק",
    "Icon/Symbol": "אייקון / סמל",
    Combination: "שילוב",
    Lettermark: "מונוגרם",
    Emblem: "אמבלם",
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            מחולל לוגואים
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brief */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              תאר את הלוגו הרצוי
            </label>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={`לדוגמה: לוגו מינימליסטי ומודרני ל${client.name} עם אלמנט גרפי של עלה ירוק`}
              className="min-h-[120px] resize-none leading-relaxed"
            />
          </div>

          {/* Style reference image */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              תמונת השראה לסגנון (אופציונלי)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={handleFileUpload}
              className="hidden"
            />
            {styleImage ? (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
                <img
                  src={styleImage.preview}
                  alt="תמונת השראה"
                  className="h-14 w-14 object-cover rounded-lg bg-card border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {styleImage.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(styleImage.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeStyleImage} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  גרור תמונה של לוגואים בסגנון הרצוי או{" "}
                  <span className="underline">בחר קובץ</span>
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!brief.trim() || isGenerating}
            className="w-full bg-gradient-to-l from-brand-pink to-brand-purple text-white hover:opacity-90 transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                מייצר 5 לוגואים...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                צור 5 וריאציות לוגו
              </>
            )}
          </Button>

          {/* Loading state */}
          {isGenerating && (
            <div className="rounded-xl border-2 border-dashed border-brand-purple/20 p-10 text-center space-y-3">
              <div className="relative mx-auto w-14 h-14">
                <Sparkles className="h-14 w-14 text-brand-purple/20" />
                <Loader2 className="h-7 w-7 animate-spin text-brand-purple absolute top-3.5 left-3.5" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                מייצר 5 וריאציות לוגו מותאמות גיידליין...
              </p>
              <p className="text-xs text-muted-foreground/60">
                זה עשוי לקחת 30-60 שניות
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isGenerating && (
            <div className="rounded-xl border-2 border-dashed border-destructive/30 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Results grid */}
          {variations.length > 0 && !isGenerating && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h3 className="text-sm font-semibold text-foreground">
                תוצאות — {variations.filter((v) => v.imageUrl).length} לוגואים
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {variations.map((v, i) =>
                  v.imageUrl ? (
                    <div
                      key={i}
                      className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square p-3 flex items-center justify-center bg-white">
                        <img
                          src={v.imageUrl}
                          alt={`לוגו ${v.type}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="px-3 py-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {LOGO_TYPES_HE[v.type] || v.type}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownload(v.imageUrl!, i)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {variations.length === 0 && !isGenerating && !error && (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">הלוגואים יופיעו כאן</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoGenerator;
