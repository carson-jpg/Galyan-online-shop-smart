import { ShoppingCart, Search, User, Menu, Heart, Package, Sun, Moon, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useUnreadCount } from "@/hooks/useChat";
import { useNotifications } from "@/hooks/useNotifications";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const { data: unreadCount } = useUnreadCount();
  const { unreadCount: notificationCount } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const marqueeRef = useRef<HTMLDivElement>(null);

  const cartItemCount = isAuthenticated ? (cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0) : 0;

  // Load dark mode preference
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsDarkMode(settings.darkMode || false);
    }
  }, []);

  // Auto-scroll marquee effect
  useEffect(() => {
    const marqueeElement = marqueeRef.current;
    if (!marqueeElement) return;

    let animationId: number;
    let startTime: number | null = null;
    const duration = 30000; // 30 seconds for full cycle

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      // Calculate scroll position
      const scrollWidth = marqueeElement.scrollWidth - marqueeElement.clientWidth;
      const scrollLeft = progress * scrollWidth;

      marqueeElement.scrollLeft = scrollLeft;

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Update localStorage
    const savedSettings = localStorage.getItem('userSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    settings.darkMode = newDarkMode;
    localStorage.setItem('userSettings', JSON.stringify(settings));

    // Apply to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear search after navigation
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Galyan's
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="pl-10 pr-12 h-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2"
                disabled={!searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hidden md:inline-flex"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user?.role !== 'admin' && (
              <>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                  <Heart className="h-5 w-5" />
                </Button>
                {isAuthenticated && (
                  <>
                    <Link to="/chat">
                      <Button variant="ghost" size="icon" className="relative">
                        <MessageCircle className="h-5 w-5" />
                        {unreadCount && unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </>
                )}
                {isAuthenticated ? (
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                        {cartItemCount}
                      </Badge>
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary">
                        0
                      </Badge>
                    </Button>
                  </Link>
                )}
              </>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.role === 'admin' ? (
                  <>
                    <span className="text-sm font-medium">Admin</span>
                    <Button variant="ghost" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : user?.role === 'seller' ? (
                  <>
                    <Link to="/seller-dashboard">
                      <Button variant="ghost" size="sm">
                        Seller Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" size="icon" className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.profilePicture} alt={user?.name} />
                          <AvatarFallback className="text-xs">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/orders">
                      <Button variant="ghost" size="icon">
                        <Package className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" size="icon" className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.profilePicture} alt={user?.name} />
                          <AvatarFallback className="text-xs">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={logout}>
                      Logout
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {user?.role !== 'admin' && (
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation - Only show for non-admin users */}
        {user?.role !== 'admin' && (
          <div className="relative">
            <div
              ref={marqueeRef}
              className="hidden md:flex items-center gap-3 h-12 text-sm overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <Link to="/" className="hover:text-primary transition-colors font-medium whitespace-nowrap px-1">
                Home
              </Link>
              <div className="h-4 w-px bg-border"></div>
              <Link to="/products?category=electronics" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Electronics
              </Link>
              <Link to="/products?category=fashion" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Fashion
              </Link>
              <Link to="/products?category=home" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Home & Living
              </Link>
              <Link to="/products?category=beauty" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Beauty & Personal Care
              </Link>
              <Link to="/products?category=supermarket" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Supermarket / Groceries
              </Link>
              <Link to="/products?category=appliances" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Appliances
              </Link>
              <Link to="/products?category=computing" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Computing & Office
              </Link>
              <Link to="/products?category=sports" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Sports & Outdoors
              </Link>
              <Link to="/products?category=automotive" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Automotive
              </Link>
              <Link to="/products?category=toys" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Toys, Kids & Baby
              </Link>
              <Link to="/products?category=health" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Health & Medical
              </Link>
              <Link to="/products?category=books" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Books, Stationery & Art
              </Link>
              <Link to="/products?category=garden" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Garden & Tools
              </Link>
              <Link to="/products?category=pet" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Pet Supplies
              </Link>
              <Link to="/products?category=deals" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                Deals & Promotions
              </Link>
              {isAuthenticated && (
                <>
                  <div className="h-4 w-px bg-border"></div>
                  <Link to="/sell-on-galyan" className="hover:text-primary transition-colors whitespace-nowrap px-1">
                    Sell on Galyan
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
