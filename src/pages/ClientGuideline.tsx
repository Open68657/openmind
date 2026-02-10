import { useParams, useNavigate } from "react-router-dom";
import { clients } from "@/data/clients";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

const ClientGuideline = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">לקוח לא נמצא</h1>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה ללקוחות
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/clients")}>
          <ArrowRight className="h-4 w-4 ml-2" />
          חזרה למאגר לקוחות
        </Button>

        <div className="h-2 rounded-t-lg bg-gradient-to-l from-brand-pink to-brand-purple" />
        <div className="rounded-b-lg border border-t-0 bg-card p-8 shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink/10 to-brand-purple/10">
              <FileText className="h-7 w-7 text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <p className="text-muted-foreground">{client.industry} • גיידליין מותג</p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              גיידליין המותג של {client.name} יופיע כאן
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              עמוד זה ישמש להצגת הנחיות המותג, צבעים, טיפוגרפיה ועוד
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientGuideline;
