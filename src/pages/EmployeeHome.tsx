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
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="h-6 w-6 text-brand-purple" />
            <span className="text-2xl font-extrabold bg-gradient-to-l from-brand-pink to-brand-purple bg-clip-text text-transparent tracking-tight">
              OPENMind
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mt-5">שלום 👋</h1>
          <p className="text-muted-foreground mt-2 text-sm">מה תרצה לעשות היום?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quickLinks.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="group card-premium hover-glow flex flex-col items-center gap-4 p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 group-hover:bg-brand-purple/10 transition-colors duration-300">
                <item.icon className="h-6 w-6 text-muted-foreground group-hover:text-brand-purple transition-colors duration-300" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground group-hover:text-brand-purple transition-colors duration-300">
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
