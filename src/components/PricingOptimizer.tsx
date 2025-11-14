import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Sparkles, Target, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const PricingOptimizer = ({ productId }: { productId?: string }) => {
  const { user } = useAuth();
  const [customPrice, setCustomPrice] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Only show for sellers and admins
  if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
    return null;
  }

  const { data: pricingData, isLoading, refetch } = useQuery({
    queryKey: ['pricing-optimization', productId],
    queryFn: async () => {
      const response = await api.get(`/pricing/analysis/${productId || ''}`);
      return response.data;
    },
    enabled: !!productId || user?.role === 'admin',
  });

  const handleOptimizePrice = async () => {
    if (!productId) return;

    setIsOptimizing(true);
    try {
      const response = await api.post(`/pricing/optimize/${productId}`, {
        customPrice: customPrice ? parseFloat(customPrice) : null
      });
      await refetch();
      setCustomPrice('');
    } catch (error) {
      console.error('Price optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            AI Pricing Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricingData) {
    return null;
  }

  const {
    currentPrice,
    recommendedPrice,
    priceRange,
    marketAnalysis,
    competitorPrices,
    demandScore,
    profitMargin,
    confidence
  } = pricingData;

  const priceDifference = recommendedPrice - currentPrice;
  const isPriceIncrease = priceDifference > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            AI Pricing Optimizer
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart Pricing
            </Badge>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {confidence}% confidence
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current vs Recommended Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Price</p>
            <p className="text-2xl font-bold text-gray-900">
              KSh {currentPrice?.toLocaleString()}
            </p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">AI Recommended</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-blue-700">
                KSh {recommendedPrice?.toLocaleString()}
              </p>
              {priceDifference !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  isPriceIncrease ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPriceIncrease ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(priceDifference).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Range Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Min: KSh {priceRange?.min?.toLocaleString()}</span>
            <span>Max: KSh {priceRange?.max?.toLocaleString()}</span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded">
            <div
              className="absolute top-0 left-0 h-2 bg-blue-500 rounded"
              style={{
                width: `${((currentPrice - priceRange?.min) / (priceRange?.max - priceRange?.min)) * 100}%`
              }}
            ></div>
            <div
              className="absolute top-0 h-2 w-1 bg-green-500 rounded"
              style={{
                left: `${((recommendedPrice - priceRange?.min) / (priceRange?.max - priceRange?.min)) * 100}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Current</span>
            <span className="text-green-600 font-medium">Recommended</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Target className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Demand Score</p>
              <p className="text-lg font-bold text-green-800">{demandScore}/10</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-700">Profit Margin</p>
              <p className="text-lg font-bold text-purple-800">{profitMargin}%</p>
            </div>
          </div>
        </div>

        {/* Market Analysis */}
        {marketAnalysis && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Market Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Competitor Prices</p>
                <div className="space-y-1">
                  {competitorPrices?.slice(0, 3).map((comp: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{comp.name}</span>
                      <span className="font-medium">KSh {comp.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-2">AI Insights</p>
                <ul className="text-sm text-blue-600 space-y-1">
                  {marketAnalysis?.insights?.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Custom Price Input */}
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="custom-price">Set Custom Price (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="custom-price"
              type="number"
              placeholder="Enter custom price..."
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleOptimizePrice}
              disabled={isOptimizing || !customPrice}
              className="px-6"
            >
              {isOptimizing ? 'Optimizing...' : 'Apply Price'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Leave empty to use AI recommended price
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh Analysis
          </Button>
          <Button variant="outline" size="sm">
            View Price History
          </Button>
          <Button variant="outline" size="sm">
            Competitor Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingOptimizer;