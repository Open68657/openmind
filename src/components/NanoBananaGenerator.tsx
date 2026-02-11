import { useState, useRef } from "react";
import { Client } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ImageIcon, Loader2, Check, X, Palette, Type, Ruler, Shield, FileText, Upload, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface NanoBananaGeneratorProps {
  client: Client;
}

interface ComplianceData {
  colorsApplied: boolean;
  colorDetails: { name: string; hex: string }[];
  logoRulesApplied: boolean;
  logoRuleCount: number;
  fontsApplied: boolean;
  fontNames: string[];
}

const ACCEPTED_LOGO_TYPES = ".png,.jpg,.jpeg,.svg,.webp,.gif,.bmp,.tiff,.ai,.eps,.pdf";

const NanoBananaGenerator = ({ client }: NanoBananaGeneratorProps) => {
  const briefTemplate = `סוג המוצר להדמייה: (כוס חד-פעמית / אריזה / שקית / קופסה / שלט חוצות / רול-אפ / פוסט / סטורי / באנר)
מה ההדמייה צריכה להציג: (המוצר בסביבה טבעית / מוקאפ סטודיו / פלאט-ליי)
רעיון עיצובי: (תיאור קצר של הקונספט או הסגנון הרצוי)
טקסט שיופיע על המוצר: 
מבצע / קמפיין: (שם המבצע אם יש)
הערות נוספות: `;

  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleLoadTemplate = () => {
    setBrief(briefTemplate);
  };

  const processLogoFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("הקובץ גדול מדי. מקסימום 10MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setCompliance(null);

    try {
      // Convert logo to base64 if provided
      let logoBase64: string | null = null;
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sketch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ brief, clientId: client.id, logoBase64 }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "שגיאה ביצירת הסקיצה");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (!data.imageUrl) {
        throw new Error("המודל לא הצליח ליצור תמונה. נסה שוב עם בריף אחר.");
      }

      setGeneratedImage(data.imageUrl);
      setCompliance(data.compliance);
      toast.success("הסקיצה נוצרה בהצלחה!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה ביצירת הסקיצה";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            מחולל סקיצות Nano Banana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                בריף ליצירה
              </label>
              {!brief && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadTemplate}
                  className="text-xs gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  טען טמפלייט בריף
                </Button>
              )}
            </div>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={`לדוגמה: פוסט למבצע קיץ של ${client.name}`}
              className="min-h-[180px] resize-none leading-relaxed"
            />
          </div>

          {/* Logo upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              לוגו להלבשה על ההדמייה (אופציונלי)
            </label>
            <input
              ref={logoInputRef}
              type="file"
              accept={ACCEPTED_LOGO_TYPES}
              onChange={handleLogoUpload}
              className="hidden"
            />
            {logoPreview ? (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
                <img
                  src={logoPreview}
                  alt="לוגו שהועלה"
                  className="h-12 w-12 object-contain rounded bg-card"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{logoFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {logoFile && (logoFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={removeLogo} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => logoInputRef.current?.click()}
                className={`w-full h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  גרור לוגו לכאן או <span className="underline">בחר קובץ</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60">PNG, SVG, JPG, PDF, AI, EPS</p>
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
                מייצר סקיצה...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                צור סקיצה לפי גיידליין
              </>
            )}
          </Button>

          {/* Result area */}
          <div
            className={`rounded-xl border-2 border-dashed transition-all duration-500 overflow-hidden ${
              generatedImage
                ? "border-brand-purple/30 bg-gradient-to-br from-brand-pink/5 to-brand-purple/5 p-2"
                : isGenerating
                  ? "border-brand-purple/20 p-10"
                  : "border-border p-10"
            }`}
          >
            {isGenerating ? (
              <div className="text-center space-y-3">
                <div className="relative mx-auto w-14 h-14">
                  <Sparkles className="h-14 w-14 text-brand-purple/20" />
                  <Loader2 className="h-7 w-7 animate-spin text-brand-purple absolute top-3.5 left-3.5" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  מייצר סקיצה מבוססת גיידליין...
                </p>
                <p className="text-xs text-muted-foreground/60">
                  זה עשוי לקחת 10-20 שניות
                </p>
              </div>
            ) : generatedImage ? (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                <img
                  src={generatedImage}
                  alt={`סקיצה שנוצרה עבור ${client.name}`}
                  className="w-full rounded-lg shadow-sm"
                />
                {/* Color chips */}
                <div className="flex gap-2 flex-wrap justify-center">
                  {client.brandColors.slice(0, 4).map((c) => (
                    <span
                      key={c.hex}
                      className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border border-border"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                      {c.cmyk && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({c.cmyk})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-center space-y-2">
                <X className="h-10 w-10 mx-auto text-destructive/40" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">הסקיצה תופיע כאן</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Brand Compliance checklist */}
      {compliance && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-brand-purple" />
              בדיקת תאימות מותג
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ComplianceItem
                passed={compliance.colorsApplied}
                icon={<Palette className="h-4 w-4" />}
                title="HEX נכון בשימוש"
              >
                <div className="flex gap-1 flex-wrap mt-1">
                  {compliance.colorDetails?.map((c) => (
                    <span
                      key={c.hex}
                      className="inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 bg-card border border-border/50"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                      {c.hex}
                    </span>
                  ))}
                </div>
              </ComplianceItem>
              <ComplianceItem
                passed={compliance.logoRulesApplied}
                icon={<Ruler className="h-4 w-4" />}
                title="Safe Zone לוגו"
              >
                <p className="text-[11px] text-muted-foreground mt-1">
                  {compliance.logoRulesApplied
                    ? `${compliance.logoRuleCount} כללי לוגו הוחלו`
                    : "לא נמצאו כללי לוגו"}
                </p>
              </ComplianceItem>
              <ComplianceItem
                passed={compliance.fontsApplied}
                icon={<Type className="h-4 w-4" />}
                title="פונט מאושר"
              >
                <div className="flex gap-1 flex-wrap mt-1">
                  {compliance.fontNames?.slice(0, 3).map((f) => (
                    <span key={f} className="text-[10px] bg-card rounded px-1.5 py-0.5 border border-border/50">
                      {f}
                    </span>
                  ))}
                </div>
              </ComplianceItem>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function ComplianceItem({
  passed,
  icon,
  title,
  children,
}: {
  passed: boolean;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        passed
          ? "border-green-200 bg-green-50/60 dark:border-green-800/40 dark:bg-green-950/20"
          : "border-destructive/20 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {passed ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <X className="h-4 w-4 text-destructive" />
        )}
        <span className="flex items-center gap-1 text-xs font-semibold">
          {icon}
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default NanoBananaGenerator;
