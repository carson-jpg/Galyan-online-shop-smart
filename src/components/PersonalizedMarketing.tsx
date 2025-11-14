import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Target, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';

const PersonalizedMarketing = () => {
  const [dismissedCampaigns, setDismissedCampaigns] = useState<string[]>([]);

  // Fetch personalized marketing campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['personalized-marketing'],
    queryFn: async () => {
      const response = await api.get('/marketing/personalized');
      return response.data.campaigns || [];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const handleDismissCampaign = (campaignId: string) => {
    setDismissedCampaigns(prev => [...prev, campaignId]);
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      await api.post(`/marketing/campaigns/${campaignId}/interact`, { action });
      // Optionally refresh campaigns or update local state
    } catch (error) {
      console.error('Campaign interaction error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Personalized Offers</h3>
        </div>
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter((campaign: any) =>
    !dismissedCampaigns.includes(campaign.id)
  ) || [];

  if (activeCampaigns.length === 0) {
    return null; // Don't show if no campaigns
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Personalized for You</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          AI Curated
        </Badge>
      </div>

      <div className="grid gap-4">
        {activeCampaigns.slice(0, 3).map((campaign: any) => (
          <Card key={campaign.id} className="relative border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">{campaign.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissCampaign(campaign.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>

              {campaign.discount && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="destructive" className="text-xs">
                    {campaign.discount}% OFF
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Valid until {new Date(campaign.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCampaignAction(campaign.id, 'view')}
                  className="flex-1"
                >
                  {campaign.ctaText || 'View Offer'}
                </Button>
                {campaign.secondaryAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCampaignAction(campaign.id, 'dismiss')}
                  >
                    Maybe Later
                  </Button>
                )}
              </div>

              {campaign.aiInsights && (
                <div className="mt-3 p-2 bg-blue-50 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">AI Insight</span>
                  </div>
                  <p className="text-xs text-blue-600">{campaign.aiInsights}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activeCampaigns.length > 3 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All Offers ({activeCampaigns.length - 3} more)
          </Button>
        </div>
      )}
    </div>
  );
};

export default PersonalizedMarketing;