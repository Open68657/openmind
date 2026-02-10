import { UserCircle, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function TopHeader() {
  const { signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/50 border-b border-white/10">
      <div className="flex items-center justify-start gap-2 px-4 py-2">
        <NavLink
          to="/profile"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <UserCircle className="h-5 w-5" />
          <span className="text-sm font-medium">פרופיל</span>
        </NavLink>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">יציאה</span>
        </button>
      </div>
    </header>
  );
}
