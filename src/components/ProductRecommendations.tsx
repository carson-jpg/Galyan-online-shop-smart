import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductRecommendations = () => {
  const { data: recommendations, isLoading, error } = useProductRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Recommended for You</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations?.recommendations?.length) {
    return null; // Don't show if no recommendations or error
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Recommended for You</h3>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.recommendations.slice(0, 6).map((product: any) => (
          <Link key={product._id} to={`/products/${product._id}`}>
            <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h4>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-green-600">
                    KSh {product.price?.toLocaleString()}
                  </span>

                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {product.soldCount && (
                  <p className="text-xs text-gray-500 mt-1">
                    {product.soldCount} sold
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recommendations.recommendations.length > 6 && (
        <div className="text-center">
          <Link
            to="/products?sort=ai_recommended"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View all recommendations →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;