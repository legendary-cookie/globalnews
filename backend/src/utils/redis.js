const Redis = require('ioredis');

let redisAvailable = false;

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    if (times > 3) {
      // Stop retrying after 3 attempts; run without cache
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
});

// Redis event handlers
redis.on('connect', () => {
  redisAvailable = true;
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  redisAvailable = false;
  // Suppress repeated error logs — just log once
  if (!redis._errorLogged) {
    console.warn('⚠️  Redis unavailable — running without cache:', err.message);
    redis._errorLogged = true;
  }
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Try to connect, but don't crash if unavailable
redis.connect().catch(() => {
  console.warn('⚠️  Redis not available — continuing without cache');
});

// Cache helper functions
const cache = {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  async set(key, value, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },
  
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  },
  
  async exists(key) {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return 0;
    }
  },
};

module.exports = {
  redis,
  cache,
};
