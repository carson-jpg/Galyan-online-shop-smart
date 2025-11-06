import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActiveFlashSales } from "@/hooks/useFlashSales";
import FlashSaleCard from "./FlashSaleCard";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

const FlashSaleCarousel = () => {
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const itemsPerView = 4; // Show 4 items at a time on desktop
  const totalSlides = flashSales ? Math.ceil(flashSales.length / itemsPerView) : 0;

  useEffect(() => {
    if (isAutoPlaying && flashSales && flashSales.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          return nextIndex >= totalSlides ? 0 : nextIndex;
        });
      }, 4000); // Auto scroll every 4 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, flashSales, itemsPerView, totalSlides]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      return nextIndex >= totalSlides ? 0 : nextIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const prevIndexValue = prevIndex - 1;
      return prevIndexValue < 0 ? totalSlides - 1 : prevIndexValue;
    });
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Zap className="w-5 h-5" />
            Flash Sales - Limited Time Offers!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex-shrink-0 w-64">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                    <div className="bg-gray-200 h-8 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Zap className="w-5 h-5" />
            Flash Sales - Limited Time Offers!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active flash sales at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for amazing deals!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startIndex = currentIndex * itemsPerView;
  const visibleItems = flashSales.slice(startIndex, startIndex + itemsPerView);

  return (
    <Card className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Zap className="w-5 h-5 animate-pulse" />
            Flash Sales - Limited Time Offers!
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({flashSales.filter(fs => fs.status === 'active').length} active, {flashSales.filter(fs => fs.status === 'sold_out').length} sold out)
            </span>
          </CardTitle>

          {flashSales.length > itemsPerView && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: totalSlides }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentIndex ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextSlide}
                disabled={currentIndex === totalSlides - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={carouselRef}
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="flex gap-4 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / totalSlides)}%)`,
              width: `${(flashSales.length / itemsPerView) * 100}%`
            }}
          >
            {flashSales.map((flashSale) => (
              <div
                key={flashSale._id}
                className="flex-shrink-0"
                style={{ width: `${100 / flashSales.length}%` }}
              >
                <FlashSaleCard flashSale={flashSale} compact />
              </div>
            ))}
          </div>
        </div>

        {flashSales.length > itemsPerView && (
          <div className="flex justify-center mt-4">
            <p className="text-sm text-muted-foreground">
              Auto-scrolling • Hover to pause • Click arrows to navigate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlashSaleCarousel;