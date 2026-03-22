import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/services/api';
import type { NewsFilters } from '@/types';

// News feed hook
export function useNews(filters: NewsFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['news', filters, page, limit],
    queryFn: async () => {
      // Map frontend filter keys to backend API params
      const params: Record<string, unknown> = {
        page,
        limit,
        sortBy: filters.sortBy || 'date',
      };
      if (filters.categories?.length) params.categories = filters.categories.join(',');
      if (filters.regions?.length) params.regions = filters.regions.join(',');
      if (filters.sources?.length) params.sources = filters.sources.join(',');
      if (filters.searchQuery) params.search = filters.searchQuery;

      const response = await newsApi.getNews(params);
      return response.data;
    },
    staleTime: 60000,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Single article hook
export function useArticle(articleId: string | null) {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      const response = await newsApi.getArticle(articleId);
      return response.data.data;
    },
    enabled: !!articleId,
    staleTime: 300000,
  });
}

// Breaking news hook
export function useBreakingNews() {
  return useQuery({
    queryKey: ['breaking-news'],
    queryFn: async () => {
      const response = await newsApi.getBreakingNews();
      return response.data.data;
    },
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Trending topics hook
export function useTrendingTopics() {
  return useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const response = await newsApi.getTrendingTopics();
      return response.data.data;
    },
    staleTime: 300000,
    refetchInterval: 900000, // Refetch every 15 minutes
  });
}

// Search news hook
export function useSearchNews(query: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['search', query, page, limit],
    queryFn: async () => {
      if (!query) return { data: [], pagination: { total: 0, hasMore: false } };
      const response = await newsApi.searchNews(query, page, limit);
      return response.data;
    },
    enabled: !!query,
    staleTime: 60000,
  });
}

// Related articles hook
export function useRelatedArticles(articleId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['related', articleId, limit],
    queryFn: async () => {
      if (!articleId) return [];
      const response = await newsApi.getRelatedArticles(articleId, limit);
      return response.data.data;
    },
    enabled: !!articleId,
    staleTime: 300000,
  });
}

// Save article mutation
export function useSaveArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (_articleId: string) => {
      // TODO: Implement save article API
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] });
    },
  });
}
