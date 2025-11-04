import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

const MyReviews = () => {
  const { user } = useAuth();
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      productId: 'prod1',
      productName: 'Wireless Bluetooth Headphones',
      productImage: '/placeholder.svg',
      rating: 5,
      comment: 'Excellent sound quality and battery life. Highly recommended!',
      createdAt: '2024-11-01',
      helpful: 12,
    },
    {
      id: '2',
      productId: 'prod2',
      productName: 'Smartphone Case',
      productImage: '/placeholder.svg',
      rating: 4,
      comment: 'Good protection but a bit bulky. Still satisfied with the purchase.',
      createdAt: '2024-10-28',
      helpful: 8,
    }
  ]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your reviews</h1>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Reviews</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mb-4">You haven't written any reviews</p>
            <Button variant="outline">Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{reviews.length}</div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {reviews.reduce((sum, review) => sum + review.helpful, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Helpful Votes</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={review.productImage} alt={review.productName} />
                      <AvatarFallback>
                        {review.productName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{review.productName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {review.helpful} helpful
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{review.comment}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit Review
                        </Button>
                        <Button size="sm" variant="outline">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews;