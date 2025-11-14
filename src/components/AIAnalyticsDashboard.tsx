import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign, Sparkles, Brain, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const AIAnalyticsDashboard = () => {
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const { data: aiAnalytics, isLoading } = useQuery({
    queryKey: ['ai-analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics/ai-insights');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: user?.role === 'admin',
  });

  if (isLoading || !aiAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    aiPerformance,
    userBehavior,
    salesPredictions,
    recommendations,
    conversionMetrics
  } = aiAnalytics;

  return (
    <div className="space-y-6">
      {/* AI Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Performance Overview
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{aiPerformance.accuracy}%</div>
              <div className="text-sm text-blue-600">Recommendation Accuracy</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{aiPerformance.userEngagement}%</div>
              <div className="text-sm text-green-600">User Engagement</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">{aiPerformance.conversionLift}%</div>
              <div className="text-sm text-purple-600">Conversion Lift</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">KSh {aiPerformance.revenueImpact?.toLocaleString()}</div>
              <div className="text-sm text-orange-600">Revenue Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Behavior Trends */}
        <Card>
          <CardHeader>
            <CardTitle>User Behavior Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userBehavior?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="pageViews" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="aiInteractions" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>AI Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionMetrics?.funnel || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#8884d8" />
                <Bar dataKey="aiInfluenced" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Sales Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-700 mb-2">
                KSh {salesPredictions?.nextWeek?.toLocaleString()}
              </div>
              <div className="text-sm text-green-600 mb-1">Predicted Next Week</div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                +{salesPredictions?.growth}% growth
              </Badge>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-700 mb-2">
                KSh {salesPredictions?.nextMonth?.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600 mb-1">Predicted Next Month</div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {salesPredictions?.confidence}% confidence
              </Badge>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-700 mb-2">
                {salesPredictions?.topProduct}
              </div>
              <div className="text-sm text-purple-600 mb-1">Predicted Top Product</div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                AI Recommended
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Business Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Impact: {rec.impact}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Confidence: {rec.confidence}%
                      </Badge>
                      {rec.action && (
                        <Button size="sm" variant="outline" className="ml-auto">
                          {rec.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 justify-center">
        <Button variant="outline">
          Export AI Report
        </Button>
        <Button variant="outline">
          Adjust AI Models
        </Button>
        <Button variant="outline">
          View Detailed Analytics
        </Button>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;