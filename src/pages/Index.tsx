import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useTopProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading, error } = useTopProducts();

  // If user is admin, redirect to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      window.location.href = '/admin';
    }
  }, [user]);

  // Show loading while checking user role
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <CategoryGrid />

      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Featured Products
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
              Discover our handpicked selection of top-rated products
            </p>
            <a href="/products" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors">
              View All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading featured products.</p>
            </div>
          )}

          {!isLoading && !error && featuredProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.images[0] || "/placeholder.svg"}
                  rating={product.rating}
                  discount={product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
