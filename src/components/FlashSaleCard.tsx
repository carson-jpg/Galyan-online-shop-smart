import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Clock, Zap } from "lucide-react";

interface FlashSale {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    stock: number;
  };
  flashPrice: number;
  quantity: number;
  soldQuantity: number;
  startTime: string;
  endTime: string;
  status: 'active' | 'expired' | 'sold_out';
}

interface FlashSaleCardProps {
  flashSale: FlashSale;
  compact?: boolean;
}

const FlashSaleCard = ({ flashSale, compact = false }: FlashSaleCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashSale.endTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft("EXPIRED");
      }
    };

    const calculateProgress = () => {
      const progressValue = (flashSale.soldQuantity / flashSale.quantity) * 100;
      setProgress(progressValue);
    };

    calculateTimeLeft();
    calculateProgress();

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [flashSale.endTime, flashSale.soldQuantity, flashSale.quantity]);

  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to purchase flash sale items",
        variant: "destructive",
      });
      return;
    }

    // Store flash sale data in sessionStorage for checkout
    sessionStorage.setItem('flashSalePurchase', JSON.stringify({
      flashSaleId: flashSale._id,
      productId: flashSale.product._id,
      flashPrice: flashSale.flashPrice,
      quantity: 1, // Default to 1 for flash sales
    }));

    // Redirect to checkout
    navigate('/checkout');
  };

  const isExpired = new Date() > new Date(flashSale.endTime);
  const isSoldOut = flashSale.soldQuantity >= flashSale.quantity;
  const discount = Math.round(((flashSale.product.price - flashSale.flashPrice) / flashSale.product.price) * 100);

  if (compact) {
    return (
      <Card className="relative overflow-hidden border-2 border-red-200 hover:border-red-400 transition-colors">
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-red-500 text-white">
            <Zap className="w-3 h-3 mr-1" />
            {discount}% OFF
          </Badge>
        </div>

        <CardContent className="p-3">
          <Link to={`/products/${flashSale.product._id}`}>
            <img
              src={flashSale.product.images[0] || "/placeholder.svg"}
              alt={flashSale.product.name}
              className="w-full h-24 object-cover rounded mb-2"
            />
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {flashSale.product.name}
            </h3>
          </Link>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-red-600">
                KSh {flashSale.flashPrice.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                KSh {flashSale.product.price.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Clock className="w-3 h-3" />
              <span className="font-medium">{timeLeft}</span>
            </div>

            <Progress value={progress} className="h-1" />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{flashSale.soldQuantity}/{flashSale.quantity} sold</span>
              <span>{flashSale.quantity - flashSale.soldQuantity} left</span>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full mt-2 bg-red-500 hover:bg-red-600"
            disabled={isExpired || isSoldOut}
            onClick={handlePurchase}
          >
            {isSoldOut ? "SOLD OUT" : isExpired ? "EXPIRED" : "BUY NOW"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Badge className="bg-red-500 text-white">
          <Zap className="w-4 h-4 mr-1" />
          FLASH SALE
        </Badge>
        <Badge variant="destructive">
          {discount}% OFF
        </Badge>
      </div>

      <CardContent className="p-6">
        <Link to={`/products/${flashSale.product._id}`}>
          <img
            src={flashSale.product.images[0] || "/placeholder.svg"}
            alt={flashSale.product.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        </Link>

        <div className="space-y-4">
          <Link to={`/products/${flashSale.product._id}`}>
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
              {flashSale.product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-red-600">
              KSh {flashSale.flashPrice.toLocaleString()}
            </span>
            <span className="text-lg text-muted-foreground line-through">
              KSh {flashSale.product.price.toLocaleString()}
            </span>
            <Badge variant="destructive" className="text-sm">
              SAVE KSh {(flashSale.product.price - flashSale.flashPrice).toLocaleString()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-lg">{timeLeft}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {flashSale.quantity - flashSale.soldQuantity} left
              </span>
            </div>

            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{flashSale.soldQuantity} sold</span>
              <span>{flashSale.quantity} total</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
            disabled={isExpired || isSoldOut}
            onClick={handlePurchase}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {isSoldOut ? "SOLD OUT" :
             isExpired ? "EXPIRED" :
             "BUY NOW - LIMITED TIME!"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashSaleCard;