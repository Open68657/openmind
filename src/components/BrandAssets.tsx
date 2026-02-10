import { BrandColor, ExtractedBrandData, SubBrand } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Image, CheckCircle, XCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BrandAssetsProps {
  brandColors: BrandColor[];
  fonts: string[];
  extracted?: ExtractedBrandData | null;
  subBrands?: SubBrand[];
}

const BrandAssets = ({ brandColors, fonts, extracted, subBrands }: BrandAssetsProps) => {
  const displayColors = extracted ? extracted.colors : brandColors;
  const displayFonts = extracted
    ? extracted.fonts
    : fonts.map((f, i) => ({
        name: f,
        size: i === 0 ? "28-36px" : "14-16px",
        usage: i === 0 ? "כותרות" : "גוף טקסט",
      }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-brand-purple" />
              צבעי מותג
              {extracted && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] mr-2">
                  עודכן מ-PDF
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {displayColors.map((color, i) => (
                <div
                  key={`${color.hex}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div
                    className="h-10 w-10 rounded-lg border border-border shadow-sm shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {color.name}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground" dir="ltr">
                      {color.hex}
                    </p>
                    {color.cmyk && (
                      <p className="text-[10px] font-mono text-brand-purple/70" dir="ltr">
                        CMYK: {color.cmyk}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-5 w-5 text-brand-pink" />
              טיפוגרפיה
              {extracted && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] mr-2">
                  עודכן מ-PDF
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayFonts.map((font, i) => (
                <div
                  key={`${font.name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="text-lg font-semibold text-foreground" dir="ltr">
                      {font.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {font.usage} • {font.size}
                    </p>
                  </div>
                  <Badge variant="secondary">{font.usage}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Brands */}
      {subBrands && subBrands.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-accent" />
              תת-מותגים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {subBrands.map((sb) => (
                <div
                  key={sb.name}
                  className="flex items-center gap-3 rounded-lg border border-border p-4"
                >
                  <p className="text-sm font-bold text-foreground" dir="ltr">{sb.name}</p>
                  <span className="text-xs text-muted-foreground">{sb.nameHe}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logo Rules - only show when extracted */}
      {extracted && extracted.logoRules.length > 0 && (
        <Card className="border-0 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Image className="h-5 w-5 text-accent" />
              הנחיות לוגו
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] mr-2">
                חולץ מ-PDF
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extracted.logoRules.map((rule, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    rule.type === "do"
                      ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                      : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
                  }`}
                >
                  {rule.type === "do" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-foreground">{rule.rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandAssets;
