const express = require('express');
const router = express.Router();
const { getAnalytics, getStreamStats, getSourceStats } = require('../services/analyticsService');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/dashboard', cacheMiddleware(60), async (req, res, next) => {
  try {
    const data = await getAnalytics(req.query.timeRange || '24h');
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/streams', cacheMiddleware(30), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getStreamStats() });
  } catch (err) { next(err); }
});

router.get('/sources', cacheMiddleware(120), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getSourceStats() });
  } catch (err) { next(err); }
});

// Traffic — realistic sinusoidal pattern based on real time-of-day
router.get('/traffic', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const dataPoints = Math.min(hours, 48);
    const now = new Date();
    const trafficData = [];

    for (let i = dataPoints; i >= 0; i--) {
      const t = new Date(now.getTime() - i * (hours / dataPoints) * 3600000);
      const hour = t.getHours();
      // Realistic news traffic: peaks 7-9am and 6-8pm
      const morningPeak = Math.exp(-0.5 * Math.pow((hour - 8) / 1.5, 2));
      const eveningPeak = Math.exp(-0.5 * Math.pow((hour - 19) / 2.0, 2));
      const base = 1200 + (morningPeak + eveningPeak) * 3800;
      const noise = (Math.sin(i * 7.3) + 1) * 150;
      const users = Math.round(base + noise);
      trafficData.push({
        time: t.toISOString(),
        users,
        pageViews: Math.round(users * 3.2),
        streams: Math.round(users * 0.28),
      });
    }
    res.json({ success: true, data: trafficData });
  } catch (err) { next(err); }
});

// Trending — from live articles
router.get('/trending', cacheMiddleware(120), async (req, res, next) => {
  try {
    const { getTrendingTopics } = require('../services/newsService');
    res.json({ success: true, data: await getTrendingTopics() });
  } catch (err) { next(err); }
});

// Category distribution — from live articles
router.get('/categories', cacheMiddleware(300), async (req, res, next) => {
  try {
    const { getCategoryDistribution } = require('../services/newsService');
    res.json({ success: true, data: await getCategoryDistribution() });
  } catch (err) { next(err); }
});

module.exports = router;
