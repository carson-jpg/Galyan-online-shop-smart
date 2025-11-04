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
import { Upload, X, Plus, Users, Trash2, BarChart3, TrendingUp, Package, ShoppingCart, DollarSign, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

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
}

interface Category {
  _id: string;
  name: string;
}

interface Order {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  mpesaTransactionId?: string;
  mpesaReceiptNumber?: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

const AdminDashboard = () => {
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

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: async () => {
      const response = await api.get('/admin/products');
      return response.data.products as Product[];
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/admin/categories');
      return response.data as Category[];
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const response = await api.get('/admin/orders');
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: async () => {
      const response = await api.get('/admin/payments');
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/auth/users');
      return response.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      alert('User deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      alert(`Error deleting user: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.put(`/admin/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      alert('Order status updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error updating order status: ${error.response?.data?.message || error.message}`);
    },
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
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
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
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
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
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      alert('Product deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting product: ${error.response?.data?.message || error.message}`);
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{products?.length || 0}</p>
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
                  <p className="text-2xl font-bold text-green-900">{ordersData?.orders?.length || 0}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Users</p>
                  <p className="text-2xl font-bold text-purple-900">{usersData?.users?.length || 0}</p>
                </div>
                <User className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Revenue</p>
                  <p className="text-2xl font-bold text-orange-900">
                    KSh {ordersData?.orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString() || '0'}
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
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
            className="flex-1 min-w-0"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Orders
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
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-1 min-w-0"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className="flex-1 min-w-0"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <Card className="lg:col-span-2">
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('add-product')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('products')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Users
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
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
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Category: {product.category.name} | Stock: {product.stock}
                      </p>
                      <p className="text-sm font-medium">KSh {product.price.toLocaleString()}</p>
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

      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
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

      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="text-center py-4">Loading payments...</div>
            ) : paymentsData && paymentsData.length === 0 ? (
              <div className="text-center py-4">No payments found</div>
            ) : (
              <div className="space-y-4">
                {paymentsData?.payments?.map((payment: Payment) => (
                  <div key={payment._id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <h3 className="font-medium">Payment #{payment._id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600">
                        Customer: {payment.user.name} | Phone: {payment.user.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        Method: {payment.paymentMethod} | Amount: KSh {payment.totalPrice.toLocaleString()}
                      </p>
                      {payment.mpesaTransactionId && (
                        <p className="text-sm text-gray-600">
                          M-Pesa ID: {payment.mpesaTransactionId}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Date: {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={payment.isPaid ? 'default' : 'destructive'}>
                        {payment.isPaid ? 'Paid' : 'Failed'}
                      </Badge>
                      {payment.paidAt && (
                        <Badge variant="outline">
                          Paid: {new Date(payment.paidAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.length || 0}</div>
                <p className="text-xs opacity-75">All products in catalog</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <BarChart3 className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.filter(p => p.isActive).length || 0}
                </div>
                <p className="text-xs opacity-75">Currently available</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.filter(p => p.stock < 10).length || 0}
                </div>
                <p className="text-xs opacity-75">Need restocking</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <User className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersData?.users?.length || 0}</div>
                <p className="text-xs opacity-75">Registered users</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Categories Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Products by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Electronics', value: products?.filter(p => p.category.name === 'Electronics').length || 0, fill: '#8884d8' },
                        { name: 'Fashion', value: products?.filter(p => p.category.name === 'Fashion').length || 0, fill: '#82ca9d' },
                        { name: 'Home', value: products?.filter(p => p.category.name === 'Home').length || 0, fill: '#ffc658' },
                        { name: 'Beauty', value: products?.filter(p => p.category.name === 'Beauty').length || 0, fill: '#ff7c7c' },
                        { name: 'Sports', value: products?.filter(p => p.category.name === 'Sports').length || 0, fill: '#8dd1e1' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        '#8884d8',
                        '#82ca9d',
                        '#ffc658',
                        '#ff7c7c',
                        '#8dd1e1'
                      ].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock Levels Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'High Stock (50+)', value: products?.filter(p => p.stock >= 50).length || 0 },
                    { name: 'Medium Stock (20-49)', value: products?.filter(p => p.stock >= 20 && p.stock < 50).length || 0 },
                    { name: 'Low Stock (10-19)', value: products?.filter(p => p.stock >= 10 && p.stock < 20).length || 0 },
                    { name: 'Critical Stock (<10)', value: products?.filter(p => p.stock < 10).length || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { month: 'Jan', orders: 45, revenue: 125000 },
                  { month: 'Feb', orders: 52, revenue: 145000 },
                  { month: 'Mar', orders: 48, revenue: 132000 },
                  { month: 'Apr', orders: 61, revenue: 168000 },
                  { month: 'May', orders: 55, revenue: 152000 },
                  { month: 'Jun', orders: 67, revenue: 185000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="orders" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New product added</p>
                    <p className="text-xs text-gray-500">Samsung Galaxy A54 - 2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Order completed</p>
                    <p className="text-xs text-gray-500">Order #12345 - 5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low stock alert</p>
                    <p className="text-xs text-gray-500">Nike Air Max - Only 3 left</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : usersData && usersData.users && usersData.users.length === 0 ? (
              <div className="text-center py-4">No users found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users?.map((user: User) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.role !== 'admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
                                deleteUserMutation.mutate(user._id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;