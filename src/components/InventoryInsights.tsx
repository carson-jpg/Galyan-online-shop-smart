import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, TrendingUp, Package, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const InventoryInsights = () => {
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const { data: inventoryInsights, isLoading, refetch } = useQuery({
    queryKey: ['inventory-insights'],
    queryFn: async () => {
      const response = await api.get('/products/inventory-insights');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: user?.role === 'admin',
  });

  if (isLoading || !inventoryInsights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { lowStockItems, outOfStockItems, overstockedItems, recommendations } = inventoryInsights;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            AI Inventory Insights
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stock Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lowStockItems > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Low Stock Alert</p>
                <p className="text-sm text-yellow-700">{lowStockItems} items need restocking</p>
              </div>
            </div>
          )}

          {outOfStockItems > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Out of Stock</p>
                <p className="text-sm text-red-700">{outOfStockItems} items unavailable</p>
              </div>
            </div>
          )}

          {overstockedItems > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Overstocked Items</p>
                <p className="text-sm text-blue-700">{overstockedItems} items may need promotion</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{rec.message}</p>
                    {rec.action && (
                      <Button variant="outline" size="sm" className="mt-2">
                        {rec.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            View Inventory Report
          </Button>
          <Button variant="outline" size="sm">
            Auto Restock Suggestions
          </Button>
          <Button variant="outline" size="sm">
            Stock Level Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryInsights;