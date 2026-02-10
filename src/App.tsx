import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FloatingNav } from "@/components/FloatingNav";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientGuideline from "./pages/ClientGuideline";
import AiStudio from "./pages/AiStudio";
import AdminProfile from "./pages/AdminProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminModeProvider>
      <BrowserRouter>
        <div className="min-h-screen w-full pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team" element={<Index />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:clientId" element={<ClientGuideline />} />
            <Route path="/ai-studio" element={<AiStudio />} />
            <Route path="/profile" element={<AdminProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingNav />
        </div>
      </BrowserRouter>
      </AdminModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
