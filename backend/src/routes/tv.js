const express = require('express');
const router = express.Router();
const { getChannels, getChannel, checkStreamHealth, getChannelCategoryCounts, getChannelCountryCounts } = require('../services/tvService');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/channels', cacheMiddleware(120), async (req, res, next) => {
  try {
    const channels = await getChannels({ country: req.query.country, language: req.query.language, category: req.query.category, search: req.query.search });
    res.json({ success: true, data: channels, count: channels.length });
  } catch (err) { next(err); }
});

router.get('/channels/:id', cacheMiddleware(30), async (req, res, next) => {
  try {
    const channel = await getChannel(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ success: true, data: channel });
  } catch (err) { next(err); }
});

router.get('/channels/:id/health', async (req, res, next) => {
  try {
    res.json({ success: true, data: await checkStreamHealth(req.params.id) });
  } catch (err) { next(err); }
});

router.get('/channels/:id/stream', async (req, res, next) => {
  try {
    const channel = await getChannel(req.params.id);
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/stream/proxy?url=${encodeURIComponent(channel.streamUrl)}`;
    res.json({
      success: true,
      data: {
        streamUrl: proxyUrl,
        directUrl: channel.streamUrl,
        backupUrls: (channel.streamUrlsBackup || []).map(u => `${req.protocol}://${req.get('host')}/api/stream/proxy?url=${encodeURIComponent(u)}`),
        qualities: channel.qualities,
        format: channel.streamFormat,
      },
    });
  } catch (err) { next(err); }
});

// Live counts from actual channel data
router.get('/categories', cacheMiddleware(1800), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getChannelCategoryCounts() });
  } catch (err) { next(err); }
});

router.get('/countries', cacheMiddleware(1800), async (req, res, next) => {
  try {
    res.json({ success: true, data: await getChannelCountryCounts() });
  } catch (err) { next(err); }
});

module.exports = router;
