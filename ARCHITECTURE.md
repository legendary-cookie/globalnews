# Global News Intelligence Platform - System Architecture

## Executive Summary

A scalable, real-time global news aggregation and live TV streaming platform built with modern microservices architecture, designed to handle 1M+ concurrent users.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Web App   │  │  Mobile App │  │  Smart TV   │  │   Tablet    │  │   Desktop   │   │
│  │  (Next.js)  │  │  (React     │  │   (Tizen,   │  │  (PWA)      │  │  (Electron) │   │
│  │             │  │   Native)   │  │  webOS)     │  │             │  │             │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┼──────────┘
          │                │                │                │                │
          └────────────────┴────────────────┴────────────────┴────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │    CDN (CloudFront/     │
                              │      CloudFlare)        │
                              │  - Static Assets        │
                              │  - Edge Caching         │
                              │  - DDoS Protection      │
                              └────────────┬────────────┘
                                           │
┌──────────────────────────────────────────┼──────────────────────────────────────────────┐
│                              API GATEWAY (Kong/AWS API Gateway)                          │
│  ┌───────────────────────────────────────┼───────────────────────────────────────────┐  │
│  │  - Rate Limiting                      │  - Authentication                         │  │
│  │  - Request Routing                    │  - SSL Termination                        │  │
│  │  - Load Balancing                     │  - API Versioning                         │  │
│  └───────────────────────────────────────┼───────────────────────────────────────────┘  │
└──────────────────────────────────────────┼──────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
        ┌───────────▼──────────┐ ┌─────────▼──────────┐ ┌────────▼─────────┐
        │   REAL-TIME LAYER    │ │   BUSINESS LAYER   │ │   STREAM LAYER   │
        │   (WebSocket/SSE)    │ │   (REST/GraphQL)   │ │   (HLS/WebRTC)   │
        └───────────┬──────────┘ └─────────┬──────────┘ └────────┬─────────┘
                    │                      │                      │
┌───────────────────▼──────────────────────▼──────────────────────▼─────────────────────┐
│                              MICROSERVICES CLUSTER                                     │
│                                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │  News Ingestion │  │  User Service   │  │  Stream Service │  │ Analytics       │   │
│  │  Service        │  │                 │  │                 │  │ Service         │   │
│  │                 │  │                 │  │                 │  │                 │   │
│  │ - RSS Scrapers  │  │ - Auth/JWT      │  │ - HLS Proxy     │  │ - Metrics       │   │
│  │ - API Fetchers  │  │ - Profiles      │  │ - M3U8 Parser   │  │ - Reporting     │   │
│  │ - NLP Pipeline  │  │ - Preferences   │  │ - Transcoding   │  │ - Alerts        │   │
│  │ - Deduplication │  │ - Watchlists    │  │ - CDN Push      │  │ - Dashboard     │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│           │                    │                    │                    │            │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐   │
│  │  AI/ML Service  │  │  Search Service │  │  Notification   │  │  Bias Analysis  │   │
│  │                 │  │                 │  │  Service        │  │  Service        │   │
│  │                 │  │                 │  │                 │  │                 │   │
│  │ - Summarization │  │ - Elasticsearch │  │ - WebSocket     │  │ - Bias Scoring  │   │
│  │ - Sentiment     │  │ - Full-text     │  │ - Push Notif    │  │ - Reliability   │   │
│  │ - Clustering    │  │ - Faceted       │  │ - Email         │  │ - Fact-check    │   │
│  │ - Translation   │  │ - Autocomplete  │  │ - SMS           │  │ - Source rating │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
        ┌───────────▼──────────┐ ┌─────────▼──────────┐ ┌────────▼─────────┐
        │   DATA LAYER         │ │   CACHE LAYER      │ │   MESSAGE QUEUE  │
        │                      │ │                    │ │                  │
        │  PostgreSQL (RDS)    │ │  Redis Cluster     │ │  Apache Kafka    │
        │  - Users             │ │  - Sessions        │ │  - Event Stream  │
        │  - Articles          │ │  - Hot Data        │ │  - News Pipeline │
        │  - Sources           │ │  - Rate Limiting   │ │  - Notifications │
        │  - Analytics         │ │  - Pub/Sub         │ │  - Stream Events │
        └──────────────────────┘ └────────────────────┘ └──────────────────┘
