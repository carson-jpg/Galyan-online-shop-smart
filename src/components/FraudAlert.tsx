import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const FraudAlert = () => {
  const { user } = useAuth();

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const { data: fraudStats, isLoading } = useQuery({
    queryKey: ['fraud-stats'],
    queryFn: async () => {
      const response = await api.get('/orders/fraud-stats');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: user?.role === 'admin',
  });

  if (isLoading || !fraudStats) {
    return null;
  }

  const { highRiskOrders, suspiciousActivities, blockedPayments } = fraudStats;

  // Only show if there are active fraud alerts
  if (highRiskOrders === 0 && suspiciousActivities === 0 && blockedPayments === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Shield className="w-5 h-5" />
          Fraud Detection Alert
          <Badge variant="destructive" className="ml-auto">
            AI Protected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {highRiskOrders > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <p className="font-medium text-red-700">High Risk Orders</p>
                <p className="text-sm text-red-600">{highRiskOrders} orders flagged for review</p>
              </div>
            </div>
            <Badge variant="destructive">{highRiskOrders}</Badge>
          </div>
        )}

        {suspiciousActivities > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-700">Suspicious Activities</p>
                <p className="text-sm text-yellow-600">{suspiciousActivities} activities detected</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              {suspiciousActivities}
            </Badge>
          </div>
        )}

        {blockedPayments > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Payments Blocked</p>
                <p className="text-sm text-green-600">{blockedPayments} fraudulent payments prevented</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {blockedPayments}
            </Badge>
          </div>
        )}

        <div className="pt-2 border-t border-red-200">
          <p className="text-xs text-red-600 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            AI-powered fraud detection is actively monitoring transactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FraudAlert;