import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: {
    _id: string;
    name: string;
  };
  images: string[];
  stock: number;
  brand?: string;
  rating: number;
  numReviews: number;
  isActive: boolean;
  tags: string[];
  createdAt: string;
}

interface ProductsResponse {
  products: Product[];
  page: number;
  pages: number;
  total: number;
}

export const useProducts = (params?: {
  pageNumber?: number;
  keyword?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await api.get('/products', { params });
      return response.data as ProductsResponse;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data as Product;
    },
    enabled: !!id,
  });
};

export const useTopProducts = () => {
  return useQuery({
    queryKey: ['topProducts'],
    queryFn: async () => {
      const response = await api.get('/products/top');
      return response.data as Product[];
    },
  });
};

export const useProductsByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['productsByCategory', categoryId],
    queryFn: async () => {
      const response = await api.get(`/products/category/${categoryId}`);
      return response.data as Product[];
    },
    enabled: !!categoryId,
  });
};