import { Sparkles } from "lucide-react";

const AiStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium tracking-wide bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent">
              OPENMind
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">סטודיו AI</h1>
          <p className="mt-1 text-muted-foreground">כלי יצירה חכמים מבוססי בינה מלאכותית</p>
        </div>

        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Sparkles className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">סטודיו AI יהיה זמין בקרוב</p>
          <p className="text-sm text-muted-foreground/60 mt-1">כלים ליצירת תוכן, ניתוח ועיצוב מונחי AI</p>
        </div>
      </div>
    </div>
  );
};

export default AiStudio;
