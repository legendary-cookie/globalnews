const express = require('express');
const router = express.Router();
const { getNews, getArticle, getBreakingNews, getTrendingTopics, searchNews, getMapPoints } = require('../services/newsService');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { categories, regions, sources, search, sortBy = 'date', page = 1, limit = 20 } = req.query;
    const result = await getNews({
      categories: categories ? categories.split(',') : undefined,
      regions:    regions    ? regions.split(',')    : undefined,
      sources:    sources    ? sources.split(',')    : undefined,
      search, sortBy,
      page: parseInt(page), limit: parseInt(limit),
    });
    res.json({ success: true, data: result.articles, pagination: { page: result.page, limit: result.limit, total: result.total, hasMore: result.hasMore } });
  } catch (err) { next(err); }
});

router.get('/breaking', cacheMiddleware(30), async (req, res, next) => {
  try { res.json({ success: true, data: await getBreakingNews() }); }
  catch (err) { next(err); }
});

router.get('/trending', cacheMiddleware(120), async (req, res, next) => {
  try { res.json({ success: true, data: await getTrendingTopics() }); }
  catch (err) { next(err); }
});

router.get('/map', cacheMiddleware(180), async (req, res, next) => {
  try { res.json({ success: true, data: await getMapPoints() }); }
  catch (err) { next(err); }
});

router.get('/search', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query "q" required' });
    const result = await searchNews(q, parseInt(page), parseInt(limit));
    res.json({ success: true, data: result.articles, pagination: { page: result.page, limit: result.limit, total: result.total, hasMore: result.hasMore } });
  } catch (err) { next(err); }
});

router.get('/:id', cacheMiddleware(300), async (req, res, next) => {
  try {
    const article = await getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true, data: article });
  } catch (err) { next(err); }
});

router.get('/:id/related', cacheMiddleware(300), async (req, res, next) => {
  try {
    const article = await getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const result = await getNews({ categories: [article.category], limit: parseInt(req.query.limit || 5) });
    res.json({ success: true, data: result.articles.filter(a => a.id !== article.id).slice(0, 5) });
  } catch (err) { next(err); }
});

module.exports = router;
