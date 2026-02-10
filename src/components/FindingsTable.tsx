import { useState } from "react";
import { ExtractedBrandData } from "@/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Pencil, Check, X, AlertTriangle } from "lucide-react";

interface FindingRow {
  id: string;
  property: string;
  value: string;
  page: number | null;
  confidence: "exact" | "inferred" | "not_found";
  category: "color" | "font" | "logo" | "subBrand";
}

interface FindingsTableProps {
  extracted: ExtractedBrandData;
  role: "admin" | "employee";
  onOverride: (id: string, newValue: string) => void;
}

function buildRows(data: ExtractedBrandData): FindingRow[] {
  const rows: FindingRow[] = [];

  if (data.colors.length > 0) {
    data.colors.forEach((c, i) => {
      const valueParts: string[] = [];
      if (c.hex) valueParts.push(`HEX: ${c.hex}`);
      if (c.cmyk) valueParts.push(`CMYK: ${c.cmyk}`);
      if (c.rgb) valueParts.push(`RGB: ${c.rgb}`);
      if (c.pantone) valueParts.push(`Pantone: ${c.pantone}`);
      rows.push({
        id: `color-${i}`,
        property: `צבע: ${c.name}`,
        value: valueParts.length > 0 ? valueParts.join(" | ") : "לא נמצא",
        page: c.page ?? null,
        confidence: c.confidence || (valueParts.length > 0 ? "exact" : "not_found"),
        category: "color",
      });
    });
  } else {
    rows.push({
      id: "color-empty",
      property: "צבעי מותג",
      value: "לא נמצא",
      page: null,
      confidence: "not_found",
      category: "color",
    });
  }

  if (data.fonts.length > 0) {
    data.fonts.forEach((f, i) => {
      const parts: string[] = [f.name];
      if (f.weight) parts.push(f.weight);
      if (f.size && f.size !== "לא נמצא") parts.push(f.size);
      rows.push({
        id: `font-${i}`,
        property: `פונט: ${f.usage || "כללי"}`,
        value: parts.join(" • "),
        page: f.page ?? null,
        confidence: f.confidence || "exact",
        category: "font",
      });
    });
  } else {
    rows.push({
      id: "font-empty",
      property: "טיפוגרפיה",
      value: "לא נמצא",
      page: null,
      confidence: "not_found",
      category: "font",
    });
  }

  if (data.logoRules.length > 0) {
    data.logoRules.forEach((r, i) => {
      rows.push({
        id: `logo-${i}`,
        property: r.type === "do" ? "✅ כן לעשות" : "❌ לא לעשות",
        value: r.rule,
        page: r.page ?? null,
        confidence: r.confidence || "exact",
        category: "logo",
      });
    });
  }

  if (data.subBrands && data.subBrands.length > 0) {
    data.subBrands.forEach((sb, i) => {
      rows.push({
        id: `sub-${i}`,
        property: "תת-מותג",
        value: `${sb.name}${sb.nameHe ? ` (${sb.nameHe})` : ""}`,
        page: sb.page ?? null,
        confidence: "exact",
        category: "subBrand",
      });
    });
  }

  return rows;
}

const ConfidenceBadge = ({ confidence }: { confidence: FindingRow["confidence"] }) => {
  switch (confidence) {
    case "exact":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-[10px]">
          מאומת
        </Badge>
      );
    case "inferred":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" />
          דרוש בדיקה
        </Badge>
      );
    case "not_found":
      return (
        <Badge variant="secondary" className="text-[10px]">
          לא נמצא
        </Badge>
      );
  }
};

const FindingsTable = ({ extracted, role, onOverride }: FindingsTableProps) => {
  const rows = buildRows(extracted);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (row: FindingRow) => {
    setEditingId(row.id);
    setEditValue(row.value);
  };

  const saveEdit = () => {
    if (editingId) {
      onOverride(editingId, editValue);
      setEditingId(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-brand-purple" />
          טבלת ממצאים
          <Badge variant="secondary" className="text-[10px]">
            {rows.length} שדות
          </Badge>
          {extracted.sourceFileName && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] mr-auto">
              חולץ מ-{extracted.sourceFileName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">שדה</TableHead>
                <TableHead className="text-right font-semibold">ערך שחולץ</TableHead>
                <TableHead className="text-center font-semibold w-20">עמוד</TableHead>
                <TableHead className="text-center font-semibold w-28">סטטוס</TableHead>
                {role === "admin" && (
                  <TableHead className="text-center font-semibold w-20">תיקון</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground whitespace-nowrap">
                    {row.property}
                  </TableCell>
                  <TableCell className="text-foreground" dir="ltr">
                    {editingId === row.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm"
                          dir="ltr"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={saveEdit}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : row.confidence === "not_found" ? (
                      <span className="text-muted-foreground italic">לא נמצא</span>
                    ) : (
                      <span className="text-sm">{row.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-sm">
                    {row.page ? `עמ׳ ${row.page}` : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <ConfidenceBadge confidence={row.confidence} />
                  </TableCell>
                  {role === "admin" && (
                    <TableCell className="text-center">
                      {row.confidence !== "not_found" && editingId !== row.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => startEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {extracted.summary && (
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>עמודים שנסרקו: {extracted.summary.totalPages ?? "—"}</span>
            <span>•</span>
            <span>צבעים: {extracted.summary.colorsFound ? "נמצאו" : "לא נמצאו"}</span>
            <span>•</span>
            <span>פונטים: {extracted.summary.fontsFound ? "נמצאו" : "לא נמצאו"}</span>
            <span>•</span>
            <span>הנחיות לוגו: {extracted.summary.logoRulesFound ? "נמצאו" : "לא נמצאו"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FindingsTable;
