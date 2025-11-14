import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useSmartSearch = (query: string, filters: any = {}) => {
  return useQuery({
    queryKey: ['smart-search', query, filters],
    queryFn: async () => {
      if (!query.trim()) return null;

      const response = await api.get('/products/search', {
        params: {
          q: query,
          ...filters
        }
      });
      return response.data;
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};