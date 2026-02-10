import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

type Role = "admin" | "employee";

interface AdminModeContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { isAdmin: isAuthAdmin } = useAuth();
  const [role, setRole] = useState<Role>(isAuthAdmin ? "admin" : "employee");

  // Sync with auth admin status
  useEffect(() => {
    setRole(isAuthAdmin ? "admin" : "employee");
  }, [isAuthAdmin]);

  // Only allow toggling to admin if actually an admin
  const handleSetRole = (newRole: Role) => {
    if (newRole === "admin" && !isAuthAdmin) return;
    setRole(newRole);
  };

  return (
    <AdminModeContext.Provider value={{ role, setRole: handleSetRole, isAdmin: role === "admin" }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error("useAdminMode must be used within AdminModeProvider");
  return ctx;
}

/** Whether the authenticated user has admin privileges (regardless of toggle) */
export function useIsAuthAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}
