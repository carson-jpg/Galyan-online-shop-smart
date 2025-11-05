import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  product: string;
  rating: number;
  title: string;
  comment: string;
  isVerified?: boolean;
  helpful: string[];
  reported: string[];
  createdAt: string;
  updatedAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  page: number;
  pages: number;
  total: number;
}

interface CreateReviewData {
  rating: number;
  title: string;
  comment: string;
}

export const useProductReviews = (productId: string, page: number = 1) => {
  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/reviews`, {
        params: { pageNumber: page },
      });
      return response.data as ReviewsResponse;
    },
    enabled: !!productId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, reviewData }: { productId: string; reviewData: CreateReviewData }) => {
      const response = await api.post(`/products/${productId}/reviews`, reviewData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch reviews
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      // Invalidate product data to update rating
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reviewData }: { reviewId: string; reviewData: Partial<CreateReviewData> }) => {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate reviews for the product
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Invalidate product data to update rating if rating changed
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      await api.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      // Invalidate all reviews and product queries
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
};

export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.put(`/reviews/${reviewId}/helpful`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate reviews to update helpful count
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useReportReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await api.put(`/reviews/${reviewId}/report`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate reviews to update reported status
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};