// This file is intentionally minimal.
// All data is now fetched live from the backend API.
// These exports are kept only for TypeScript type compatibility with any
// components that haven't been migrated yet.

import type { User } from '@/types';

export const mockUser: User = {
  id: '',
  email: '',
  username: 'Guest',
  subscriptionTier: 'free',
  preferences: {
    theme: 'dark',
    language: 'en',
    region: 'world',
    notifications: {
      breakingNews: true,
      emailDigest: false,
      pushNotifications: false,
      favoriteSources: false,
      watchlistUpdates: false,
    },
    defaultView: 'grid',
    autoPlayVideos: false,
  },
  createdAt: new Date().toISOString(),
};

// Legacy exports — BiasComparison and other components now use live API data
export const mockSources = [];
export const mockArticles = [];
export const mockChannels = [];
export const mockBreakingNews = [];
export const mockClusters = [];
export const mockTrendingTopics = [];
