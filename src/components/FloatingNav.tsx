import { Home, Users, Building2, Sparkles } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { title: "בית", url: "/", icon: Home },
  { title: "הצוות", url: "/team", icon: Users },
  { title: "לקוחות", url: "/clients", icon: Building2 },
  { title: "סטודיו AI", url: "/ai-studio", icon: Sparkles },
];

export function FloatingNav() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-card/70 backdrop-blur-xl shadow-lg shadow-black/10 px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/"}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-200 ${
                active
                  ? "bg-gradient-to-br from-brand-pink to-brand-purple text-white shadow-md shadow-brand-purple/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
