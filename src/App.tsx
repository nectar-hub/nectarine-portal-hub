
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
import SelfPurchases from "./pages/dashboard/SelfPurchases";
import Account from "./pages/dashboard/Account";
import Users from "./pages/admin/Users";
import Requests from "./pages/admin/Requests";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import AirCargo from "./pages/admin/AirCargo";
import PurchaseTracker from "./pages/admin/PurchaseTracker";
import ProductionCost from "./pages/admin/ProductionCost";
import CostReports from "./pages/admin/CostReports";
import NotFound from "./pages/NotFound";
import MainLayout from "./layouts/MainLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
            <Route
              path="/dashboard/track-packages"
              element={
                <MainLayout requireAuth>
                  <SelfPurchases />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard/account"
              element={
                <MainLayout requireAuth>
                  <Account />
                </MainLayout>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <MainLayout requireAuth adminOnly>
                  <Users />
                </MainLayout>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <MainLayout requireAuth adminOnly>
                  <Requests />
                </MainLayout>
              }
            />
            <Route
              path="/admin/buy-requests"
              element={
                <MainLayout requireAuth adminOnly>
                  <Requests />
                </MainLayout>
              }
            />
            <Route
              path="/admin/self-purchases"
              element={
                <MainLayout requireAuth adminOnly>
                  <Requests />
                </MainLayout>
              }
            />
            <Route
              path="/admin/shipping-addresses"
              element={
                <MainLayout requireAuth adminOnly>
                  <ShippingAddress />
                </MainLayout>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <MainLayout requireAuth adminOnly>
                  <Analytics />
                </MainLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <MainLayout requireAuth adminOnly>
                  <Settings />
                </MainLayout>
              }
            />
            <Route
              path="/admin/air-cargo"
              element={
                <MainLayout requireAuth adminOnly>
                  <AirCargo />
                </MainLayout>
              }
            />
            <Route
              path="/admin/purchase-tracker"
              element={
                <MainLayout requireAuth adminOnly>
                  <PurchaseTracker />
                </MainLayout>
              }
            />
            <Route
              path="/admin/production-cost"
              element={
                <MainLayout requireAuth adminOnly>
                  <ProductionCost />
                </MainLayout>
              }
            />
            <Route
              path="/admin/cost-reports"
              element={
                <MainLayout requireAuth adminOnly>
                  <CostReports />
                </MainLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <MainLayout requireAuth adminOnly>
                  <Dashboard />
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
