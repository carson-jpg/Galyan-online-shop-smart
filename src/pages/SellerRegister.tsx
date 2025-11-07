import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const SellerRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessDescription: "",
    contactPerson: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    },
    kraPin: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/register-seller', formData);

      toast({
        title: "Registration submitted",
        description: "Your seller application has been submitted. Please wait for admin approval.",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    if (id.startsWith('businessAddress.')) {
      const addressField = id.split('.')[1];
      setFormData({
        ...formData,
        businessAddress: {
          ...formData.businessAddress,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/40 rounded-full animate-pulse-bg"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-primary/15 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-secondary/30 rounded-full animate-pulse-bg" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8 animate-fade-in-up">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent overflow-hidden whitespace-nowrap border-r-2 border-foreground animate-typing">
              Galyan's
            </div>
          </Link>
        </div>

        <Card className="animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '0.3s', background: 'linear-gradient(45deg, hsl(var(--card)), hsl(var(--card))) padding-box, linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary))) border-box', border: '2px solid transparent', backgroundClip: 'padding-box, border-box', backgroundOrigin: 'padding-box, border-box' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-border-light opacity-50 pointer-events-none"></div>

          <CardHeader>
            <CardTitle>Become a Seller</CardTitle>
            <CardDescription>Join our marketplace and start selling your products</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kraPin">KRA PIN</Label>
                    <Input
                      id="kraPin"
                      type="text"
                      placeholder="A123456789B"
                      value={formData.kraPin}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="ABC Enterprises Ltd"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      type="text"
                      placeholder="Jane Doe"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={formData.businessPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder="business@example.com"
                      value={formData.businessEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description</Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Tell us about your business..."
                    value={formData.businessDescription}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="businessAddress.street">Street Address</Label>
                    <Input
                      id="businessAddress.street"
                      type="text"
                      placeholder="123 Main Street"
                      value={formData.businessAddress.street}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress.city">City</Label>
                    <Input
                      id="businessAddress.city"
                      type="text"
                      placeholder="Nairobi"
                      value={formData.businessAddress.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress.state">State/Province</Label>
                    <Input
                      id="businessAddress.state"
                      type="text"
                      placeholder="Nairobi County"
                      value={formData.businessAddress.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress.postalCode">Postal Code</Label>
                    <Input
                      id="businessAddress.postalCode"
                      type="text"
                      placeholder="00100"
                      value={formData.businessAddress.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress.country">Country</Label>
                    <Input
                      id="businessAddress.country"
                      type="text"
                      placeholder="Kenya"
                      value={formData.businessAddress.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Submitting Application..." : "Submit Seller Application"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Want to shop instead?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Customer Registration
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SellerRegister;