import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// import { GoogleLogin } from 'react-google-login'; // Removed due to compatibility issues

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const { register, isLoading, error } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    }, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Welcome to Galyan's!",
        });
        navigate("/");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive",
        });
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // const handleGoogleSuccess = (response: any) => {
  //   // Redirect to backend Google OAuth
  //   window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  // };

  // const handleGoogleFailure = (response: any) => {
  //   toast({
  //     title: "Google sign-in failed",
  //     description: "Something went wrong with Google sign-in",
  //     variant: "destructive",
  //   });
  // };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-8 relative overflow-hidden">
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
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to start shopping with us</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.8s' }}>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:shadow-md"
                />
              </div>
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '0.9s' }}>
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="relative w-full animate-slide-in-left" style={{ animationDelay: '1.1s' }}>
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Temporarily disabled Google Login due to package compatibility issues */}
              <Button
                type="button"
                variant="outline"
                className="w-full transition-all duration-300 hover:shadow-md hover:scale-[1.01] animate-slide-in-left"
                style={{ animationDelay: '1.2s' }}
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <p className="text-sm text-center text-muted-foreground animate-slide-in-left" style={{ animationDelay: '1.3s' }}>
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
