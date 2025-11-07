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
import { Upload, X, Plus, Package, ShoppingCart, DollarSign, TrendingUp, BarChart3, Settings, Store } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: { name: string };
  stock: number;
  brand?: string;
  isActive: boolean;
  images: string[];
  seller: string;
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

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
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
  });

  // Fetch seller profile
  const { data: sellerProfile } = useQuery({
    queryKey: ['sellerProfile'],
    queryFn: async () => {
      const response = await api.get('/auth/seller-profile');
      return response.data;
    },
    enabled: !!user && user.role === 'seller',
  });

  // Fetch seller products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts'],
    queryFn: async () => {
      const response = await api.get('/products?seller=true');
      return response.data.products as Product[];
    },
    enabled: !!user && user.role === 'seller',
  });

  // Fetch seller orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['sellerOrders'],
    queryFn: async () => {
      const response = await api.get('/orders?seller=true');
      return response.data;
    },
    enabled: !!user && user.role === 'seller',
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories');
      return response.data as { _id: string; name: string }[];
    },
    enabled: !!user && user.role === 'seller',
  });

  // Fetch seller stats
  const { data: sellerStats } = useQuery({
    queryKey: ['sellerStats'],
    queryFn: async () => {
      const response = await api.get('/orders/seller-stats');
      return response.data as SellerStats;
    },
    enabled: !!user && user.role === 'seller',
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
    });
    setSelectedImages([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category.name,
      stock: product.stock.toString(),
      brand: product.brand || '',
      tags: '', // TODO: Add tags from product if available
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

  if (!user || user.role !== 'seller') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need seller privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Check if user needs to refresh their status
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    enabled: !!user,
    refetchOnMount: true,
    staleTime: 0,
  });

  const currentUser = currentUserProfile || user;

  if (currentUser?.sellerStatus !== 'approved') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {currentUser?.sellerStatus === 'rejected' ? 'Seller Application Rejected' : 'Seller Account Pending Approval'}
          </h1>
          <p className="text-gray-600">
            {currentUser?.sellerStatus === 'rejected'
              ? 'Your seller application was rejected. Please contact support for more information.'
              : `Your seller application is ${currentUser?.sellerStatus || 'pending'}. Please wait for admin approval.`
            }
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Status
          </button>
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
            Welcome back, {sellerProfile?.businessName || user.name}! 👋
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
                      <p className="text-sm text-gray-600">{order.user.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
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
                          <SelectItem key={category._id} value={category.name}>
                            {category.name}
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
                          Customer: {order.user.name} | Phone: {order.user.phone}
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
                        <Button variant="outline" size="sm" onClick={() => handleUpdateOrderStatus(order._id, order.status)}>
                          Update Status
                        </Button>
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
                      {window.location.origin}/seller/{sellerProfile?.user?._id || user._id}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      <p className="text-sm text-gray-600 mt-1">{user.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm text-gray-600 mt-1">{user.phone}</p>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Badge variant="default" className="mt-1">{user.role}</Badge>
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