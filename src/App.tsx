import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import CreateProject from "./pages/CreateProject";
import Strategy from "./pages/Strategy";
import Management from "./pages/Management";
import Intelligence from "./pages/Intelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create-project" element={<AppLayout><CreateProject /></AppLayout>} />
          <Route path="/strategy" element={<AppLayout><Strategy /></AppLayout>} />
          <Route path="/management" element={<AppLayout><Management /></AppLayout>} />
          <Route path="/intelligence" element={<AppLayout><Intelligence /></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
