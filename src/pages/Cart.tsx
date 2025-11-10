import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cart, isLoading } = useCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();
  const { toast } = useToast();

  const cartItems = cart?.items || [];
  const subtotal = cart?.totalAmount || 0;
  const shipping = subtotal > 50000 ? 0 : 500; // Free shipping over KSh 50,000
  const total = subtotal + shipping;

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    updateCartItemMutation.mutate(
      { itemId, quantity: newQuantity },
      {
        onSuccess: () => {
          toast({
            title: 'Cart updated',
            description: 'Item quantity has been updated.',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to update cart',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('Cart component: Removing item with ID:', itemId);
    console.log('Current cart items:', cartItems.map(item => ({ id: item._id, product: item.product?.name })));
    removeFromCartMutation.mutate(itemId, {
      onSuccess: (data) => {
        console.log('Cart component: Remove success, new cart data:', data);
        toast({
          title: 'Item removed',
          description: 'Item has been removed from your cart.',
        });
      },
      onError: (error: any) => {
        console.error('Cart component: Remove error:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to remove item',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-secondary/30">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading cart...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
                  <Link to="/products">
                    <Button>Continue Shopping</Button>
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <img
                          src={item.product?.images?.[0] || '/placeholder.svg'}
                          alt={item.product?.name || 'Product'}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium mb-2">{item.product?.name || 'Unknown Product'}</h3>
                          {(item.size || item.color) && (
                            <div className="flex gap-2 mb-2">
                              {item.size && (
                                <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded">
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-lg font-bold text-primary mb-4">
                            KSh {item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                disabled={item.quantity >= (item.product?.stock || 0)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">KSh {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">KSh {shipping.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-4 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">KSh {total.toLocaleString()}</span>
                    </div>
                  </div>
                  {user ? (
                    <Link to="/checkout">
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={!cartItems.length || isLoading}
                      >
                        Proceed to Checkout
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login">
                      <Button className="w-full" size="lg">
                        Login to Checkout
                      </Button>
                    </Link>
                  )}
                  <Link to="/products">
                    <Button variant="outline" className="w-full mt-3">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