```

## Component Details

### 1. News Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEWS INGESTION PIPELINE                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   RSS/Atom  │    │   News APIs │    │  Web Scrapers│    │  User Subs  │
│   Feeds     │    │  (NewsAPI,  │    │  (Puppeteer) │    │             │
│             │    │  GDELT, etc)│    │              │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  Message Queue    │
                         │  (Kafka/RabbitMQ) │
                         └─────────┬─────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
┌──────▼──────┐           ┌────────▼────────┐         ┌────────▼────────┐
│  Content    │           │   Deduplication │         │   Enrichment    │
│  Parser     │           │   Engine        │         │   Service       │
│             │           │                 │         │                 │
│ - Extract   │           │ - SimHash       │         │ - NLP Analysis  │
│   metadata  │           │ - MinHash       │         │ - Bias Scoring  │
│ - Clean HTML│           │ - TF-IDF        │         │ - Sentiment     │
│ - Normalize │           │ - Clustering    │         │ - Categorization│
└──────┬──────┘           └────────┬────────┘         └────────┬────────┘
       │                           │                           │
       └───────────────────────────┼───────────────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   Database Write  │
                         │   (PostgreSQL)    │
                         └───────────────────┘
```

### 2. Live TV Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIVE TV STREAMING SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        IPTV SOURCES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  M3U8 URLs  │  │  RTMP Feeds │  │  DASH Stream│              │
│  │  (HLS)      │  │             │  │             │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Stream Ingest    │
                    │  Service          │
                    │                   │
                    │ - Health Check    │
                    │ - Format Detect   │
                    │ - Quality Probe   │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
│  Stream Proxy     │ │  Transcoding   │ │  Fallback       │
│  Service          │ │  Service       │ │  Manager        │
│                   │ │                │ │                 │
│ - HLS Proxy       │ │ - Multi-bitrate│ │ - Mirror URLs   │
│ - CORS Handling   │ │ - ABR Ladder   │ │ - Auto-failover │
│ - CDN Push        │ │ - Codec Conv   │ │ - Health Monitor│
└─────────┬─────────┘ └───────┬────────┘ └────────┬────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   CDN Delivery    │
                    │   (CloudFront)    │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
