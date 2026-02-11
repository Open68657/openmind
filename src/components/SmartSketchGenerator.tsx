import { useState } from "react";
import { clients } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ImageIcon,
  Loader2,
  Check,
  X,
  Shield,
  Palette,
  Type,
  Ruler,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface ComplianceData {
  colorsApplied: boolean;
  colorDetails: { name: string; hex: string }[];
  logoRulesApplied: boolean;
  logoRuleCount: number;
  fontsApplied: boolean;
  fontNames: string[];
  guidelinesSource: string;
}

const SmartSketchGenerator = () => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleGenerate = async () => {
    if (!brief.trim() || !selectedClientId) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setCompliance(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sketch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ brief, clientId: selectedClientId }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "שגיאה ביצירת הסקיצה");
      }

      const data = await response.json();

      if (data.error) throw new Error(data.error);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-area-ai" />
              הגדרות יצירה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Client selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                בחר לקוח
              </label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר לקוח..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {c.brandColors.slice(0, 3).map((bc) => (
                            <span
                              key={bc.hex}
                              className="h-3 w-3 rounded-full inline-block border border-border/40"
                              style={{ backgroundColor: bc.hex }}
                            />
                          ))}
                        </div>
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brief */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                בריף
              </label>
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="הכנס כאן את הבריף לקמפיין (למשל: מודעה למבצע קפה ומאפה)..."
                className="min-h-[140px] resize-none text-base leading-relaxed"
              />
            </div>

            {/* Active guideline preview */}
            {selectedClient && (
              <div className="rounded-xl bg-area-ai-soft p-4 space-y-2.5 animate-in fade-in duration-300">
                <p className="text-xs font-semibold text-area-ai tracking-wide">
                  גיידליין פעיל
                </p>
                <p className="text-sm font-bold text-foreground">
                  {selectedClient.name}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedClient.brandColors.map((bc) => (
                    <div
                      key={bc.hex}
                      className="flex items-center gap-1.5 bg-card rounded-full px-2.5 py-1 border border-border/50"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border/30"
                        style={{ backgroundColor: bc.hex }}
                      />
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {bc.hex}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedClient.fonts.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-card rounded-md px-2 py-0.5 border border-border/50 text-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!brief.trim() || !selectedClientId || isGenerating}
              className="w-full h-12 text-base bg-gradient-to-l from-brand-pink to-brand-purple text-white hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  מייצר סקיצה חכמה...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 ml-2" />
                  צור סקיצה לפי גיידליין
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output preview */}
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-area-ai" />
              תצוגה מקדימה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`rounded-xl border-2 border-dashed transition-all duration-500 overflow-hidden ${
                generatedImage
                  ? "border-area-ai/30 bg-area-ai-soft p-2"
                  : isGenerating
                    ? "border-area-ai/20 p-16"
                    : "border-border p-16"
              }`}
            >
              {isGenerating ? (
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <Sparkles className="h-16 w-16 text-area-ai/20" />
                    <Loader2 className="h-8 w-8 animate-spin text-area-ai absolute top-4 left-4" />
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    מייצר סקיצה מבוססת גיידליין...
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    זה עשוי לקחת מספר שניות
                  </p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="סקיצה שנוצרה"
                  className="w-full rounded-lg shadow-sm"
                />
              ) : error ? (
                <div className="text-center space-y-2">
                  <X className="h-10 w-10 mx-auto text-destructive/40" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    הסקיצה תופיע כאן
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    בחר לקוח, הכנס בריף ולחץ על ״צור סקיצה״
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Compliance checklist */}
      {compliance && (
        <Card className="border-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-area-ai" />
              בדיקת תאימות מותג (Brand Compliance)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Colors compliance */}
              <ComplianceCard
                passed={compliance.colorsApplied}
                icon={<Palette className="h-4 w-4" />}
                title="HEX נכון בשימוש"
              >
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {compliance.colorDetails?.map((c) => (
                    <span
                      key={c.hex}
                      className="inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 bg-card border border-border/50"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.hex}
                    </span>
                  ))}
                </div>
              </ComplianceCard>

              {/* Logo compliance */}
              <ComplianceCard
                passed={compliance.logoRulesApplied}
                icon={<Ruler className="h-4 w-4" />}
                title="Safe Zone לוגו"
              >
                <p className="text-xs text-muted-foreground mt-1">
                  {compliance.logoRulesApplied
                    ? `${compliance.logoRuleCount} כללי לוגו הוחלו`
                    : "לא נמצאו כללי לוגו בגיידליין"}
                </p>
              </ComplianceCard>

              {/* Fonts compliance */}
              <ComplianceCard
                passed={compliance.fontsApplied}
                icon={<Type className="h-4 w-4" />}
                title="פונט מאושר"
              >
                <div className="flex gap-1 flex-wrap mt-1">
                  {compliance.fontNames?.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] bg-card rounded-md px-2 py-0.5 border border-border/50"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </ComplianceCard>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ---- Small sub-component for compliance items ---- */
function ComplianceCard({
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
      className={`rounded-xl p-4 border transition-colors ${
        passed
          ? "border-green-200 bg-green-50/60 dark:border-green-800/40 dark:bg-green-950/20"
          : "border-destructive/20 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {passed ? (
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <X className="h-5 w-5 text-destructive" />
        )}
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default SmartSketchGenerator;
