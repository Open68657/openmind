import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export interface FileVersion {
  id: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  isActive: boolean;
}

interface FileHistoryProps {
  versions: FileVersion[];
  role: "admin" | "employee";
  onDelete?: (id: string) => void;
}

const FileHistory = ({ versions, role, onDelete }: FileHistoryProps) => {
  const [open, setOpen] = useState(false);

  if (versions.length === 0) return null;

  const archived = versions.filter((v) => !v.isActive);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          היסטוריית קבצים
          <Badge variant="secondary" className="text-[10px]">
            {versions.length}
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-2 space-y-1 animate-in fade-in duration-200">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                v.isActive
                  ? "bg-green-50/60 dark:bg-green-950/20"
                  : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText
                  className={`h-4 w-4 shrink-0 ${
                    v.isActive ? "text-green-600" : "text-muted-foreground"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {v.fileName}
                    </p>
                    {v.isActive && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-[9px]">
                        פעיל
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format(v.uploadedAt, "dd/MM/yy")} • {v.uploadedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                {role === "admin" && !v.isActive && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(v.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileHistory;
