const cron = require('node-cron');
const { fetchAllNews, getBreakingNews } = require('./newsService');
const { sendBreakingNewsAlert } = require('./websocket');

const notifiedIds = new Set(); // In-memory dedup (backed by Redis when available)

function startNewsIngestion() {
  console.log('📰 News ingestion service starting...');

  // Initial fetch
  fetchNews();

  // Every 5 minutes — refresh article cache
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Scheduled news fetch');
    fetchNews();
  });

  // Every minute — check for new breaking news to push via WebSocket
  cron.schedule('* * * * *', checkBreakingNews);
}

async function fetchNews() {
  try {
    await fetchAllNews();
    console.log('✅ News cache refreshed');
  } catch (err) {
    console.error('❌ News fetch error:', err.message);
  }
}

async function checkBreakingNews() {
  try {
    const breaking = await getBreakingNews();
    for (const news of breaking.slice(0, 5)) {
      const key = `breaking-${news.id}`;
      if (notifiedIds.has(key)) continue;

      // Also check Redis if available
      let alreadyNotified = false;
      try {
        const { redis } = require('../utils/redis');
        const v = await redis.get(`notified:${key}`);
        if (v) alreadyNotified = true;
      } catch (_) {}

      if (!alreadyNotified) {
        sendBreakingNewsAlert({
          id: news.id,
          headline: news.title,
          summary: news.summary,
          priority: news.priorityScore > 90 ? 5 : 3,
          pushedAt: new Date().toISOString(),
          url: news.url,
          source: news.source?.name,
        });
        notifiedIds.add(key);
        try {
          const { redis } = require('../utils/redis');
          await redis.setex(`notified:${key}`, 3600, '1');
        } catch (_) {}
        if (notifiedIds.size > 500) {
          const first = notifiedIds.values().next().value;
          notifiedIds.delete(first);
        }
      }
    }
  } catch (err) {
    console.error('❌ Breaking news check error:', err.message);
  }
}

module.exports = { startNewsIngestion, fetchNews };
