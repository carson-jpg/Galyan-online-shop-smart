import { ShoppingCart, Search, User, Menu, Heart, Package, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useState, useEffect } from "react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const cartItemCount = isAuthenticated ? (cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0) : 0;

  // Load dark mode preference
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsDarkMode(settings.darkMode || false);
    }
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
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for products..."
                className="pl-10 pr-4 h-10 w-full"
              />
            </div>
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
          <div className="hidden md:flex items-center gap-6 h-12 text-sm">
            <Link to="/" className="hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/products?category=electronics" className="hover:text-primary transition-colors">
              Electronics
            </Link>
            <Link to="/products?category=fashion" className="hover:text-primary transition-colors">
              Fashion
            </Link>
            <Link to="/products?category=home" className="hover:text-primary transition-colors">
              Home & Living
            </Link>
            <Link to="/products?category=beauty" className="hover:text-primary transition-colors">
              Beauty
            </Link>
            <Link to="/products?category=sports" className="hover:text-primary transition-colors">
              Sports
            </Link>
            <Link to="/products?category=groceries" className="hover:text-primary transition-colors">
              Groceries
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
