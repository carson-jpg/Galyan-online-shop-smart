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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const { data: unreadCount } = useUnreadCount();
  const { unreadCount: notificationCount } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Galyan's
            </div>
          </Link>

          {/* Search Bar - Hidden on small screens, shown on md and up */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="pl-10 pr-12 h-10 w-full rounded-full border-2 focus:border-primary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                disabled={!searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hidden lg:inline-flex hover:bg-muted transition-colors"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user?.role !== 'admin' && (
              <>
                <Button variant="ghost" size="icon" className="hidden lg:inline-flex hover:bg-muted transition-colors">
                  <Heart className="h-5 w-5" />
                </Button>
                {isAuthenticated && (
                  <>
                    <Button variant="ghost" size="icon" className="relative hidden lg:inline-flex hover:bg-muted transition-colors">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs font-bold animate-pulse">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                  </>
                )}
                {isAuthenticated ? (
                  <Link to="/cart">
                    <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs font-bold">
                        {cartItemCount}
                      </Badge>
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs font-bold">
                        0
                      </Badge>
                    </Button>
                  </Link>
                )}
              </>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 md:gap-2">
                {user?.role === 'admin' ? (
                  <>
                    <span className="hidden sm:inline text-sm font-medium">Admin</span>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-sm">
                      Logout
                    </Button>
                  </>
                ) : user?.role === 'seller' ? (
                  <>
                    <Link to="/seller-dashboard">
                      <Button variant="ghost" size="sm" className="hidden sm:inline text-sm">
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.profilePicture} alt={user?.name} />
                          <AvatarFallback className="text-xs font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-sm">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/orders">
                      <Button variant="ghost" size="icon" className="hidden sm:inline hover:bg-muted transition-colors">
                        <Package className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user?.profilePicture} alt={user?.name} />
                          <AvatarFallback className="text-xs font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-sm">
                      Logout
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" className="hover:bg-muted transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {user?.role !== 'admin' && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-muted transition-colors">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {/* Mobile Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search Products</label>
                      <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search for products..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleSearchKeyPress}
                        />
                      </form>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categories</label>
                      <div className="grid gap-2">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span className="font-medium">Home</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Electronics")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Electronics</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Fashion")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Fashion</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Home & Living")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Home & Living</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Beauty & Personal Care")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Beauty & Personal Care</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Supermarket / Groceries")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Supermarket / Groceries</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Appliances")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Appliances</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Computing & Office")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Computing & Office</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Sports & Outdoors")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Sports & Outdoors</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Automotive")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Automotive</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Toys, Kids & Baby")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Toys, Kids & Baby</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Health & Medical")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Health & Medical</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Books, Stationery & Art")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Books, Stationery & Art</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Garden & Tools")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Garden & Tools</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Pet Supplies")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Pet Supplies</span>
                        </Link>
                        <Link to={`/products?category=${encodeURIComponent("Deals & Promotions")}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <span>Deals & Promotions</span>
                        </Link>
                      </div>
                    </div>

                    {/* User Actions */}
                    {isAuthenticated && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account</label>
                        <div className="grid gap-2">
                          {user?.role === 'seller' && (
                            <Link to="/seller-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                              <span>Seller Dashboard</span>
                            </Link>
                          )}
                          <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <Package className="h-4 w-4" />
                            <span>My Orders</span>
                          </Link>
                          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                          {isAuthenticated && (
                            <Link to="/sell-on-galyan" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors font-semibold">
                              <span>Sell on Galyan</span>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                            className="w-full justify-start p-3 h-auto"
                          >
                            Logout
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Dark Mode Toggle */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preferences</label>
                      <Button
                        variant="ghost"
                        onClick={toggleDarkMode}
                        className="w-full justify-start p-3 h-auto"
                      >
                        {isDarkMode ? (
                          <>
                            <Sun className="h-4 w-4 mr-3" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4 mr-3" />
                            Dark Mode
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Navigation - Only show for non-admin users */}
        {user?.role !== 'admin' && (
          <div className="relative border-t border-border/50 bg-muted/20">
            <div
              ref={marqueeRef}
              className="hidden md:flex items-center justify-center gap-2 lg:gap-3 h-12 text-sm overflow-x-auto scrollbar-hide px-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <Link to="/" className="hover:text-primary transition-colors font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Home
              </Link>
              <div className="h-4 w-px bg-border/50"></div>
              <Link to={`/products?category=${encodeURIComponent("Electronics")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Electronics
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Fashion")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Fashion
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Home & Living")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Home & Living
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Beauty & Personal Care")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Beauty & Personal Care
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Supermarket / Groceries")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Supermarket / Groceries
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Appliances")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Appliances
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Computing & Office")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Computing & Office
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Sports & Outdoors")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Sports & Outdoors
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Automotive")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Automotive
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Toys, Kids & Baby")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Toys, Kids & Baby
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Health & Medical")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Health & Medical
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Books, Stationery & Art")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Books, Stationery & Art
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Garden & Tools")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Garden & Tools
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Pet Supplies")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Pet Supplies
              </Link>
              <Link to={`/products?category=${encodeURIComponent("Deals & Promotions")}`} className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5">
                Deals & Promotions
              </Link>
              {isAuthenticated && (
                <>
                  <div className="h-4 w-px bg-border/50"></div>
                  <Link to="/sell-on-galyan" className="hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md hover:bg-primary/5 font-semibold">
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
