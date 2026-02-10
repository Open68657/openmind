import { ExtractedBrandData, BrandColor, ExtractedFont } from "@/data/clients";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Palette, Type, Image, Tag, Info } from "lucide-react";

interface BrandBookProps {
  extracted: ExtractedBrandData;
}

/** Convert various color string formats to a displayable CSS color */
function resolveColorCSS(color: BrandColor): string | null {
  if (color.hex) return color.hex;
  if (color.rgb) {
    const match = color.rgb.match(/r\s*=?\s*(\d+)\s*[,\s]*g\s*=?\s*(\d+)\s*[,\s]*b\s*=?\s*(\d+)/i);
    if (match) return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
  }
  return null;
}

/** Deduplicate colors by name — merge color values from multiple rows */
function deduplicateColors(colors: BrandColor[]): (BrandColor & { cssColor: string | null })[] {
  const map = new Map<string, BrandColor & { cssColor: string | null }>();
  for (const c of colors) {
    const key = c.name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      // merge missing fields
      if (!existing.hex && c.hex) existing.hex = c.hex;
      if (!existing.cmyk && c.cmyk) existing.cmyk = c.cmyk;
      if (!existing.rgb && c.rgb) existing.rgb = c.rgb;
      if (!existing.pantone && c.pantone) existing.pantone = c.pantone;
      if (!existing.cssColor) existing.cssColor = resolveColorCSS(existing);
    } else {
      const entry = { ...c, cssColor: resolveColorCSS(c) };
      map.set(key, entry);
    }
  }
  return Array.from(map.values());
}

const PANGRAM_HE = "דג סקרן שט בים מאוכזב ולפתע מצא חברה";

/* ─── Color Card (compact) ─── */
const ColorCard = ({ color }: { color: BrandColor & { cssColor: string | null } }) => {
  const bg = color.cssColor;
  const isLight = bg === "#FFFFFF" || bg === "rgb(255, 255, 255)" || color.name.includes("white") || color.name.includes("לבן");

  return (
    <div className="group flex flex-col items-center gap-2 min-w-0">
      {/* Color swatch — 60×60 rounded */}
      <div
        className={`h-[60px] w-[60px] rounded-xl shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-110 ${isLight ? "border border-border" : ""}`}
        style={{ backgroundColor: bg || "hsl(var(--muted))" }}
      >
        {!bg && (
          <div className="flex items-center justify-center h-full">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      {/* Details */}
      <div className="text-center space-y-0.5 min-w-0 w-full">
        <p className="text-[11px] font-semibold text-foreground leading-tight truncate">{color.name}</p>
        {color.hex && (
          <p className="text-[10px] font-mono text-muted-foreground" dir="ltr">{color.hex}</p>
        )}
        {color.cmyk && (
          <p className="text-[9px] font-mono text-muted-foreground/70 truncate" dir="ltr">{color.cmyk}</p>
        )}
        {color.pantone && (
          <p className="text-[9px] font-mono text-brand-purple/60 truncate" dir="ltr">{color.pantone}</p>
        )}
        {color.confidence === "inferred" && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[9px]">
            דרוש בדיקה
          </Badge>
        )}
      </div>
    </div>
  );
};

/* ─── Typography Row (compact) ─── */
const TypographyRow = ({ font }: { font: ExtractedFont }) => (
  <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="shrink-0 min-w-0">
      <p className="text-sm font-bold text-foreground truncate" dir="ltr">{font.name}</p>
      {font.weight && <span className="text-[10px] text-muted-foreground" dir="ltr">{font.weight}</span>}
    </div>
    <div className="h-8 w-px bg-border shrink-0" />
    <p className="text-sm text-foreground/70 truncate flex-1">{PANGRAM_HE}</p>
    <Badge variant="secondary" className="text-[9px] shrink-0 hidden sm:inline-flex">{font.usage}</Badge>
    {font.confidence === "inferred" && (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[9px] shrink-0">
        דרוש בדיקה
      </Badge>
    )}
  </div>
);

/* ─── Main BrandBook ─── */
const BrandBook = ({ extracted }: BrandBookProps) => {
  const uniqueColors = deduplicateColors(extracted.colors);
  const hasLogoRules = extracted.logoRules.length > 0;
  const hasSubBrands = extracted.subBrands && extracted.subBrands.length > 0;

  // Deduplicate sub-brands by name (case-insensitive)
  const uniqueSubBrands = hasSubBrands
    ? Array.from(
        new Map(extracted.subBrands!.map((sb) => [sb.name.toLowerCase(), sb])).values()
      )
    : [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Source badge */}
      {extracted.sourceFileName && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-xs px-3 py-1">
            חולץ מ-{extracted.sourceFileName}
          </Badge>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* ─── COLOR PALETTE ─── */}
      {uniqueColors.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-brand-purple" />
            <h2 className="text-xl font-bold text-foreground">פלטת צבעים</h2>
            <Badge variant="secondary" className="text-[10px]">{uniqueColors.length} צבעים</Badge>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {uniqueColors.map((color, i) => (
              <div
                key={`${color.name}-${i}`}
                className="animate-in fade-in duration-400 w-[80px]"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <ColorCard color={color} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── TYPOGRAPHY ─── */}
      {extracted.fonts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Type className="h-5 w-5 text-brand-pink" />
            <h2 className="text-xl font-bold text-foreground">טיפוגרפיה</h2>
          </div>
          <div className="space-y-2">
            {extracted.fonts.map((font, i) => (
              <div
                key={`${font.name}-${i}`}
                className="animate-in fade-in duration-400"
                style={{ animationDelay: `${(uniqueColors.length + i) * 60}ms`, animationFillMode: "both" }}
              >
                <TypographyRow font={font} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── LOGO QUICK-REFERENCE ─── */}
      {hasLogoRules && (
        <section className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-3">
            <Image className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">הנחיות לוגו</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {extracted.logoRules.map((rule, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-2xl border p-5 transition-all duration-300 hover:shadow-sm ${
                  rule.type === "do"
                    ? "border-green-200 bg-green-50/50 dark:border-green-800/40 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20"
                }`}
              >
                {rule.type === "do" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">{rule.rule}</span>
                  {rule.page && (
                    <span className="block text-[10px] text-muted-foreground mt-1">עמ׳ {rule.page}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SUB-BRANDS ─── */}
      {uniqueSubBrands.length > 0 && (
        <section className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">תת-מותגים</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {uniqueSubBrands.map((sb) => (
              <div
                key={sb.name}
                className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-sm font-bold text-foreground" dir="ltr">{sb.name}</p>
                {sb.nameHe && <p className="text-xs text-muted-foreground">{sb.nameHe}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SUMMARY ─── */}
      {extracted.summary && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
          {extracted.summary.totalPages && <span>עמודים שנסרקו: {extracted.summary.totalPages}</span>}
          <span>•</span>
          <span>צבעים: {extracted.summary.colorsFound ? "✓" : "✗"}</span>
          <span>•</span>
          <span>פונטים: {extracted.summary.fontsFound ? "✓" : "✗"}</span>
          <span>•</span>
          <span>הנחיות לוגו: {extracted.summary.logoRulesFound ? "✓" : "✗"}</span>
        </div>
      )}
    </div>
  );
};

export default BrandBook;
