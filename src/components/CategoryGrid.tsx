import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTopProducts } from "@/hooks/useProducts";

const CategoryGrid = () => {
  const { data: featuredProducts, isLoading } = useTopProducts();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate through featured product images every 2 seconds
  useEffect(() => {
    if (!featuredProducts || featuredProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === featuredProducts.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [featuredProducts]);

  const currentProduct = featuredProducts?.[currentImageIndex];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our wide range of products across different categories
          </p>
        </div>

        {/* Featured Product Image Carousel */}
        {!isLoading && featuredProducts && featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="relative max-w-4xl mx-auto">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={currentProduct?.images?.[0] || "/placeholder.svg"}
                  alt={currentProduct?.name || "Featured Product"}
                  className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white text-2xl md:text-3xl font-bold mb-2">
                    {currentProduct?.name}
                  </h3>
                  <p className="text-white/90 text-lg">
                    KSh {currentProduct?.price?.toLocaleString()}
                    {currentProduct?.originalPrice && (
                      <span className="ml-2 text-red-400 line-through">
                        KSh {currentProduct.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Image indicators */}
              <div className="flex justify-center mt-4 gap-2">
                {featuredProducts.slice(0, 8).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'bg-primary scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Grid - Hidden as requested */}
        <div className="hidden">
          {/* Categories are now in the navbar */}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
