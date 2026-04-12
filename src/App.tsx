import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import CitizenComplaint from "./pages/CitizenComplaint";
import OfficerDashboard from "./pages/OfficerDashboard";
import EvidencePortal from "./pages/EvidencePortal";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import TrackComplaint from "./pages/TrackComplaint";
import ProtectedRoute from "./components/ProtectedRoute";
import { AIChatbot } from "./components/AIChatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/citizen" 
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenComplaint />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRole="officer">
                <OfficerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/track" 
            element={
              <ProtectedRoute allowedRole="citizen">
                <TrackComplaint />
              </ProtectedRoute>
            } 
          />
          <Route path="/evidence" element={<EvidencePortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
