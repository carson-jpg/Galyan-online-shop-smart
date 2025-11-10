import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import api from '@/lib/api';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: cart } = useCart();
  const queryClient = useQueryClient();
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Check for flash sale purchase
  const flashSaleData = JSON.parse(sessionStorage.getItem('flashSalePurchase') || 'null');

  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'Kenya',
  });
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post('/orders', orderData);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Order created successfully!',
        description: 'Redirecting to payment...',
      });
      initiatePayment(data._id);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create order',
        variant: 'destructive',
      });
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const amount = flashSaleData
        ? flashSaleData.flashPrice * flashSaleData.quantity
        : cart?.totalAmount;

      const response = await api.post('/mpesa/stkpush', {
        orderId,
        phoneNumber,
        amount,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Payment initiated',
        description: 'Please check your phone for the M-Pesa prompt.',
      });

      // Clear flash sale data on successful payment initiation
      if (flashSaleData) {
        sessionStorage.removeItem('flashSalePurchase');
      }

      navigate('/orders');
    },
    onError: (error: any) => {
      toast({
        title: 'Payment failed',
        description: error.response?.data?.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please enter your M-Pesa phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Handle flash sale purchase
    if (flashSaleData) {
      try {
        // Use flash sale purchase API
        const response = await api.post(`/flash-sales/${flashSaleData.flashSaleId}/purchase`, {
          quantity: flashSaleData.quantity
        });

        toast({
          title: 'Flash Sale Purchase Successful!',
          description: 'Your order has been placed successfully.',
        });

        // Clear flash sale data
        sessionStorage.removeItem('flashSalePurchase');

        // Redirect to orders
        navigate('/orders');
      } catch (error: any) {
        toast({
          title: 'Purchase failed',
          description: error.response?.data?.message || 'Something went wrong',
          variant: 'destructive',
        });
      }
      return;
    }

    // Handle regular cart checkout
    if (!cart || cart.items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checkout.',
        variant: 'destructive',
      });
      return;
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product?._id,
      name: item.product?.name || 'Unknown Product',
      image: item.product?.images?.[0] || '/placeholder.svg',
      price: item.price,
      quantity: item.quantity,
    }));

    const orderData = {
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: cart.totalAmount,
    };

    createOrderMutation.mutate(orderData);
  };

  const initiatePayment = (orderId: string) => {
    initiatePaymentMutation.mutate(orderId);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use Google Maps Geocoding API to get address from coordinates
          const { Geocoder } = await window.google.maps.importLibrary("geocoding");
          const geocoder = new Geocoder();
          const latLng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const place = results[0];
              setShippingAddress(prev => ({
                ...prev,
                address: place.formatted_address,
              }));

              // Extract city and postal code
              const cityComponent = place.address_components?.find(component =>
                component.types.includes('locality') || component.types.includes('administrative_area_level_1')
              );
              if (cityComponent) {
                setShippingAddress(prev => ({
                  ...prev,
                  city: cityComponent.long_name,
                }));
              }

              const postalCodeComponent = place.address_components?.find(component =>
                component.types.includes('postal_code')
              );
              if (postalCodeComponent) {
                setShippingAddress(prev => ({
                  ...prev,
                  postalCode: postalCodeComponent.long_name,
                }));
              }

              toast({
                title: 'Location detected',
                description: 'Your current location has been set as the shipping address.',
              });
            } else {
              toast({
                title: 'Location detection failed',
                description: 'Could not determine your address from location.',
                variant: 'destructive',
              });
            }
            setIsGettingLocation(false);
          });
        } catch (error) {
          toast({
            title: 'Location detection failed',
            description: 'An error occurred while detecting your location.',
            variant: 'destructive',
          });
          setIsGettingLocation(false);
        }
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast({
          title: 'Location detection failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if cart is empty and no flash sale data
    if (!flashSaleData && (!cart || cart.items.length === 0)) {
      navigate('/cart');
      return;
    }

    // Initialize Google Places Autocomplete
    const initializeAutocomplete = async () => {
      if (!window.google || !addressInputRef.current) return;

      try {
        const { Autocomplete } = await window.google.maps.importLibrary("places");

        const autocomplete = new Autocomplete(addressInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'ke' }, // Restrict to Kenya
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setShippingAddress(prev => ({
              ...prev,
              address: place.formatted_address || '',
            }));

            // Extract city from address components
            const cityComponent = place.address_components?.find(component =>
              component.types.includes('locality') || component.types.includes('administrative_area_level_1')
            );
            if (cityComponent) {
              setShippingAddress(prev => ({
                ...prev,
                city: cityComponent.long_name,
              }));
            }

            // Extract postal code
            const postalCodeComponent = place.address_components?.find(component =>
              component.types.includes('postal_code')
            );
            if (postalCodeComponent) {
              setShippingAddress(prev => ({
                ...prev,
                postalCode: postalCodeComponent.long_name,
              }));
            }
          }
        });
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    initializeAutocomplete();
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Don't show empty cart message for flash sales
  if (!flashSaleData && (!cart || cart.items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-4">Add some items to your cart before proceeding to checkout.</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashSaleData ? (
                  // Flash sale order summary
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">Flash Sale Purchase</h3>
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">FLASH SALE</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Quantity: {flashSaleData.quantity} × KSh {flashSaleData.flashPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="font-medium text-red-600">
                      KSh {(flashSaleData.flashPrice * flashSaleData.quantity).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  // Regular cart order summary
                  cart.items.map((item) => (
                    <div key={item._id} className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.svg'}
                        alt={item.product?.name || 'Product'}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product?.name || 'Unknown Product'}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × KSh {item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="font-medium">
                        KSh {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className={flashSaleData ? 'text-red-600' : ''}>
                    KSh {(flashSaleData
                      ? flashSaleData.flashPrice * flashSaleData.quantity
                      : cart.totalAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shipping & Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shipping Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Shipping Address</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="address"
                          ref={addressInputRef}
                          value={shippingAddress.address}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, address: e.target.value })
                          }
                          placeholder="Start typing your address..."
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation}
                          className="shrink-0"
                        >
                          {isGettingLocation ? 'Getting Location...' : '📍 Use GPS'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, city: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={shippingAddress.postalCode}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Method</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="M-Pesa" id="mpesa" />
                      <Label htmlFor="mpesa">M-Pesa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Cash on Delivery" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'M-Pesa' && (
                    <div>
                      <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="254XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createOrderMutation.isPending || initiatePaymentMutation.isPending}
                >
                  {createOrderMutation.isPending || initiatePaymentMutation.isPending
                    ? 'Processing...'
                    : 'Place Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;