const { redis } = require('../utils/redis');

// Cache middleware - gracefully skips if Redis is unavailable
function cacheMiddleware(duration = 60) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      // Try to get from cache
      let cached = null;
      try {
        cached = await redis.get(key);
      } catch (_) {
        // Redis unavailable — skip cache
        return next();
      }
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = (data) => {
        // Cache the response (fire and forget — don't block response)
        redis.setex(key, duration, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      // If anything fails, continue without caching
      next();
    }
  };
}

// Clear cache middleware
function clearCache(pattern) {
  return async (req, res, next) => {
    try {
      await redis.del(pattern);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
    next();
  };
}

module.exports = {
  cacheMiddleware,
  clearCache,
};
