import { useState } from "react";
import { Client } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ImageIcon, Loader2 } from "lucide-react";

interface NanoBananaGeneratorProps {
  client: Client;
}

const NanoBananaGenerator = ({ client }: NanoBananaGeneratorProps) => {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setGenerated(false);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-accent" />
          מחולל סקיצות Nano Banana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            בריף ליצירה
          </label>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={`לדוגמה: פוסט למבצע קיץ של ${client.name}`}
            className="min-h-[100px] resize-none"
          />
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

        {/* Result placeholder */}
        <div
          className={`rounded-xl border-2 border-dashed transition-all duration-500 ${
            generated
              ? "border-brand-purple/30 bg-gradient-to-br from-brand-pink/5 to-brand-purple/5 p-6"
              : "border-border p-10"
          }`}
        >
          {generated ? (
            <div className="text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto w-full aspect-video rounded-lg bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-brand-purple/40 mb-2" />
                  <p className="text-sm font-medium text-brand-purple/60">
                    סקיצה שנוצרה עבור {client.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    "{brief}"
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {client.brandColors.slice(0, 3).map((c) => (
                  <span
                    key={c.hex}
                    className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border border-border"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                הסקיצה תופיע כאן
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NanoBananaGenerator;
