import { Home, Users, Building2, Sparkles, UserCircle, ShieldCheck, User, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminMode, useIsAuthAdmin } from "@/contexts/AdminModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "בית", url: "/", icon: Home },
  { title: "הצוות", url: "/team", icon: Users },
  { title: "לקוחות", url: "/clients", icon: Building2 },
  { title: "סטודיו AI", url: "/ai-studio", icon: Sparkles },
  { title: "פרופיל", url: "/profile", icon: UserCircle },
];

export function FloatingNav() {
  const location = useLocation();
  const { role, setRole, isAdmin } = useAdminMode();
  const isAuthAdmin = useIsAuthAdmin();
  const { signOut } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-card/70 backdrop-blur-xl shadow-lg shadow-black/10 px-2 py-2">
        {/* Admin Toggle - only visible to real admins */}
        {isAuthAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-l border-border/50 ml-1">
            <Switch
              checked={isAdmin}
              onCheckedChange={(checked) => setRole(checked ? "admin" : "employee")}
              className="h-5 w-9 data-[state=checked]:bg-brand-purple"
            />
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 leading-relaxed transition-colors ${
                isAdmin
                  ? "bg-brand-purple/15 text-brand-purple border-brand-purple/20"
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

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 border-r border-border/50 mr-1"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">יציאה</span>
        </button>
      </div>
    </nav>
  );
}
