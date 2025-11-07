import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Vouchers from "./pages/Vouchers";
import Coins from "./pages/Coins";
import AddressBook from "./pages/AddressBook";
import MyReviews from "./pages/MyReviews";
import SellOnGalyan from "./pages/SellOnGalyan";
import FAQ from "./pages/FAQ";
import CustomerServices from "./pages/CustomerServices";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegister from "./pages/SellerRegister";
import SellerDashboard from "./pages/SellerDashboard";
import SellerStore from "./pages/SellerStore";
import Chat from "./pages/Chat";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route component for admin-only access
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Protected Route component for user-only access (redirects admin to admin dashboard)
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsDarkMode(settings.darkMode || false);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Listen for dark mode changes from settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSettings') {
        const settings = e.newValue ? JSON.parse(e.newValue) : {};
        setIsDarkMode(settings.darkMode || false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/coins" element={<Coins />} />
        <Route path="/address-book" element={<AddressBook />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/sell-on-galyan" element={<SellOnGalyan />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/customer-services" element={<CustomerServices />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/seller-register" element={<SellerRegister />} />
        <Route path="/seller-dashboard" element={
          <UserRoute>
            <SellerDashboard />
          </UserRoute>
        } />
        <Route path="/seller/:sellerId" element={<SellerStore />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
