import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

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

const Orders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders/myorders');
      return response.data as Order[];
    },
    enabled: !!user,
  });

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
          <h1 className="text-2xl font-bold mb-4">Please login to view your orders</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders && orders.length === 0 ? (
        <div className="text-center">
          <h2 className="text-xl font-medium mb-4">No orders found</h2>
          <Button asChild>
            <Link to="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders?.map((order) => (
            <Card key={order._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order._id.slice(-8)}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <p className="text-lg font-bold mt-2">
                      KSh {order.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-2">Items:</h3>
                    <div className="space-y-2">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <img
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × KSh {item.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="font-medium">
                            KSh {(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Payment Status:</span>{' '}
                        <Badge variant={order.isPaid ? 'default' : 'secondary'}>
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      </p>
                      {order.mpesaReceiptNumber && (
                        <p className="text-sm text-gray-600">
                          Receipt: {order.mpesaReceiptNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Delivery Status:</span>{' '}
                        <Badge variant={order.isDelivered ? 'default' : 'secondary'}>
                          {order.isDelivered ? 'Delivered' : 'In Transit'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;