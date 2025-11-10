import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useChat';
import api from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

interface Order {
  _id: string;
  orderItems: Array<{
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
  mpesaReceiptNumber?: string;
}

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
}

const Profile = () => {
    const { user, logout, setUser } = useAuth();
    const { data: unreadCount } = useUnreadCount();
    const [activeTab, setActiveTab] = useState('profile');
    const [orderSubTab, setOrderSubTab] = useState('unpaid');
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

  // Profile update state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Profile picture state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    darkMode: false,
  });

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['userOrders'],
    queryFn: async () => {
      const response = await api.get('/orders/myorders');
      return response.data as Order[];
    },
    enabled: !!user,
  });

  // Fetch user cart
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['userCart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.items || [];
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      alert('Profile updated successfully!');
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user data in localStorage and state
      const updatedUser = { ...user, profilePicture: response.data.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Force re-render by updating the user state
      setUser(updatedUser);

      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      alert('Profile picture updated successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload profile picture: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    // Here you could save settings to backend
    localStorage.setItem('userSettings', JSON.stringify({ ...settings, [setting]: value }));
  };

  const handleChangePassword = () => {
    alert('Change password functionality would be implemented here');
  };

  const handleEnable2FA = () => {
    alert('Two-factor authentication setup would be implemented here');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your profile</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
           <TabsTrigger value="profile">Profile</TabsTrigger>
           <TabsTrigger value="orders">My Orders</TabsTrigger>
           <TabsTrigger value="assets">My Assets</TabsTrigger>
           <TabsTrigger value="services">My services</TabsTrigger>
         </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group">
                  <Avatar className="w-32 h-32 ring-4 ring-primary/20 ring-offset-2 ring-offset-background">
                    <AvatarImage
                      src={previewUrl || user?.profilePicture || '/placeholder.svg'}
                      alt="Profile Picture"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose Image
                    </Button>
                    {selectedFile && (
                      <Button
                        onClick={handleProfilePictureUpload}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Upload Picture
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="h-11"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-11"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Role</Label>
                  <div className="flex items-center gap-2 h-11 px-3 py-2 border border-input bg-background rounded-md">
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.role === 'admin' ? 'Administrator' : 'Customer'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                  className="px-8 h-11 bg-primary hover:bg-primary/90"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>My Orders</CardTitle>
             </CardHeader>
             <CardContent>
               <Tabs value={orderSubTab} onValueChange={setOrderSubTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-5">
                   <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
                   <TabsTrigger value="to-be-shipped">To be shipped</TabsTrigger>
                   <TabsTrigger value="shipped">Shipped</TabsTrigger>
                   <TabsTrigger value="to-be-reviewed">To be reviewed</TabsTrigger>
                   <TabsTrigger value="return-refund">Return/Refund</TabsTrigger>
                 </TabsList>
                 <TabsContent value="unpaid" className="mt-6">
                   {ordersLoading ? (
                     <div className="text-center py-4">Loading orders...</div>
                   ) : orders && orders.filter(order => !order.isPaid).length === 0 ? (
                     <div className="text-center py-4">
                       <p className="mb-4">No unpaid orders found</p>
                       <Button asChild>
                         <Link to="/products">Start Shopping</Link>
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {orders?.filter(order => !order.isPaid).slice(0, 5).map((order) => (
                         <div key={order._id} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-medium">Order #{order._id.slice(-8)}</p>
                               <p className="text-sm text-gray-600">
                                 {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <Badge className={getStatusColor(order.status)}>
                                 {order.status}
                               </Badge>
                               <p className="font-bold mt-1">
                                 KSh {order.totalPrice.toLocaleString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Items: {order.orderItems.length}</span>
                             <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                               {order.isPaid ? 'Paid' : 'Pending Payment'}
                             </span>
                           </div>
                         </div>
                       ))}
                       {orders && orders.filter(order => !order.isPaid).length > 5 && (
                         <Button asChild className="w-full">
                           <Link to="/orders">View All Orders</Link>
                         </Button>
                       )}
                     </div>
                   )}
                 </TabsContent>
                 <TabsContent value="to-be-shipped" className="mt-6">
                   {ordersLoading ? (
                     <div className="text-center py-4">Loading orders...</div>
                   ) : orders && orders.filter(order => order.status === 'Processing').length === 0 ? (
                     <div className="text-center py-4">
                       <p className="mb-4">No orders to be shipped</p>
                       <Button asChild>
                         <Link to="/products">Start Shopping</Link>
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {orders?.filter(order => order.status === 'Processing').slice(0, 5).map((order) => (
                         <div key={order._id} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-medium">Order #{order._id.slice(-8)}</p>
                               <p className="text-sm text-gray-600">
                                 {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <Badge className={getStatusColor(order.status)}>
                                 {order.status}
                               </Badge>
                               <p className="font-bold mt-1">
                                 KSh {order.totalPrice.toLocaleString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Items: {order.orderItems.length}</span>
                             <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                               {order.isPaid ? 'Paid' : 'Pending Payment'}
                             </span>
                           </div>
                         </div>
                       ))}
                       {orders && orders.filter(order => order.status === 'Processing').length > 5 && (
                         <Button asChild className="w-full">
                           <Link to="/orders">View All Orders</Link>
                         </Button>
                       )}
                     </div>
                   )}
                 </TabsContent>
                 <TabsContent value="shipped" className="mt-6">
                   {ordersLoading ? (
                     <div className="text-center py-4">Loading orders...</div>
                   ) : orders && orders.filter(order => order.status === 'Shipped').length === 0 ? (
                     <div className="text-center py-4">
                       <p className="mb-4">No shipped orders</p>
                       <Button asChild>
                         <Link to="/products">Start Shopping</Link>
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {orders?.filter(order => order.status === 'Shipped').slice(0, 5).map((order) => (
                         <div key={order._id} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-medium">Order #{order._id.slice(-8)}</p>
                               <p className="text-sm text-gray-600">
                                 {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <Badge className={getStatusColor(order.status)}>
                                 {order.status}
                               </Badge>
                               <p className="font-bold mt-1">
                                 KSh {order.totalPrice.toLocaleString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Items: {order.orderItems.length}</span>
                             <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                               {order.isPaid ? 'Paid' : 'Pending Payment'}
                             </span>
                           </div>
                         </div>
                       ))}
                       {orders && orders.filter(order => order.status === 'Shipped').length > 5 && (
                         <Button asChild className="w-full">
                           <Link to="/orders">View All Orders</Link>
                         </Button>
                       )}
                     </div>
                   )}
                 </TabsContent>
                 <TabsContent value="to-be-reviewed" className="mt-6">
                   {ordersLoading ? (
                     <div className="text-center py-4">Loading orders...</div>
                   ) : orders && orders.filter(order => order.status === 'Delivered').length === 0 ? (
                     <div className="text-center py-4">
                       <p className="mb-4">No orders to be reviewed</p>
                       <Button asChild>
                         <Link to="/products">Start Shopping</Link>
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {orders?.filter(order => order.status === 'Delivered').slice(0, 5).map((order) => (
                         <div key={order._id} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-medium">Order #{order._id.slice(-8)}</p>
                               <p className="text-sm text-gray-600">
                                 {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <Badge className={getStatusColor(order.status)}>
                                 {order.status}
                               </Badge>
                               <p className="font-bold mt-1">
                                 KSh {order.totalPrice.toLocaleString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Items: {order.orderItems.length}</span>
                             <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                               {order.isPaid ? 'Paid' : 'Pending Payment'}
                             </span>
                           </div>
                         </div>
                       ))}
                       {orders && orders.filter(order => order.status === 'Delivered').length > 5 && (
                         <Button asChild className="w-full">
                           <Link to="/orders">View All Orders</Link>
                         </Button>
                       )}
                     </div>
                   )}
                 </TabsContent>
                 <TabsContent value="return-refund" className="mt-6">
                   {ordersLoading ? (
                     <div className="text-center py-4">Loading orders...</div>
                   ) : orders && orders.filter(order => order.status === 'Cancelled').length === 0 ? (
                     <div className="text-center py-4">
                       <p className="mb-4">No return/refund orders</p>
                       <Button asChild>
                         <Link to="/products">Start Shopping</Link>
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {orders?.filter(order => order.status === 'Cancelled').slice(0, 5).map((order) => (
                         <div key={order._id} className="border rounded-lg p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="font-medium">Order #{order._id.slice(-8)}</p>
                               <p className="text-sm text-gray-600">
                                 {new Date(order.createdAt).toLocaleDateString()}
                               </p>
                             </div>
                             <div className="text-right">
                               <Badge className={getStatusColor(order.status)}>
                                 {order.status}
                               </Badge>
                               <p className="font-bold mt-1">
                                 KSh {order.totalPrice.toLocaleString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span>Items: {order.orderItems.length}</span>
                             <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                               {order.isPaid ? 'Paid' : 'Pending Payment'}
                             </span>
                           </div>
                         </div>
                       ))}
                       {orders && orders.filter(order => order.status === 'Cancelled').length > 5 && (
                         <Button asChild className="w-full">
                           <Link to="/orders">View All Orders</Link>
                         </Button>
                       )}
                     </div>
                   )}
                 </TabsContent>
               </Tabs>
             </CardContent>
           </Card>
         </TabsContent>

        <TabsContent value="assets" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>My Assets</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/wallet')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Wallet</h3>
                   <p className="text-sm text-muted-foreground">Manage your digital wallet</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/vouchers')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Vouchers</h3>
                   <p className="text-sm text-muted-foreground">View and redeem vouchers</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/coins')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Coins</h3>
                   <p className="text-sm text-muted-foreground">Earn and spend coins</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

        <TabsContent value="services" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>My services</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/address-book')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Address Book</h3>
                   <p className="text-sm text-muted-foreground">Manage your addresses</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/my-reviews')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">My reviews</h3>
                   <p className="text-sm text-muted-foreground">View and manage reviews</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/sell-on-galyan')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Sell on Galyan</h3>
                   <p className="text-sm text-muted-foreground">Start selling products</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/faq')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">FAQ</h3>
                   <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/customer-services')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Customer services</h3>
                   <p className="text-sm text-muted-foreground">Get help and support</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/chat')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center relative">
                     <MessageCircle className="w-6 h-6 text-blue-600" />
                     {unreadCount && unreadCount > 0 && (
                       <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs font-bold animate-pulse">
                         {unreadCount > 99 ? '99+' : unreadCount}
                       </Badge>
                     )}
                   </div>
                   <h3 className="font-semibold mb-2">Messages</h3>
                   <p className="text-sm text-muted-foreground">Chat with sellers</p>
                 </div>
                 <div className="text-center p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
                   <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                   </div>
                   <h3 className="font-semibold mb-2">Settings</h3>
                   <p className="text-sm text-muted-foreground">Account preferences</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;