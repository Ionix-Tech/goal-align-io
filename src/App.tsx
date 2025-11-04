import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateProject from "./pages/CreateProject";
import QuickIdea from "./pages/QuickIdea";
import Prioritization from "./pages/Prioritization";
import Portfolio from "./pages/Portfolio";
import Theses from "./pages/Theses";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/quick-idea" element={<ProtectedRoute><AppLayout><QuickIdea /></AppLayout></ProtectedRoute>} />
          <Route path="/create-project" element={<ProtectedRoute><AppLayout><CreateProject /></AppLayout></ProtectedRoute>} />
          <Route path="/projects/:id/structure" element={<ProtectedRoute><AppLayout><CreateProject mode="structure" /></AppLayout></ProtectedRoute>} />
          <Route path="/prioritization" element={<ProtectedRoute><AppLayout><Prioritization /></AppLayout></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><AppLayout><Portfolio /></AppLayout></ProtectedRoute>} />
          <Route path="/theses" element={<ProtectedRoute><AppLayout><Theses /></AppLayout></ProtectedRoute>} />
          <Route path="/management" element={<ProtectedRoute><AppLayout><Management /></AppLayout></ProtectedRoute>} />
          <Route path="/intelligence" element={<ProtectedRoute><AppLayout><Intelligence /></AppLayout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
