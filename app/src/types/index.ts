// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  preferences: UserPreferences;
  createdAt: string;
  lastLogin?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  region: string;
  notifications: NotificationPreferences;
  defaultView: 'grid' | 'list';
  autoPlayVideos: boolean;
}

export interface NotificationPreferences {
  breakingNews: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
  favoriteSources: boolean;
  watchlistUpdates: boolean;
}

// News Article Types
export interface Article {
  id: string;
  sourceId: string;
  source: Source;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: NewsCategory;
  region: NewsRegion;
  language: string;
  sentimentScore?: number;
  sentimentLabel?: 'positive' | 'negative' | 'neutral';
  keyFacts?: string[];
  entities?: Entity[];
  clusterId?: string;
  isClusterHead?: boolean;
  isBreaking?: boolean;
  priorityScore?: number;
  viewCount: number;
  shareCount: number;
  saveCount: number;
  readingTime?: number;
}

export interface Entity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'topic';
  relevance: number;
}

export interface ArticleCluster {
  id: string;
  headline: string;
  summary?: string;
  primaryCategory: NewsCategory;
  primaryRegion: NewsRegion;
  storyCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  articles: Article[];
  coverageEvolution: CoveragePoint[];
}

export interface CoveragePoint {
  timestamp: string;
  articleCount: number;
  sourceCount: number;
}

// Source Types
export interface Source {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  countryCode: string;
  languageCode: string;
  biasRating: number; // -5 to 5
  reliabilityScore: number; // 0 to 1
  ownership?: string;
  foundedYear?: number;
  category: string;
  isActive: boolean;
}

export type BiasLabel = 'far-left' | 'left' | 'lean-left' | 'center' | 'lean-right' | 'right' | 'far-right';

// TV Channel Types
export interface TVChannel {
  id: string;
  name: string;
  displayName?: string;
  logoUrl?: string;
  countryCode: string;
  languageCode: string;
  category: string;
  streamUrl: string;
  streamUrlsBackup?: string[];
  streamFormat: 'hls' | 'dash' | 'rtmp';
  qualities: string[];
  isActive: boolean;
  isPremium: boolean;
  requiresProxy: boolean;
  epgId?: string;
  currentProgram?: string;
  nextProgram?: string;
  programStart?: string;
  programEnd?: string;
  viewerCount: number;
  totalViews: number;
  uptimePercent: number;
}

export interface StreamStatus {
  channelId: string;
  status: 'online' | 'offline' | 'buffering' | 'error';
  viewers: number;
  quality?: string;
  bitrate?: number;
  bufferRatio?: number;
  errorMessage?: string;
}

// News Categories and Regions
export type NewsCategory = 
  | 'politics'
  | 'economy'
  | 'technology'
  | 'war-security'
  | 'climate'
  | 'business'
  | 'science'
  | 'society'
  | 'health'
  | 'entertainment'
  | 'sports';

export type NewsRegion =
  | 'world'
  | 'asia'
  | 'europe'
  | 'americas'
  | 'middle-east'
  | 'africa'
  | 'oceania'
  | 'north-america'
  | 'south-america';

// Breaking News Types
export interface BreakingNews {
  id: string;
  articleId: string;
  alertType: 'war' | 'election' | 'market' | 'disaster' | 'tech' | 'other';
  priority: number;
  headline: string;
  summary?: string;
  affectedRegions: string[];
  pushedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// User Features
export interface UserFavorite {
  id: string;
  userId: string;
  itemType: 'article' | 'channel' | 'topic' | 'source';
  itemId: string;
  folderName?: string;
  notes?: string;
  createdAt: string;
}

export interface UserWatchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  watchlistType: 'country' | 'topic' | 'source' | 'custom';
  filters: WatchlistFilters;
  isActive: boolean;
  notifyOnUpdate: boolean;
  createdAt: string;
}

export interface WatchlistFilters {
  categories?: NewsCategory[];
  regions?: NewsRegion[];
  sources?: string[];
  keywords?: string[];
  biasRange?: [number, number];
  reliabilityRange?: [number, number];
}

export interface ReadingHistory {
  id: string;
  userId: string;
  articleId: string;
  article: Article;
  readAt: string;
  readDuration?: number;
  scrollDepth?: number;
  isCompleted: boolean;
}

// Analytics Types
export interface StreamAnalytics {
  id: string;
  channelId: string;
  timestamp: string;
  viewerCount: number;
  bitrate?: number;
  bufferRatio?: number;
  errorCount: number;
  avgWatchDuration?: number;
  uniqueViewers: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  articlesToday: number;
  totalChannels: number;
  activeStreams: number;
  totalViewers: number;
  breakingNewsCount: number;
}

// Trending Topic Type
export interface TrendingTopic {
  id: string;
  name: string;
  mentionCount: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  relatedArticles: number;
}

// Map Types
export interface MapNewsPoint {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  articleCount: number;
  topArticle: Article;
  category: NewsCategory;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp: string;
}

export type WebSocketEvent =
  | 'breaking_news'
  | 'new_article'
  | 'stream_status'
  | 'viewer_update'
  | 'user_notification'
  | 'trending_update';

// Filter Types
export interface NewsFilters {
  categories?: NewsCategory[];
  regions?: NewsRegion[];
  sources?: string[];
  bias?: BiasLabel[];
  reliability?: number;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'bias' | 'breaking';
}

export interface ChannelFilters {
  countries?: string[];
  languages?: string[];
  categories?: string[];
  isPremium?: boolean;
  searchQuery?: string;
}

// Player Types
export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  quality: string;
  isFullscreen: boolean;
  isPiP: boolean;
  bufferProgress: number;
}

export type PlayerQuality = 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p';

// Theme Types
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  accent: string;
  muted: string;
  border: string;
}
