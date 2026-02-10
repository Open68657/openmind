import { Building2, Sparkles, Users, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickLinks = [
  { title: "לקוחות", desc: "צפייה בגיידליינס של לקוחות", href: "/clients", icon: Building2 },
  { title: "סטודיו AI", desc: "כלי יצירה חכמים", href: "/ai-studio", icon: Sparkles },
  { title: "הצוות", desc: "צפייה בחברי הצוות", href: "/team", icon: Users },
];

const EmployeeHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="h-6 w-6 text-brand-purple" />
            <span className="text-2xl font-bold bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent tracking-tight">
              OPENMind
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-4">שלום 👋</h1>
          <p className="text-muted-foreground mt-2">מה תרצה לעשות היום?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {quickLinks.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all duration-200"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted group-hover:bg-brand-purple/10 transition-colors">
                <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-brand-purple transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground group-hover:text-brand-purple transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;