│   Web Player      │ │  Mobile App    │ │  Smart TV       │
│   (HLS.js)        │ │  (ExoPlayer)   │ │  (hls.js)       │
│                   │ │                │ │                 │
│ - ABR Selection   │ │ - Background   │ │ - Remote Control│
│ - PiP Mode        │ │   Audio        │ │ - D-pad Nav     │
│ - Multi-view      │ │ - Cast Support │ │ - 4K Support    │
└───────────────────┘ └────────────────┘ └─────────────────┘
```

### 3. Real-Time Notification System

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME NOTIFICATIONS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Breaking News  │     │  User Actions   │     │  System Events  │
│  Detector       │     │                 │     │                 │
│                 │     │                 │     │                 │
│ - AI Priority   │     │ - Favorites     │     │ - Stream Status │
│ - Trending      │     │ - Watchlists    │     │ - Maintenance   │
│ - Manual Push   │     │ - Comments      │     │ - Alerts        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │  Kafka Topics     │
                       │                   │
                       │ - breaking-news   │
                       │ - user-notify     │
                       │ - system-alerts   │
                       └─────────┬─────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│  WebSocket      │     │  Push Service   │     │  Email Service  │
│  Gateway        │     │  (FCM/APNS)     │     │  (SendGrid)     │
│                 │     │                 │     │                 │
│ - Socket.io     │     │ - Mobile Push   │     │ - Digest Emails │
│ - Rooms/Channels│     │ - Browser Push  │     │ - Breaking Alerts│
│ - Presence      │     │ - SMS (Twilio)  │     │ - Newsletters   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Database Schema

### PostgreSQL Schema

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'
);

-- News Sources
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    logo_url TEXT,
    country_code CHAR(2),
    language_code VARCHAR(5),
    bias_rating SMALLINT CHECK (bias_rating BETWEEN -5 AND 5), -- -5 Far Left, 0 Center, 5 Far Right
    reliability_score DECIMAL(3,2) CHECK (reliability_score BETWEEN 0 AND 1),
    ownership VARCHAR(255),
    founded_year INTEGER,
    category VARCHAR(50),
    rss_url TEXT,
    api_endpoint TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- News Articles
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    external_id VARCHAR(255), -- ID from source
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    url TEXT NOT NULL,
    image_url TEXT,
    published_at TIMESTAMP NOT NULL,
    scraped_at TIMESTAMP DEFAULT NOW(),
    category VARCHAR(50),
    region VARCHAR(50),
    language VARCHAR(5),
    
    -- AI Enrichment
    sentiment_score DECIMAL(3,2), -- -1 to 1
    sentiment_label VARCHAR(20), -- positive, negative, neutral
    key_facts JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    
    -- Clustering
    cluster_id UUID,
    is_cluster_head BOOLEAN DEFAULT FALSE,
    similarity_hash VARCHAR(64),
    
    -- Metadata
    word_count INTEGER,
    reading_time INTEGER, -- minutes
    is_breaking BOOLEAN DEFAULT FALSE,
    priority_score INTEGER DEFAULT 0,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(source_id, external_id)
);

-- Article Clusters (for deduplication)
CREATE TABLE article_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    headline TEXT NOT NULL,
    summary TEXT,
    primary_category VARCHAR(50),
    primary_region VARCHAR(50),
    story_count INTEGER DEFAULT 1,
    first_seen_at TIMESTAMP DEFAULT NOW(),
    last_updated_at TIMESTAMP DEFAULT NOW(),
    coverage_evolution JSONB DEFAULT '[]'
);

-- TV Channels
CREATE TABLE tv_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    logo_url TEXT,
    country_code CHAR(2),
    language_code VARCHAR(5),
    category VARCHAR(50),
    
    -- Stream URLs
    stream_url TEXT NOT NULL,
    stream_urls_backup TEXT[],
    stream_format VARCHAR(20), -- hls, dash, rtmp
    
    -- Quality Options
    qualities JSONB DEFAULT '["auto", "1080p", "720p", "480p", "360p"]',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    requires_proxy BOOLEAN DEFAULT FALSE,
    
    -- EPG Data
    epg_id VARCHAR(100),
    current_program TEXT,
    next_program TEXT,
    program_start TIMESTAMP,
    program_end TIMESTAMP,
    
    -- Analytics
    viewer_count INTEGER DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    uptime_percent DECIMAL(5,2) DEFAULT 100.00,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Favorites
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'article', 'channel', 'topic', 'source'
    item_id UUID NOT NULL,
    folder_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- User Watchlists
CREATE TABLE user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    watchlist_type VARCHAR(20), -- 'country', 'topic', 'source', 'custom'
    filters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    notify_on_update BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Reading History
CREATE TABLE user_reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    read_duration INTEGER, -- seconds
    scroll_depth INTEGER, -- percentage
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, article_id)
);

-- Breaking News Alerts
CREATE TABLE breaking_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id),
    alert_type VARCHAR(50), -- 'war', 'election', 'market', 'disaster', 'tech'
    priority INTEGER DEFAULT 1, -- 1-5, 5 being highest
    headline TEXT NOT NULL,
    summary TEXT,
    affected_regions TEXT[],
    pushed_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Stream Analytics
CREATE TABLE stream_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES tv_channels(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    viewer_count INTEGER DEFAULT 0,
    bitrate DECIMAL(10,2),
    buffer_ratio DECIMAL(5,4),
    error_count INTEGER DEFAULT 0,
    avg_watch_duration INTEGER, -- seconds
    unique_viewers INTEGER DEFAULT 0
);

-- System Logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_region ON articles(region);
CREATE INDEX idx_articles_cluster_id ON articles(cluster_id);
CREATE INDEX idx_articles_is_breaking ON articles(is_breaking) WHERE is_breaking = TRUE;
CREATE INDEX idx_articles_sentiment ON articles(sentiment_score);
CREATE INDEX idx_sources_bias ON sources(bias_rating);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_stream_analytics_channel ON stream_analytics(channel_id, timestamp);

-- Full-text search
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '')));
```

