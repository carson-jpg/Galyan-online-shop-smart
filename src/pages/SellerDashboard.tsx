import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Upload, X, Plus, Package, ShoppingCart, DollarSign, TrendingUp, BarChart3, Settings, Store, Zap, Star, MessageSquare } from 'lucide-react';
import PricingOptimizer from '@/components/PricingOptimizer';

// Helper functions for attribute parsing
const parseAttributesString = (str: string) => {
  const attributes = [];
  const parts = str.split(';').map(p => p.trim()).filter(p => p);

  for (const part of parts) {
    const [name, valuesStr] = part.split(':').map(p => p.trim());
    if (name && valuesStr) {
      const values = valuesStr.split(',').map(v => v.trim()).filter(v => v);
      if (values.length > 0) {
        attributes.push({ name, values });
      }
    }
  }

  return attributes;
};

const formatAttributesToString = (attributes: Array<{ name: string; values: string[] }>) => {
  return attributes.map(attr => `${attr.name}: ${attr.values.join(', ')}`).join('; ');
};

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: { _id: string; name: string };
  stock: number;
  brand?: string;
  isActive: boolean;
  images: string[];
  seller: string;
  attributes?: Array<{
    name: string;
    values: string[];
  }>;
  fulfillmentType?: string;
  shippingInfo?: {
    origin?: string;
    deliveryDays?: number;
  };
}

