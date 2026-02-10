import { createContext, useContext, useState, ReactNode } from "react";

type Role = "admin" | "employee";

interface AdminModeContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  return (
    <AdminModeContext.Provider value={{ role, setRole, isAdmin: role === "admin" }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error("useAdminMode must be used within AdminModeProvider");
  return ctx;
}