### Redis Schema

```
# Session Management
session:{user_id} -> Hash { token, expires_at, device_info }

# Rate Limiting
rate_limit:{ip}:{endpoint} -> String (counter with TTL)

# Hot Data Cache
article:{article_id} -> JSON String (article data)
cluster:{cluster_id} -> JSON String (cluster with articles)
channel:{channel_id} -> JSON String (channel data)

# Real-time Counters
channel:viewers:{channel_id} -> Counter
article:views:{article_id} -> Counter
breaking:active -> List of active breaking news IDs

# Pub/Sub Channels
news:breaking -> Channel for breaking news
stream:status:{channel_id} -> Channel for stream status updates
user:notify:{user_id} -> Channel for user notifications

# Leaderboards (Sorted Sets)
trending:articles -> ZSET (score: view_count, member: article_id)
trending:topics -> ZSET (score: mention_count, member: topic)
popular:channels -> ZSET (score: viewer_count, member: channel_id)

# Geospatial
news:geo -> GEO (coordinates of news events)
```

## API Structure

### REST API Endpoints

```yaml
# News API
GET    /api/v1/news                    # List news with filters
GET    /api/v1/news/:id                # Get single article
GET    /api/v1/news/:id/related        # Get related articles
GET    /api/v1/news/:id/coverage       # Get coverage across sources
POST   /api/v1/news/:id/save          # Save article to favorites
DELETE /api/v1/news/:id/save          # Remove from favorites

# Clusters API
GET    /api/v1/clusters                # List story clusters
GET    /api/v1/clusters/:id            # Get cluster details
GET    /api/v1/clusters/:id/timeline   # Get coverage timeline

# Sources API
GET    /api/v1/sources                 # List news sources
GET    /api/v1/sources/:id             # Get source details
GET    /api/v1/sources/:id/articles    # Get articles from source

# TV Streaming API
GET    /api/v1/channels                # List TV channels
GET    /api/v1/channels/:id            # Get channel details
GET    /api/v1/channels/:id/stream     # Get stream URL (proxied)
POST   /api/v1/channels/:id/favorite   # Favorite channel
GET    /api/v1/channels/categories     # List channel categories
GET    /api/v1/channels/countries      # List countries with channels

# User API
POST   /api/v1/auth/register           # Register
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/logout             # Logout
POST   /api/v1/auth/refresh            # Refresh token
GET    /api/v1/user/profile            # Get profile
PUT    /api/v1/user/profile            # Update profile
GET    /api/v1/user/favorites          # Get favorites
GET    /api/v1/user/history            # Get reading history
GET    /api/v1/user/watchlists         # Get watchlists
POST   /api/v1/user/watchlists         # Create watchlist

# Analytics API (Admin)
GET    /api/v1/admin/analytics/overview
GET    /api/v1/admin/analytics/traffic
GET    /api/v1/admin/analytics/streams
GET    /api/v1/admin/analytics/sources
GET    /api/v1/admin/analytics/users

# Search API
GET    /api/v1/search                  # Full-text search
GET    /api/v1/search/suggestions      # Autocomplete
GET    /api/v1/search/filters          # Available filters
```

### WebSocket Events

