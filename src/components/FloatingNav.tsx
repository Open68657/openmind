import { Home, Users, Building2, Sparkles, ArrowLeftRight, ShieldCheck, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminMode, useIsAuthAdmin } from "@/contexts/AdminModeContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "בית", url: "/", icon: Home, color: "text-area-home", activeBg: "bg-area-home" },
  { title: "הצוות", url: "/team", icon: Users, color: "text-area-team", activeBg: "bg-area-team" },
  { title: "לקוחות", url: "/clients", icon: Building2, color: "text-area-clients", activeBg: "bg-area-clients" },
  { title: "סטודיו AI", url: "/ai-studio", icon: Sparkles, color: "text-area-ai", activeBg: "bg-area-ai" },
  { title: "פיינלים", url: "/finals-audit", icon: ArrowLeftRight, color: "text-area-ai", activeBg: "bg-area-ai" },
];

export function FloatingNav() {
  const location = useLocation();
  const { role, setRole, isAdmin } = useAdminMode();
  const isAuthAdmin = useIsAuthAdmin();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-2xl glass px-2.5 py-2.5" style={{ boxShadow: 'var(--shadow-float)' }}>
        {/* Admin Toggle */}
        {isAuthAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-l border-border/30 ml-1">
            <Switch
              checked={isAdmin}
              onCheckedChange={(checked) => setRole(checked ? "admin" : "employee")}
              className={`h-5 w-9 transition-all duration-300 ${
                isAdmin ? "data-[state=checked]:bg-emerald-500" : "data-[state=unchecked]:bg-muted"
              }`}
            />
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 leading-relaxed transition-all duration-300 ${
                isAdmin
                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isAdmin ? (
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />מנהל</span>
              ) : (
                <span className="flex items-center gap-1"><User className="h-3 w-3" />עובד</span>
              )}
            </Badge>
          </div>
        )}

        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/"}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 ${
                active
                  ? `${item.activeBg} text-white shadow-lg`
                  : `text-muted-foreground hover:${item.color} hover:bg-muted/40`
              }`}
            >
              <item.icon className={`h-5 w-5 ${!active ? item.color : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
