import { Sparkles } from "lucide-react";
import SmartSketchGenerator from "@/components/SmartSketchGenerator";

const AiStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium tracking-wide bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent">
              OPENMind
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">סטודיו AI</h1>
          <p className="mt-1 text-muted-foreground">
            כלי יצירה חכמים מבוססי בינה מלאכותית
          </p>
        </div>

        {/* Smart Sketch Generator section */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-5 w-5 text-area-ai" />
            <h2 className="text-xl font-bold text-foreground">
              מחולל סקיצות חכם
            </h2>
          </div>
          <SmartSketchGenerator />
        </section>
      </div>
    </div>
  );
};

export default AiStudio;
