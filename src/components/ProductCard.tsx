import { ShoppingCart, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  discount?: number;
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating = 4.5,
  discount,
}: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const addToCartMutation = useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate(
      { productId: id, quantity: 1 },
      {
        onSuccess: () => {
          toast({
            title: "Added to cart",
            description: `${name} has been added to your cart`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to add to cart",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-hover transition-all duration-300">
      <Link to={`/products/${id}`}>
        <div className="relative overflow-hidden bg-secondary group/image">
          <img
            src={image}
            alt={name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground animate-pulse">
              -{discount}%
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Quick view functionality could be added here
              }}
            >
              Quick View
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">⭐ {rating}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            KSh {price.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              KSh {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
