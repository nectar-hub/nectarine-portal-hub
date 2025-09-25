
import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Button } from '@/components/ui/button';
import {
  User,
  ShoppingCart,
  MapPin,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  ShoppingBag,
  BarChart3
} from 'lucide-react';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize real-time notifications for all dashboard users
  useRealtimeNotifications();

  useEffect(() => {
    // Close mobile menu when location changes
    setIsMobileMenuOpen(false);
  }, [location]);

  const userNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Buy For Me', href: '/dashboard/buy-for-me', icon: ShoppingCart },
    { name: 'My Orders', href: '/dashboard/orders', icon: ClipboardList },
    { name: 'Self Purchases', href: '/dashboard/track-packages', icon: Package },
    { name: 'My Shipping Address', href: '/dashboard/shipping-address', icon: MapPin },
    { name: 'My Account', href: '/dashboard/account', icon: Settings },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'All Requests', href: '/admin/requests', icon: ClipboardList },
    { name: 'Buy For Me Requests', href: '/admin/buy-requests', icon: ShoppingBag },
    { name: 'Self Purchases', href: '/admin/self-purchases', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Shipping Addresses', href: '/admin/shipping-addresses', icon: MapPin },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
          <Link to="/" className="text-xl font-bold text-nectarine-400">
            Nectarine Portal
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto">
          <nav className="mt-5 px-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 mt-1 text-sm rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-sidebar-accent text-nectarine-400'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-nectarine-400'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center mb-4">
            <div className="bg-nectarine-600 rounded-full h-10 w-10 flex items-center justify-center text-white">
              {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-sidebar-foreground opacity-70">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex items-center justify-center"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b border-border flex items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold text-nectarine-500">
          Nectarine Portal
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-background pt-16">
          <nav className="p-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 mt-1 text-sm rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-muted text-nectarine-500'
                    : 'text-foreground hover:bg-muted hover:text-nectarine-500'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
            <div className="mt-8 pt-4 border-t border-border">
              <div className="flex items-center mb-4 px-4">
                <div className="bg-nectarine-600 rounded-full h-10 w-10 flex items-center justify-center text-white">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