interface Order {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  orderItems: Array<{
    product: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  createdAt: string;
}

interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalEarnings: number;
  totalSales: number;
}

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  user: {
    name: string;
    profilePicture?: string;
  };
  productName: string;
  productImage?: string;
  createdAt: string;
}

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flashSaleForm, setFlashSaleForm] = useState({
    productId: '',
    flashPrice: '',
    quantity: '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    brand: '',
    tags: '',
    attributes: '',
    fulfillmentType: 'galyan',
    shippingOrigin: '',
    deliveryDays: '',
  });

  // Fetch seller profile
  const { data: sellerProfile } = useQuery({
    queryKey: ['sellerProfile'],
    queryFn: async () => {
      const response = await api.get('/auth/seller-profile');
      return response.data;
    },
    enabled: !!user && user?.role === 'seller',
  });

  // Fetch seller products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts'],
    queryFn: async () => {
      const response = await api.get('/products?seller=true');
      return response.data.products as Product[];
    },
    enabled: !!user && user?.role === 'seller',
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch seller orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['sellerOrders'],
    queryFn: async () => {
      const response = await api.get('/orders?seller=true');
      return response.data;
    },
    enabled: !!user && user?.role === 'seller',
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories');
      return response.data as { _id: string; name: string; parent?: { name: string } }[];
    },
    enabled: !!user && user?.role === 'seller',
  });

  // Fetch seller stats
  const { data: sellerStats } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: async () => {
      const response = await api.get('/orders/seller-stats');
      return response.data as SellerStats;
    },
    enabled: !!user && user?.role === 'seller',
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch seller reviews
  const { data: sellerReviews } = useQuery({
    queryKey: ['sellerReviews'],
    queryFn: async () => {
      const response = await api.get('/reviews/seller');
      return response.data as { reviews: Review[]; total: number };
    },
    enabled: !!user && user?.role === 'seller',
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      resetProductForm();
      alert('Product created successfully!');
    },
    onError: (error: any) => {
      alert(`Error creating product: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      resetProductForm();
      setEditingProduct(null);
      alert('Product updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error updating product: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      alert('Product deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting product: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerOrders'] });
      alert('Order status updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error updating order status: ${error.response?.data?.message || error.message}`);
    },
  });

  // Create flash sale mutation
  const createFlashSaleMutation = useMutation({
    mutationFn: async (flashSaleData: { productId: string; flashPrice: number; quantity: number }) => {
      const response = await api.post('/flash-sales/seller', flashSaleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      setFlashSaleForm({ productId: '', flashPrice: '', quantity: '' });
      alert('Flash sale created successfully!');
    },
    onError: (error: any) => {
      alert(`Error creating flash sale: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('originalPrice', productForm.originalPrice || '');
    formData.append('category', productForm.category);
    formData.append('stock', productForm.stock);
    formData.append('brand', productForm.brand);
    formData.append('tags', productForm.tags);
    // Send attributes in the expected string format "Color: Red, Blue; Size: S, M, L"
    formData.append('attributes', productForm.attributes || '');
    formData.append('fulfillmentType', productForm.fulfillmentType);
    formData.append('shippingOrigin', productForm.shippingOrigin);
    formData.append('deliveryDays', productForm.deliveryDays);

    selectedImages.forEach((image, index) => {
      formData.append('images', image);
    });

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      stock: '',
      brand: '',
      tags: '',
      attributes: '',
      fulfillmentType: 'galyan',
      shippingOrigin: '',
      deliveryDays: '',
    });
    setSelectedImages([]);
  };

  const handleEditProduct = (product: Product) => {
    // Find the category object to construct hierarchical name
    const categoryObj = categories?.find(cat => cat._id === product.category._id);
    const categoryName = categoryObj?.parent ? `${categoryObj.parent.name} > ${categoryObj.name}` : categoryObj?.name || product.category.name;

    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: categoryName,
      stock: product.stock.toString(),
      brand: product.brand || '',
      tags: '', // TODO: Add tags from product if available
      attributes: product.attributes ? formatAttributesToString(product.attributes) : '',
      fulfillmentType: product.fulfillmentType || 'galyan',
      shippingOrigin: product.shippingInfo?.origin || '',
      deliveryDays: product.shippingInfo?.deliveryDays?.toString() || '',
    });
    setActiveTab('add-product');
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = prompt(`Update order status (current: ${currentStatus}). Enter new status:`, currentStatus);
    if (newStatus && newStatus !== currentStatus) {
      updateOrderStatusMutation.mutate({ orderId, status: newStatus });
    }
  };

  const handleCreateFlashSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashSaleForm.productId || !flashSaleForm.flashPrice || !flashSaleForm.quantity) {
      alert('Please fill in all fields');
      return;
    }

    createFlashSaleMutation.mutate({
      productId: flashSaleForm.productId,
      flashPrice: parseFloat(flashSaleForm.flashPrice),
      quantity: parseInt(flashSaleForm.quantity),
    });
  };

  if (!user || user?.role !== 'seller') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need seller privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (sellerProfile && !sellerProfile.isActive) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-gray-600">Your seller account is being reviewed. Please wait for admin approval to start selling.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Seller Dashboard</h1>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {sellerProfile?.businessName || user?.name}! 👋
          </h1>
          <p className="text-gray-600">Manage your products and track your sales performance.</p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{sellerStats?.totalProducts || 0}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Orders</p>
                  <p className="text-2xl font-bold text-green-900">{sellerStats?.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Sales</p>
                  <p className="text-2xl font-bold text-purple-900">KSh {sellerStats?.totalSales?.toLocaleString() || '0'}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Earnings</p>
                  <p className="text-2xl font-bold text-orange-900">
                    KSh {sellerStats?.totalEarnings?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 min-w-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className="flex-1 min-w-0"
          >
            <Package className="h-4 w-4 mr-2" />
            Products
          </Button>
          <Button
            variant={activeTab === 'add-product' ? 'default' : 'ghost'}
            onClick={() => {
              setEditingProduct(null);
              resetProductForm();
              setActiveTab('add-product');
            }}
            className="flex-1 min-w-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
            className="flex-1 min-w-0"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Orders
          </Button>
          <Button
            variant={activeTab === 'store' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('store')}
            className="flex-1 min-w-0"
          >
            <Store className="h-4 w-4 mr-2" />
            Store
          </Button>
          <Button
            variant={activeTab === 'flash-sales' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('flash-sales')}
            className="flex-1 min-w-0"
          >
            <Zap className="h-4 w-4 mr-2" />
            Flash Sales
          </Button>
          <Button
            variant={activeTab === 'pricing' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pricing')}
            className="flex-1 min-w-0"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            AI Pricing
          </Button>
          <Button
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reviews')}
            className="flex-1 min-w-0"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className="flex-1 min-w-0"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-4">Loading orders...</div>
                ) : ordersData?.orders?.slice(0, 5).map((order: Order) => (
                  <div key={order._id} className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer" onClick={() => setActiveTab('orders')}>
                    <div>
                      <p className="font-medium">Order #{order._id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{order.user?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KSh {order.totalPrice.toLocaleString()}</p>
                      <Badge variant={order.isPaid ? 'default' : 'destructive'} className="text-xs">
                        {order.isPaid ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                )) || <div className="text-center py-4 text-gray-500">No recent orders</div>}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Your Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-4">Loading products...</div>
                ) : products?.slice(0, 5).map((product) => (
                  <div key={product._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">Stock: {product.stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KSh {product.price.toLocaleString()}</p>
                      <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )) || <div className="text-center py-4 text-gray-500">No products yet</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-4">Loading products...</div>
              ) : products && products.length === 0 ? (
                <div className="text-center py-4">No products found</div>
              ) : (
                <div className="space-y-4">
                  {products?.map((product) => (
                    <div key={product._id} className="flex items-center justify-between border rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Category: {product.category.name} | Stock: {product.stock}
                          </p>
                          <p className="text-sm font-medium">KSh {product.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product._id, product.name)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Product Tab */}
        {activeTab === 'add-product' && (
          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={productForm.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </div>
 
                  <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price (KSh) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price (KSh)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={productForm.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={productForm.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category._id} value={category.parent ? `${category.parent.name} > ${category.name}` : category.name}>
                            {category.parent ? `${category.parent.name} > ${category.name}` : category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={productForm.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g. electronics, smartphone, 5g"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fulfillmentType">Fulfillment Type *</Label>
                    <Select value={productForm.fulfillmentType} onValueChange={(value) => handleInputChange('fulfillmentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fulfillment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="galyan">Fulfilled by Galyan Shop</SelectItem>
                        <SelectItem value="seller">Shipped by Seller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shippingOrigin">Shipping Origin</Label>
                    <Input
                      id="shippingOrigin"
                      value={productForm.shippingOrigin}
                      onChange={(e) => handleInputChange('shippingOrigin', e.target.value)}
                      placeholder="e.g. China, USA, Kenya"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDays">Delivery Days</Label>
                    <Input
                      id="deliveryDays"
                      type="number"
                      min="1"
                      max="90"
                      value={productForm.deliveryDays}
                      onChange={(e) => handleInputChange('deliveryDays', e.target.value)}
                      placeholder="e.g. 3-5 days"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="attributes">Attributes (e.g. Color: Red, Blue; Size: S, M, L)</Label>
                  <Textarea
                    id="attributes"
                    value={productForm.attributes}
                    onChange={(e) => handleInputChange('attributes', e.target.value)}
                    placeholder='e.g. Color: Red, Blue; Size: S, M, L'
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter attributes in format: AttributeName: value1, value2; AttributeName2: value1, value2
                  </p>
                </div>
                </div>

                <div>
                  <Label>Product Images (Max 5) *</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload images or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG, WebP up to 5MB each</p>
                      </div>
                    </Label>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={(createProductMutation.isPending || updateProductMutation.isPending) || (selectedImages.length === 0 && !editingProduct)}
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending)
                    ? (editingProduct ? 'Updating Product...' : 'Creating Product...')
                    : (editingProduct ? 'Update Product' : 'Create Product')
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : ordersData && ordersData.length === 0 ? (
                <div className="text-center py-4">No orders found</div>
              ) : (
                <div className="space-y-4">
                  {ordersData?.orders?.map((order: Order) => (
                    <div key={order._id} className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <h3 className="font-medium">Order #{order._id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          Customer: {order.user?.name} | Phone: {order.user?.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          Items: {order.orderItems.length} | Total: KSh {order.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.isPaid ? 'default' : 'destructive'}>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        <Badge variant={order.isDelivered ? 'default' : 'secondary'}>
                          {order.isDelivered ? 'Delivered' : 'Pending'}
                        </Badge>
                        <Badge variant="outline">{order.status}</Badge>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatusMutation.mutate({ orderId: order._id, status: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Store Settings Tab */}
        {activeTab === 'store' && (
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Store Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Business Name</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.businessName}</p>
                    </div>
                    <div>
                      <Label>Store Description</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.storeDescription || 'Not set'}</p>
                    </div>
                    <div>
                      <Label>Commission Rate</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.commissionRate || 10}%</p>
                    </div>
                    <div>
                      <Label>Total Earnings</Label>
                      <p className="text-sm text-gray-600 mt-1">KSh {sellerProfile?.totalEarnings?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Storefront Link</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Your public store URL:</p>
                    <code className="text-sm bg-white px-2 py-1 rounded border">
                      {window.location.origin}/seller/{sellerProfile?.user?._id || user?._id}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flash Sales Tab */}
        {activeTab === 'flash-sales' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Flash Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFlashSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="product">Select Product *</Label>
                    <Select value={flashSaleForm.productId} onValueChange={(value) => setFlashSaleForm(prev => ({ ...prev, productId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter(product => product.isActive).map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} - KSh {product.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="flashPrice">Flash Sale Price (KSh) *</Label>
                    <Input
                      id="flashPrice"
                      type="number"
                      step="0.01"
                      value={flashSaleForm.flashPrice}
                      onChange={(e) => setFlashSaleForm(prev => ({ ...prev, flashPrice: e.target.value }))}
                      placeholder="Enter discounted price"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={flashSaleForm.quantity}
                      onChange={(e) => setFlashSaleForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Available quantity"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createFlashSaleMutation.isPending}
                >
                  {createFlashSaleMutation.isPending ? 'Creating Flash Sale...' : 'Create Flash Sale'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pricing Optimizer Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Pricing Optimization</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered pricing recommendations for your products based on market analysis, competitor pricing, and demand patterns.
                </p>
              </CardHeader>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Product for Pricing Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products?.filter(product => product.isActive).map((product) => (
                    <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-sm text-gray-600">Current: KSh {product.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab(`pricing-${product._id}`)}
                      >
                        Analyze Pricing
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <p className="text-sm text-muted-foreground">
                View all customer reviews for your products
              </p>
            </CardHeader>
            <CardContent>
              {!sellerReviews?.reviews || sellerReviews.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600">Customer reviews for your products will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sellerReviews.reviews.map((review) => (
                    <div key={review._id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.user.profilePicture || "/placeholder.svg"}
                            alt={review.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{review.user.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              {review.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={review.productImage || "/placeholder.svg"}
                            alt={review.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm font-medium">{review.productName}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">{review.title}</h4>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Individual Product Pricing Analysis */}
        {activeTab.startsWith('pricing-') && (
          <PricingOptimizer productId={activeTab.replace('pricing-', '')} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm text-gray-600 mt-1">{user?.phone}</p>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Badge variant="default" className="mt-1">{user?.role}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Business Name</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.businessName}</p>
                    </div>
                    <div>
                      <Label>Contact Person</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.contactPerson}</p>
                    </div>
                    <div>
                      <Label>Business Phone</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.businessPhone}</p>
                    </div>
                    <div>
                      <Label>KRA PIN</Label>
                      <p className="text-sm text-gray-600 mt-1">{sellerProfile?.kraPin}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;