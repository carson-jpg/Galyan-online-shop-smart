import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTopProducts } from "@/hooks/useProducts";
import { ShoppingBag, Truck, Shield, Star, ArrowRight, Sparkles } from "lucide-react";

const CategoryGrid = () => {
  const { data: featuredProducts, isLoading } = useTopProducts();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

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

  // Auto-rotate through advertisements every 4 seconds
  useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
    }, 4000);

    return () => clearInterval(adInterval);
  }, []);

  const currentProduct = featuredProducts?.[currentImageIndex];

  const advertisements = [
    {
      title: "🚚 FREE SHIPPING",
      subtitle: "On orders over KSh 5,000",
      description: "Get your favorite products delivered to your doorstep without any shipping costs",
      icon: Truck,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "🛡️ SECURE PAYMENT",
      subtitle: "100% Safe & Secure",
      description: "Shop with confidence using our encrypted payment system and trusted partners",
      icon: Shield,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "⭐ PREMIUM QUALITY",
      subtitle: "Authentic Products Only",
      description: "We guarantee genuine products with quality assurance and satisfaction guarantee",
      icon: Star,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
    },
    {
      title: "🎉 FLASH SALES",
      subtitle: "Up to 70% Off",
      description: "Don't miss out on our limited-time offers and exclusive deals every day",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    }
  ];

  const currentAd = advertisements[currentAdIndex];

  return (
    <section className="py-16 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Advertisement Banner */}
        <div className={`mb-12 rounded-3xl p-8 transition-all duration-1000 ${currentAd.bgColor}`}>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${currentAd.color} text-white text-sm font-semibold mb-4`}>
                <currentAd.icon className="h-4 w-4" />
                {currentAd.title}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {currentAd.subtitle}
              </h3>
              <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
                {currentAd.description}
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex-shrink-0">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-r ${currentAd.color} flex items-center justify-center shadow-2xl`}>
                <currentAd.icon className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Ad indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentAdIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Featured Product Image Carousel */}
        {!isLoading && featuredProducts && featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Featured Products
              </h2>
              <p className="text-muted-foreground text-lg">
                Discover amazing deals on our top-rated products
              </p>
            </div>

            <div className="relative max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Product Image */}
                <div className="relative">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                    <img
                      src={currentProduct?.images?.[0] || "/placeholder.svg"}
                      alt={currentProduct?.name || "Featured Product"}
                      className="w-full h-full object-cover transition-all duration-1000 ease-in-out hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Discount Badge */}
                    {currentProduct?.originalPrice && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                      {currentProduct?.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(currentProduct?.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-muted-foreground">
                          ({currentProduct?.numReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl font-bold text-primary">
                        KSh {currentProduct?.price?.toLocaleString()}
                      </span>
                      {currentProduct?.originalPrice && (
                        <span className="text-2xl text-muted-foreground line-through">
                          KSh {currentProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link
                      to={`/products/${currentProduct?._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      View Details
                    </Link>
                    <Link
                      to="/products"
                      className="px-8 py-4 border border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      Shop All
                    </Link>
                  </div>

                  {/* Image indicators */}
                  <div className="flex justify-center gap-2 pt-4">
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
