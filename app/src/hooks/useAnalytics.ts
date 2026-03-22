import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';

// Dashboard analytics hook
export function useDashboardAnalytics(timeRange = '24h') {
  return useQuery({
    queryKey: ['dashboard-analytics', timeRange],
    queryFn: async () => {
      const response = await analyticsApi.getDashboard(timeRange);
      return response.data.data;
    },
    staleTime: 60000,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Stream stats hook
export function useStreamStats() {
  return useQuery({
    queryKey: ['stream-stats'],
    queryFn: async () => {
      const response = await analyticsApi.getStreamStats();
      return response.data.data;
    },
    staleTime: 30000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Source stats hook
export function useSourceStats() {
  return useQuery({
    queryKey: ['source-stats'],
    queryFn: async () => {
      const response = await analyticsApi.getSourceStats();
      return response.data.data;
    },
    staleTime: 300000,
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}

// Traffic data hook
export function useTrafficData(timeRange = '24h') {
  return useQuery({
    queryKey: ['traffic', timeRange],
    queryFn: async () => {
      const response = await analyticsApi.getTraffic(timeRange);
      return response.data.data;
    },
    staleTime: 60000,
    refetchInterval: 300000,
  });
}

// Trending analytics hook
export function useTrendingAnalytics() {
  return useQuery({
    queryKey: ['trending-analytics'],
    queryFn: async () => {
      const response = await analyticsApi.getTrending();
      return response.data.data;
    },
    staleTime: 300000,
    refetchInterval: 900000, // Refetch every 15 minutes
  });
}

// Categories distribution hook
export function useCategoriesDistribution() {
  return useQuery({
    queryKey: ['categories-distribution'],
    queryFn: async () => {
      const response = await analyticsApi.getCategories();
      return response.data.data;
    },
    staleTime: 3600000, // 1 hour
  });
}
