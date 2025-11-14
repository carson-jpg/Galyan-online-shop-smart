import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useProductRecommendations = () => {
  return useQuery({
    queryKey: ['product-recommendations'],
    queryFn: async () => {
      const response = await api.get('/products/recommendations');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: true, // Always fetch recommendations
  });
};