```javascript
// Client -> Server
{
  "subscribe": "news:breaking",
  "subscribe": "stream:status:{channel_id}",
  "subscribe": "user:notify:{user_id}",
  "action": "join_channel",
  "channel_id": "uuid"
}

// Server -> Client
{
  "event": "breaking_news",
  "data": { /* breaking news object */ }
}

{
  "event": "stream_status",
  "data": {
    "channel_id": "uuid",
    "status": "online|offline|buffering",
    "viewers": 1234,
    "quality": "1080p"
  }
}

{
  "event": "new_article",
  "data": { /* article object */ }
}
```

## Scaling Strategy

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Web Pods   │  │  Web Pods   │  │  Web Pods   │          │
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │          │
│  │  x3 replicas│  │  x3 replicas│  │  x3 replicas│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  API Pods   │  │  API Pods   │  │  API Pods   │          │
│  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │          │
│  │  x5 replicas│  │  x5 replicas│  │  x5 replicas│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Stream Proxy Service                       │    │
│  │  - Dedicated nodes for HLS proxying                  │    │
│  │  - High bandwidth, low latency                       │    │
│  │  - Auto-scaling based on concurrent viewers          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Worker Nodes                               │    │
│  │  - News ingestion workers                            │    │
│  │  - AI/ML processing                                  │    │
│  │  - Notification dispatchers                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Scaling

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE CLUSTER                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PostgreSQL Primary                         │    │
│  │  - Write operations                                  │    │
│  │  - Real-time replication                             │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│         ┌─────────────┼─────────────┐                       │
│         │             │             │                       │
│  ┌──────▼──────┐ ┌────▼─────┐ ┌────▼─────┐                 │
│  │  Replica 1  │ │ Replica 2│ │ Replica 3│                 │
│  │  (Read)     │ │  (Read)  │ │  (Read)  │                 │
│  └─────────────┘ └──────────┘ └──────────┘                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Redis Cluster (6 nodes)                    │    │
│  │  - 3 masters, 3 replicas                             │    │
│  │  - Session cache, hot data, pub/sub                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Elasticsearch Cluster                      │    │
│  │  - Full-text search                                  │    │
│  │  - Log aggregation                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Strategy

### CI/CD Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │ -> │  Build  │ -> │  Test   │ -> │  Deploy │ -> │ Monitor │
│  Push   │    │  & Lint │    │  & Scan│    │  to Env │    │  & Alert│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  GitHub │    │  Docker │    │  Jest   │    │  K8s    │    │Datadog  │
│  Actions│    │  Build  │    │  Cypress│    │  Rolling│    │Grafana  │
│         │    │         │    │  Snyk   │    │  Update │    │PagerDuty│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Environment Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                                │
│  - Multi-region (US-East, US-West, EU, Asia)                    │
│  - Auto-scaling: 10-100 pods per service                        │
│  - Database: Multi-AZ with read replicas                        │
│  - CDN: Global edge locations                                   │
│  - Backup: Hourly snapshots, 30-day retention                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        STAGING                                   │
│  - Single region                                                │
│  - Fixed: 2-3 pods per service                                  │
│  - Database: Single instance with daily refresh from prod       │
│  - Used for final testing before production                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT                               │
│  - Local Docker Compose                                         │
│  - Hot reload enabled                                           │
│  - Seeded test data                                             │
│  - Mock external services                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Monetization Strategy

