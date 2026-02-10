import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FloatingNav } from "@/components/FloatingNav";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import HomeRouter from "./pages/HomeRouter";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientGuideline from "./pages/ClientGuideline";
import AiStudio from "./pages/AiStudio";
import AdminProfile from "./pages/AdminProfile";
import FinalsAudit from "./pages/FinalsAudit";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AdminModeProvider>
      <div className="min-h-screen w-full pb-24">
        <Routes>
          <Route path="/" element={<HomeRouter />} />
          <Route path="/team" element={<Index />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientGuideline />} />
          <Route path="/ai-studio" element={<AiStudio />} />
          <Route path="/finals-audit" element={<FinalsAudit />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingNav />
      </div>
    </AdminModeProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
