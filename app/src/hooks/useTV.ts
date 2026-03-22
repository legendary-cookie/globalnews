import { useQuery } from '@tanstack/react-query';
import { tvApi } from '@/services/api';
import type { ChannelFilters } from '@/types';

// Channels hook
export function useChannels(filters: ChannelFilters = {}) {
  return useQuery({
    queryKey: ['channels', filters],
    queryFn: async () => {
      const response = await tvApi.getChannels(filters);
      return response.data.data;
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute for viewer counts
  });
}

// Single channel hook
export function useChannel(channelId: string | null) {
  return useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await tvApi.getChannel(channelId);
      return response.data.data;
    },
    enabled: !!channelId,
    staleTime: 60000,
  });
}

// Stream URL hook
export function useStreamUrl(channelId: string | null) {
  return useQuery({
    queryKey: ['stream-url', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await tvApi.getStreamUrl(channelId);
      return response.data.data;
    },
    enabled: !!channelId,
    staleTime: 300000,
  });
}

// Stream health hook
export function useStreamHealth(channelId: string | null) {
  return useQuery({
    queryKey: ['stream-health', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await tvApi.checkStreamHealth(channelId);
      return response.data.data;
    },
    enabled: !!channelId,
    staleTime: 30000,
    refetchInterval: 30000, // Check health every 30 seconds
  });
}

// Categories hook
export function useChannelCategories() {
  return useQuery({
    queryKey: ['channel-categories'],
    queryFn: async () => {
      const response = await tvApi.getCategories();
      return response.data.data;
    },
    staleTime: 3600000, // 1 hour
  });
}

// Countries hook
export function useChannelCountries() {
  return useQuery({
    queryKey: ['channel-countries'],
    queryFn: async () => {
      const response = await tvApi.getCountries();
      return response.data.data;
    },
    staleTime: 3600000, // 1 hour
  });
}
