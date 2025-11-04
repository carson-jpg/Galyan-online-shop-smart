import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const Vouchers = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your vouchers</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Vouchers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">No Vouchers Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't received any vouchers</p>
            <Button variant="outline" size="sm">
              Browse Products
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Welcome Voucher</span>
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">KSh 100 OFF</div>
            <p className="text-sm text-muted-foreground mb-4">Valid on orders over KSh 500</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Use Now</Button>
              <Button size="sm" variant="outline">Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Loyalty Reward</span>
              <Badge variant="secondary">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">10% OFF</div>
            <p className="text-sm text-muted-foreground mb-4">Valid on all products</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">Use Now</Button>
              <Button size="sm" variant="outline">Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Earn Vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Make Your First Purchase</h4>
                <p className="text-sm text-muted-foreground">Get a welcome voucher on your first order</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-green-600">2</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Leave Reviews</h4>
                <p className="text-sm text-muted-foreground">Earn vouchers by reviewing products</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-purple-600">3</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Refer Friends</h4>
                <p className="text-sm text-muted-foreground">Get vouchers when friends sign up</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-yellow-600">4</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Seasonal Promotions</h4>
                <p className="text-sm text-muted-foreground">Special vouchers during holidays</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vouchers;