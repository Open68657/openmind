import { clients } from "@/data/clients";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="h-4 w-4 text-area-clients" />
            <span className="text-sm font-medium tracking-wide text-area-clients">OPENMind</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">מאגר לקוחות</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{clients.length} לקוחות פעילים</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group card-premium hover-glow overflow-hidden"
            >
              {/* Gradient top bar */}
              <div className="h-1.5 bg-area-clients opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-area-clients-soft">
                    <Building2 className="h-6 w-6 text-area-clients" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.industry}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl group-hover:bg-area-clients group-hover:text-white group-hover:border-transparent transition-all duration-300"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <span>צפייה בגיידליין</span>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </CardContent>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Clients;
