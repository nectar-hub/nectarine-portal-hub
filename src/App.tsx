
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import BuyForMe from "./pages/dashboard/BuyForMe";
import ShippingAddress from "./pages/dashboard/ShippingAddress";
import Orders from "./pages/dashboard/Orders";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <MainLayout requireAuth>
                  <Dashboard />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard/buy-for-me"
              element={
                <MainLayout requireAuth>
                  <BuyForMe />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard/shipping-address"
              element={
                <MainLayout requireAuth>
                  <ShippingAddress />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard/orders"
              element={
                <MainLayout requireAuth>
                  <Orders />
                </MainLayout>
              }
            />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
