import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface FlashSale {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    stock: number;
  };
  flashPrice: number;
  quantity: number;
  soldQuantity: number;
  startTime: string;
  endTime: string;
  status: 'active' | 'expired' | 'sold_out';
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateFlashSaleData {
  productId: string;
  flashPrice: number;
  quantity: number;
}

export const useActiveFlashSales = () => {
  return useQuery({
    queryKey: ['flashSales', 'active'],
    queryFn: async () => {
      const response = await api.get('/flash-sales');
      return response.data as FlashSale[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds to update countdowns
  });
};

export const useFlashSale = (id: string) => {
  return useQuery({
    queryKey: ['flashSale', id],
    queryFn: async () => {
      const response = await api.get(`/flash-sales/${id}`);
      return response.data as FlashSale;
    },
    enabled: !!id,
  });
};

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFlashSaleData) => {
      const response = await api.post('/flash-sales', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashSales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFlashSaleData> }) => {
      const response = await api.put(`/flash-sales/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashSales'] });
      queryClient.invalidateQueries({ queryKey: ['flashSale'] });
    },
  });
};

export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/flash-sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashSales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const usePurchaseFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity = 1 }: { id: string; quantity?: number }) => {
      const response = await api.post(`/flash-sales/${id}/purchase`, { quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashSales'] });
      queryClient.invalidateQueries({ queryKey: ['flashSale'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useAllFlashSales = (page: number = 1) => {
  return useQuery({
    queryKey: ['flashSales', 'all', page],
    queryFn: async () => {
      const response = await api.get('/flash-sales/admin/all', {
        params: { pageNumber: page },
      });
      return response.data;
    },
  });
};