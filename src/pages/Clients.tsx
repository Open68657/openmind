import { clients } from "@/data/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Clients = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium tracking-wide bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent">OPENMind</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">מאגר לקוחות</h1>
          <p className="mt-1 text-muted-foreground">{clients.length} לקוחות פעילים</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Gradient top bar */}
              <div className="h-2 bg-gradient-to-l from-brand-pink to-brand-purple" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink/10 to-brand-purple/10">
                    <Building2 className="h-6 w-6 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.industry}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-gradient-to-l group-hover:from-brand-pink group-hover:to-brand-purple group-hover:text-white group-hover:border-transparent transition-all duration-300"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <span>צפייה בגיידליין</span>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Clients;
