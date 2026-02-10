import { Client } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BrandAssetsProps {
  client: Client;
}

const BrandAssets = ({ client }: BrandAssetsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Colors */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-brand-purple" />
            צבעי מותג
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {client.brandColors.map((color) => (
              <div
                key={color.hex}
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {client.fonts.map((font, i) => (
              <div
                key={font}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {i === 0 ? "גופן ראשי" : "גופן משני"}
                  </p>
                  <p className="text-lg font-semibold text-foreground" dir="ltr">
                    {font}
                  </p>
                </div>
                <Badge variant="secondary">
                  {i === 0 ? "כותרות" : "גוף טקסט"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandAssets;