### Revenue Streams

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONETIZATION MODEL                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   FREEMIUM      │  │   PREMIUM       │  │   ENTERPRISE    │
│   ($0)          │  │   ($9.99/mo)    │  │   (Custom)      │
│                 │  │                 │  │                 │
│ • Basic news    │  │ • Ad-free       │  │ • API access    │
│ • 5 TV channels │  │ • All channels  │  │ • White-label   │
│ • Standard feed │  │ • AI summaries  │  │ • Custom feeds  │
│ • Ads           │  │ • No trackers   │  │ • SLA guarantee │
│                 │  │ • Early access  │  │ • Dedicated sup │
│                 │  │ • Export data   │  │ • Analytics     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADDITIONAL REVENUE:                                            │
│  • Programmatic ads (Display, Video)                            │
│  • Sponsored content (Native ads)                               │
│  • Affiliate links (News subscriptions)                         │
│  • Data licensing (Anonymized trends)                           │
│  • Consulting (Media intelligence)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  1. NETWORK SECURITY                                            │
│     • WAF (AWS WAF/CloudFlare)                                  │
│     • DDoS protection                                           │
│     • VPC isolation                                             │
│     • Security groups                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  2. APPLICATION SECURITY                                        │
│     • OAuth 2.0 / JWT authentication                            │
│     • Rate limiting (per IP, per user)                          │
│     • Input validation & sanitization                           │
│     • CORS policies                                             │
│     • CSRF protection                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  3. DATA SECURITY                                               │
│     • Encryption at rest (AES-256)                              │
│     • Encryption in transit (TLS 1.3)                           │
│     • Database credential rotation                              │
│     • PII data masking                                          │
│     • GDPR compliance                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  4. OPERATIONAL SECURITY                                        │
│     • SOC 2 compliance                                          │
│     • Regular security audits                                   │
│     • Penetration testing                                       │
│     • Incident response plan                                    │
│     • Employee background checks                                │
└─────────────────────────────────────────────────────────────────┘
```

## Cost Estimation (Monthly, 1M Users)

```
┌─────────────────────────────────────────────────────────────────┐
│                    COST BREAKDOWN                                │
│                    (1M Monthly Active Users)                     │
└─────────────────────────────────────────────────────────────────┘

Infrastructure:
├── Kubernetes Cluster (EKS/GKE)     $3,000
├── Database (RDS PostgreSQL)        $2,500
├── Redis Cluster (ElastiCache)      $800
├── Elasticsearch                    $1,200
├── CDN (CloudFront/CloudFlare)      $2,000
├── Load Balancers                   $500
├── S3/Storage                       $300
└── Monitoring (DataDog/Grafana)     $1,000
                                    ─────────
Subtotal Infrastructure:             $11,300

Third-Party Services:
├── News APIs (NewsAPI, GDELT)       $1,500
├── SendGrid (Email)                 $500
├── Twilio (SMS)                     $300
├── Push Notifications (FCM/APNS)    $200
└── AI/ML (OpenAI/AWS Comprehend)    $2,000
                                    ─────────
Subtotal Services:                   $4,500

Personnel (Estimated):
├── DevOps Engineer (0.5 FTE)        $8,000
├── Backend Developers (2 FTE)       $32,000
├── Frontend Developers (2 FTE)      $30,000
└── ML Engineer (0.5 FTE)            $7,500
                                    ─────────
Subtotal Personnel:                  $77,500

─────────────────────────────────────────────────────────────────
TOTAL ESTIMATED MONTHLY COST:        $93,300
─────────────────────────────────────────────────────────────────

Revenue Projection (at 5% conversion to Premium):
├── Free Users: 950,000
├── Premium Users: 50,000 × $9.99 = $499,500/mo
├── Ad Revenue: ~$50,000/mo
└── Enterprise: ~$20,000/mo
                                    ─────────
TOTAL ESTIMATED REVENUE:             $569,500/mo
                                    ─────────
NET PROFIT:                          $476,200/mo (84% margin)
```

## Next Steps

1. **Phase 1 (MVP - 4 weeks)**
   - Basic news aggregation
   - Simple IPTV player
   - User authentication
   - Basic bias indicators

2. **Phase 2 (Core Features - 6 weeks)**
   - AI summarization
   - Advanced clustering
   - Real-time notifications
   - World map visualization

3. **Phase 3 (Scale - 8 weeks)**
   - Analytics dashboard
   - Mobile apps
   - Smart TV support
   - Enterprise API

4. **Phase 4 (Optimization - Ongoing)**
   - Performance tuning
   - ML model improvements
   - Feature expansion
   - International expansion
