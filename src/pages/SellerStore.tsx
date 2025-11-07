import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { Star, MapPin, Phone, Mail, Store, Package, ShoppingCart } from 'lucide-react';

interface Seller {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  businessName: string;
  businessDescription: string;
  contactPerson: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  rating: number;
  numReviews: number;
  isActive: boolean;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  brand?: string;
  rating: number;
  numReviews: number;
  isActive: boolean;
  category: {
    name: string;
  };
}

const SellerStore = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [activeTab, setActiveTab] = useState('products');

  // Fetch seller information
  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ['sellerStore', sellerId],
    queryFn: async () => {
      const response = await api.get(`/auth/seller-profile/${sellerId}`);
      return response.data as Seller;
    },
    enabled: !!sellerId,
  });

  // Fetch seller products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { sellerId, limit: 50 }
      });
      return response.data;
    },
    enabled: !!sellerId,
  });

  if (sellerLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading seller store...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <p className="text-muted-foreground">The seller store you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const products = productsData?.products || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* Store Logo */}
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
              {seller.storeLogo ? (
                <img
                  src={seller.storeLogo}
                  alt={seller.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-8 h-8 text-primary" />
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{seller.businessName}</h1>
                <Badge variant="secondary" className="text-sm">
                  Verified Seller
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{seller.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({seller.numReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{products.length} products</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 max-w-2xl">
                {seller.storeDescription || seller.businessDescription}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{seller.businessAddress.city}, {seller.businessAddress.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{seller.businessPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{seller.businessEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-lg w-fit">
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            size="sm"
          >
            <Package className="h-4 w-4 mr-2" />
            Products ({products.length})
          </Button>
          <Button
            variant={activeTab === 'about' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('about')}
            size="sm"
          >
            About
          </Button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No products yet</h3>
                <p className="text-muted-foreground">This seller hasn't added any products yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: Product) => (
                  <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <Link to={`/products/${product._id}`}>
                        <div className="aspect-square overflow-hidden rounded-t-lg">
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </Link>

                      <div className="p-4">
                        <Link to={`/products/${product._id}`}>
                          <h3 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {product.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({product.numReviews})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              KSh {product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                KSh {product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className="text-xs">
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={product.stock === 0}
                            asChild
                          >
                            <Link to={`/products/${product._id}`}>
                              <ShoppingCart className="w-3 h-3 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About {seller.businessName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Business Description</h4>
                    <p className="text-muted-foreground">
                      {seller.businessDescription || 'No description provided.'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Contact Person:</span>
                        <span>{seller.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Business Phone:</span>
                        <span>{seller.businessPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Business Email:</span>
                        <span>{seller.businessEmail}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Business Address</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>{seller.businessAddress.street}</p>
                      <p>{seller.businessAddress.city}, {seller.businessAddress.state}</p>
                      <p>{seller.businessAddress.postalCode}, {seller.businessAddress.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Store Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Products</span>
                    <Badge variant="secondary">{products.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Store Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{seller.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Reviews</span>
                    <span className="font-medium">{seller.numReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Member Since</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(seller.createdAt).getFullYear()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerStore;