import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Article, 
  TVChannel, 
  BreakingNews, 
  NewsFilters, 
  ChannelFilters,
  UserFavorite,
  UserWatchlist,
  StreamStatus 
} from '@/types';

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// News Store
interface NewsState {
  articles: Article[];
  featuredArticles: Article[];
  breakingNews: BreakingNews[];
  currentArticle: Article | null;
  filters: NewsFilters;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  viewMode: 'grid' | 'list';
  setArticles: (articles: Article[]) => void;
  addArticles: (articles: Article[]) => void;
  setFeaturedArticles: (articles: Article[]) => void;
  setBreakingNews: (news: BreakingNews[]) => void;
  addBreakingNews: (news: BreakingNews) => void;
  removeBreakingNews: (id: string) => void;
  setCurrentArticle: (article: Article | null) => void;
  setFilters: (filters: Partial<NewsFilters>) => void;
  setLoading: (value: boolean) => void;
  setHasMore: (value: boolean) => void;
  incrementPage: () => void;
  resetPagination: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  articles: [],
  featuredArticles: [],
  breakingNews: [],
  currentArticle: null,
  filters: {
    categories: [],
    regions: [],
    sources: [],
    sortBy: 'date',
  },
  isLoading: false,
  hasMore: true,
  page: 1,
  viewMode: 'grid',
  setArticles: (articles) => set({ articles }),
  addArticles: (articles) => set((state) => ({ 
    articles: [...state.articles, ...articles] 
  })),
  setFeaturedArticles: (articles) => set({ featuredArticles: articles }),
  setBreakingNews: (news) => set({ breakingNews: news }),
  addBreakingNews: (news) => set((state) => ({ 
    breakingNews: [news, ...state.breakingNews].slice(0, 10) 
  })),
  removeBreakingNews: (id) => set((state) => ({
    breakingNews: state.breakingNews.filter((n) => n.id !== id),
  })),
  setCurrentArticle: (article) => set({ currentArticle: article }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters },
    page: 1,
    articles: [],
  })),
  setLoading: (value) => set({ isLoading: value }),
  setHasMore: (value) => set({ hasMore: value }),
  setViewMode: (mode) => set({ viewMode: mode }),
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  resetPagination: () => set({ page: 1, hasMore: true }),
}));

// TV Store
interface TVState {
  channels: TVChannel[];
  currentChannel: TVChannel | null;
  favoriteChannels: string[];
  streamStatus: StreamStatus | null;
  filters: ChannelFilters;
  isLoading: boolean;
  playerLayout: 'single' | '2x2' | '3x3';
  activePlayers: string[];
  setChannels: (channels: TVChannel[]) => void;
  setCurrentChannel: (channel: TVChannel | null) => void;
  addFavoriteChannel: (channelId: string) => void;
  removeFavoriteChannel: (channelId: string) => void;
  setStreamStatus: (status: StreamStatus | null) => void;
  setFilters: (filters: Partial<ChannelFilters>) => void;
  setLoading: (value: boolean) => void;
  setPlayerLayout: (layout: 'single' | '2x2' | '3x3') => void;
  addActivePlayer: (channelId: string) => void;
  removeActivePlayer: (channelId: string) => void;
  clearActivePlayers: () => void;
}

export const useTVStore = create<TVState>()(
  persist(
    (set) => ({
      channels: [],
      currentChannel: null,
      favoriteChannels: [],
      streamStatus: null,
      filters: {
        countries: [],
        languages: [],
        categories: [],
      },
      isLoading: false,
      playerLayout: 'single',
      activePlayers: [],
      setChannels: (channels) => set({ channels }),
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      addFavoriteChannel: (channelId) => set((state) => ({
        favoriteChannels: [...state.favoriteChannels, channelId],
      })),
      removeFavoriteChannel: (channelId) => set((state) => ({
        favoriteChannels: state.favoriteChannels.filter((id) => id !== channelId),
      })),
      setStreamStatus: (status) => set({ streamStatus: status }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      setLoading: (value) => set({ isLoading: value }),
      setPlayerLayout: (layout) => set({ playerLayout: layout, activePlayers: [] }),
      addActivePlayer: (channelId) => set((state) => ({
        activePlayers: [...new Set([...state.activePlayers, channelId])].slice(0, 9),
      })),
      removeActivePlayer: (channelId) => set((state) => ({
        activePlayers: state.activePlayers.filter((id) => id !== channelId),
      })),
      clearActivePlayers: () => set({ activePlayers: [] }),
    }),
    {
      name: 'tv-storage',
      partialize: (state) => ({ 
        favoriteChannels: state.favoriteChannels,
        playerLayout: state.playerLayout,
      }),
    }
  )
);

// UI Store
interface UIState {
  sidebarOpen: boolean;
  activeSection: 'news' | 'tv' | 'map' | 'bias' | 'analytics';
  theme: 'dark' | 'light';
  isSearchOpen: boolean;
  searchQuery: string;
  notifications: Notification[];
  setSidebarOpen: (value: boolean) => void;
  toggleSidebar: () => void;
  setActiveSection: (section: 'news' | 'tv' | 'map' | 'bias' | 'analytics') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSearchOpen: (value: boolean) => void;
  setSearchQuery: (query: string) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeSection: 'news',
  theme: 'dark',
  isSearchOpen: false,
  searchQuery: '',
  notifications: [],
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'dark' ? 'light' : 'dark' 
  })),
  setSearchOpen: (value) => set({ isSearchOpen: value }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));

// User Features Store
interface UserFeaturesState {
  favorites: UserFavorite[];
  watchlists: UserWatchlist[];
  readingHistory: string[];
  isLoading: boolean;
  setFavorites: (favorites: UserFavorite[]) => void;
  addFavorite: (favorite: UserFavorite) => void;
  removeFavorite: (id: string) => void;
  setWatchlists: (watchlists: UserWatchlist[]) => void;
  addWatchlist: (watchlist: UserWatchlist) => void;
  updateWatchlist: (id: string, updates: Partial<UserWatchlist>) => void;
  removeWatchlist: (id: string) => void;
  addToReadingHistory: (articleId: string) => void;
  setLoading: (value: boolean) => void;
}

export const useUserFeaturesStore = create<UserFeaturesState>()(
  persist(
    (set) => ({
      favorites: [],
      watchlists: [],
      readingHistory: [],
      isLoading: false,
      setFavorites: (favorites) => set({ favorites }),
      addFavorite: (favorite) => set((state) => ({
        favorites: [...state.favorites, favorite],
      })),
      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter((f) => f.id !== id),
      })),
      setWatchlists: (watchlists) => set({ watchlists }),
      addWatchlist: (watchlist) => set((state) => ({
        watchlists: [...state.watchlists, watchlist],
      })),
      updateWatchlist: (id, updates) => set((state) => ({
        watchlists: state.watchlists.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),
      removeWatchlist: (id) => set((state) => ({
        watchlists: state.watchlists.filter((w) => w.id !== id),
      })),
      addToReadingHistory: (articleId) => set((state) => ({
        readingHistory: [articleId, ...state.readingHistory].slice(0, 100),
      })),
      setLoading: (value) => set({ isLoading: value }),
    }),
    {
      name: 'user-features-storage',
    }
  )
);

// Analytics Store
interface AnalyticsState {
  totalViewers: number;
  activeStreams: number;
  trendingTopics: TrendingTopic[];
  sourceStats: SourceStat[];
  isLoading: boolean;
  setTotalViewers: (count: number) => void;
  setActiveStreams: (count: number) => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setSourceStats: (stats: SourceStat[]) => void;
  setLoading: (value: boolean) => void;
}

export interface TrendingTopic {
  id: string;
  name: string;
  mentionCount: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  relatedArticles: number;
}

export interface SourceStat {
  sourceId: string;
  sourceName: string;
  articleCount: number;
  viewCount: number;
  reliabilityScore: number;
  biasRating: number;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  totalViewers: 0,
  activeStreams: 0,
  trendingTopics: [],
  sourceStats: [],
  isLoading: false,
  setTotalViewers: (count) => set({ totalViewers: count }),
  setActiveStreams: (count) => set({ activeStreams: count }),
  setTrendingTopics: (topics) => set({ trendingTopics: topics }),
  setSourceStats: (stats) => set({ sourceStats: stats }),
  setLoading: (value) => set({ isLoading: value }),
}));
