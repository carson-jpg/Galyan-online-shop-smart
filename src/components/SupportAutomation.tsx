import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const SupportAutomation = () => {
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const { data: supportStats, isLoading } = useQuery({
    queryKey: ['support-automation-stats'],
    queryFn: async () => {
      const response = await api.get('/support/automation-stats');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: user?.role === 'admin',
  });

  if (isLoading || !supportStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Support Automation
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

  const {
    aiResolvedTickets,
    pendingTickets,
    avgResponseTime,
    customerSatisfaction,
    automatedResponses
  } = supportStats;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Support Automation
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{aiResolvedTickets}</div>
            <div className="text-sm text-blue-600">AI Resolved</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-700">{pendingTickets}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{avgResponseTime}s</div>
            <div className="text-sm text-green-600">Avg Response</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">{customerSatisfaction}%</div>
            <div className="text-sm text-purple-600">Satisfaction</div>
          </div>
        </div>

        {/* Recent Automated Responses */}
        {automatedResponses && automatedResponses.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recent AI Responses</h4>
            <div className="space-y-2">
              {automatedResponses.slice(0, 5).map((response: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Bot className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{response.query}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Response: {response.response.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {response.confidence}% confidence
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automation Settings */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-gray-900">Automation Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Auto-resolve simple queries</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Escalate complex issues</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Enabled
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            View Support Tickets
          </Button>
          <Button variant="outline" size="sm">
            Train AI Model
          </Button>
          <Button variant="outline" size="sm">
            Response Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportAutomation;