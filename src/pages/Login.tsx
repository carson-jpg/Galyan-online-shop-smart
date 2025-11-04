import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password }, {
      onSuccess: (data) => {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Navigation will be handled by useEffect
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error.response?.data?.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/40 rounded-full animate-pulse-bg"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-primary/15 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-secondary/30 rounded-full animate-pulse-bg" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent overflow-hidden whitespace-nowrap border-r-2 border-foreground animate-typing">
              Galyan's
            </div>
          </Link>
        </div>

        <Card className="animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.3s', background: 'linear-gradient(45deg, hsl(var(--card)), hsl(var(--card))) padding-box, linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary))) border-box', border: '2px solid transparent', backgroundClip: 'padding-box, border-box', backgroundOrigin: 'padding-box, border-box' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-border-light opacity-50 pointer-events-none"></div>
          {/* Orbital lights around the form */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full animate-light-orbit opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-secondary rounded-full animate-light-orbit-reverse opacity-70" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full animate-light-orbit opacity-50" style={{ animationDelay: '4s' }}></div>
          </div>

          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue shopping</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline transition-colors duration-200">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-glow"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              <p className="text-sm text-center text-muted-foreground animate-slide-in-left" style={{ animationDelay: '0.9s' }}>
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium transition-colors duration-200">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
