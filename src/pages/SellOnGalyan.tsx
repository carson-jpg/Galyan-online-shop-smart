import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const SellOnGalyan = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to access seller features</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sell on Galyan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              Start Selling Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Join thousands of sellers on Galyan and reach millions of customers across Kenya.
            </p>
            <Button className="w-full">Apply to Sell</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Low selling fees</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Fast payment processing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Seller protection program</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm">Marketing tools included</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Step 1</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Register as Seller</h3>
            <p className="text-sm text-muted-foreground">
              Fill out our seller application form with your business details
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Step 2</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-green-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Setup Your Store</h3>
            <p className="text-sm text-muted-foreground">
              Create your seller profile and customize your store appearance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Step 3</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-purple-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Start Selling</h3>
            <p className="text-sm text-muted-foreground">
              List your products and start receiving orders from customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">What are the selling fees?</h4>
              <p className="text-sm text-muted-foreground">
                We charge a competitive 5% commission on each sale, plus a small listing fee of KSh 10 per product.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How do I get paid?</h4>
              <p className="text-sm text-muted-foreground">
                Payments are processed weekly via M-Pesa or bank transfer. Funds are typically available within 3-5 business days.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What products can I sell?</h4>
              <p className="text-sm text-muted-foreground">
                You can sell most products except those that are illegal, counterfeit, or violate our community guidelines.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Do you provide customer service?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, our customer service team handles all customer inquiries and returns on your behalf.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellOnGalyan;