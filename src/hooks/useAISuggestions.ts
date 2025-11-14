import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useAISuggestions = (productId?: string) => {
  return useQuery({
    queryKey: ['ai-suggestions', productId],
    queryFn: async () => {
      const response = await api.get('/chat/ai/suggestions', {
        params: productId ? { productId } : {}
      });
      return response.data.suggestions;
    },
    enabled: true, // Always fetch suggestions
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};