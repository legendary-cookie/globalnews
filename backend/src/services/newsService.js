const axios = require('axios');
const Parser = require('rss-parser');
const { redis } = require('../utils/redis');

const rssParser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['media:content', 'enclosure', 'content:encoded', 'media:thumbnail'],
  },
});

// ─── ALL LIVE RSS SOURCES (from both txt files + additional) ───────────────────
const NEWS_SOURCES = [
  // Tier 1 - Wire Services (most reliable, center bias)
  { id: 'reuters', name: 'Reuters', rssUrl: 'https://feeds.reuters.com/reuters/topNews', bias: 0, reliability: 0.97, category: 'news-agency', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Reuters_Logo.svg/200px-Reuters_Logo.svg.png' },
  { id: 'ap', name: 'Associated Press', rssUrl: 'https://feeds.ap.org/rss/apf-topnews.rss', bias: 0, reliability: 0.96, category: 'news-agency', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Associated_Press_logo_2012.svg/200px-Associated_Press_logo_2012.svg.png' },

  // Tier 1 - Public Broadcasters
  { id: 'bbc', name: 'BBC News', rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml', bias: -1, reliability: 0.93, category: 'public-broadcaster', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png' },
  { id: 'bbc-world', name: 'BBC World', rssUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml', bias: -1, reliability: 0.93, category: 'public-broadcaster', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png' },
  { id: 'aljazeera', name: 'Al Jazeera', rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml', bias: -2, reliability: 0.86, category: 'news-channel', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Al_Jazeera_Logo.svg/200px-Al_Jazeera_Logo.svg.png' },
  { id: 'dw', name: 'Deutsche Welle', rssUrl: 'https://rss.dw.com/rdf/rss-en-all', bias: -1, reliability: 0.90, category: 'public-broadcaster', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Deutsche_Welle_Logo.svg/200px-Deutsche_Welle_Logo.svg.png' },

  // Tier 2 - US Cable & Digital
  { id: 'cnn', name: 'CNN', rssUrl: 'http://rss.cnn.com/rss/cnn_topstories.rss', bias: -2, reliability: 0.84, category: 'cable-news', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/200px-CNN_International_logo.svg.png' },
  { id: 'fox', name: 'Fox News', rssUrl: 'http://feeds.foxnews.com/foxnews/latest?format=xml', bias: 3, reliability: 0.77, category: 'cable-news', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/200px-Fox_News_Channel_logo.svg.png' },
  { id: 'abc', name: 'ABC News', rssUrl: 'http://feeds.abcnews.com/abcnews/usheadlines', bias: -1, reliability: 0.85, category: 'broadcast', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/ABC_News_2023_logo.svg/200px-ABC_News_2023_logo.svg.png' },
  { id: 'cbs', name: 'CBS News', rssUrl: 'http://www.cbsnews.com/latest/rss/main', bias: -1, reliability: 0.85, category: 'broadcast', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_News.svg/200px-CBS_News.svg.png' },
  { id: 'nbc', name: 'NBC News', rssUrl: 'http://feeds.nbcnews.com/feeds/topstories', bias: -1, reliability: 0.85, category: 'broadcast', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/NBC_News_2023.svg/200px-NBC_News_2023.svg.png' },
  { id: 'politico', name: 'Politico', rssUrl: 'http://www.politico.com/rss/politicopicks.xml', bias: -1, reliability: 0.83, category: 'digital', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Politico_Logo.svg/200px-Politico_Logo.svg.png' },

  // Tier 2 - UK Press
  { id: 'guardian', name: 'The Guardian', rssUrl: 'https://www.theguardian.com/world/rss', bias: -3, reliability: 0.89, category: 'newspaper', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/The_Guardian_2018.svg/200px-The_Guardian_2018.svg.png' },

  // Tier 2 - International
  { id: 'yahoo', name: 'Yahoo News', rssUrl: 'https://news.yahoo.com/rss/us', bias: 0, reliability: 0.75, category: 'aggregator', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Yahoo%21_News.svg/200px-Yahoo%21_News.svg.png' },
  { id: 'ndtv', name: 'NDTV', rssUrl: 'https://feeds.feedburner.com/ndtvnews-top-stories', bias: 0, reliability: 0.82, category: 'news-channel', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/NDTV_24x7.svg/200px-NDTV_24x7.svg.png' },
  { id: 'hindustan-times', name: 'Hindustan Times', rssUrl: 'https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml', bias: 0, reliability: 0.80, category: 'newspaper', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Hindustan_Times_logo.svg/200px-Hindustan_Times_logo.svg.png' },
  { id: 'times-india', name: 'Times of India', rssUrl: 'http://timesofindia.indiatimes.com/rssfeedstopstories.cms', bias: 0, reliability: 0.79, category: 'newspaper', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/The_Times_of_India_Logo.svg/200px-The_Times_of_India_Logo.svg.png' },
  { id: 'japan-times', name: 'Japan Times', rssUrl: 'https://www.japantimes.co.jp/feed/', bias: 0, reliability: 0.84, category: 'newspaper', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/The_Japan_Times_Logo.svg/200px-The_Japan_Times_Logo.svg.png' },
  { id: 'smh', name: 'Sydney Morning Herald', rssUrl: 'https://www.smh.com.au/rssheadlines', bias: -1, reliability: 0.83, category: 'newspaper', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sydney_Morning_Herald_logo_2021.svg/200px-Sydney_Morning_Herald_logo_2021.svg.png' },
  { id: 'cbc', name: 'CBC News', rssUrl: 'https://rss.cbc.ca/lineup/topstories.xml', bias: -1, reliability: 0.88, category: 'public-broadcaster', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/CBC_News_Logo.svg/200px-CBC_News_Logo.svg.png' },
  { id: 'allafrica', name: 'AllAfrica', rssUrl: 'https://allafrica.com/tools/headlines/rdf/all/headlines.rdf', bias: 0, reliability: 0.74, category: 'aggregator', logoUrl: 'https://allafrica.com/img/logo_allafrica.png' },
  { id: 'bbc-africa', name: 'BBC Africa', rssUrl: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', bias: -1, reliability: 0.93, category: 'public-broadcaster', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2022_%28Alt%29.svg/200px-BBC_News_2022_%28Alt%29.svg.png' },
];

// ─── In-memory cache (replaced by Redis when available) ─────────────────────
let articlesCache = [];
let breakingNewsCache = [];
let lastFetchTime = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

// ─── Estimate engagement from article age (realistic decay curve) ────────────
function estimateEngagement(publishedAt, isBreaking, sourceReliability) {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageHours = ageMs / 3600000;
  // Peak at 2h, decay over 24h
  const baseViews = isBreaking ? 80000 : 15000;
  const decayFactor = Math.max(0.05, 1 - (ageHours / 48));
  const reliabilityMultiplier = 0.5 + sourceReliability;
  const views = Math.round(baseViews * decayFactor * reliabilityMultiplier);
  return {
    viewCount: views,
    shareCount: Math.round(views * 0.08),
    saveCount: Math.round(views * 0.03),
    readingTime: Math.max(1, Math.ceil(((item.contentSnippet || item.content || '').length / 1000) * 1.5) + 1),
  };
}

// ─── Category detection ──────────────────────────────────────────────────────
function detectCategory(content) {
  const c = content.toLowerCase();
  if (/politic|election|government|parliament|congress|vote|senate|democrat|republican|prime minister|president/.test(c)) return 'politics';
  if (/economy|economic|inflation|gdp|recession|market|stock|finance|fed|rate|tariff|trade/.test(c)) return 'economy';
  if (/tech|technology|ai|artificial intelligence|software|app|digital|cyber|robot|openai|google|meta|microsoft/.test(c)) return 'technology';
  if (/war|conflict|military|defense|security|attack|missile|strike|ukraine|russia|gaza|israel|nato|troops/.test(c)) return 'war-security';
  if (/climate|environment|carbon|emission|green|renewable|warming|fossil|solar|wind energy/.test(c)) return 'climate';
  if (/business|company|corporate|merger|acquisition|earnings|profit|startup|ipo|revenue/.test(c)) return 'business';
  if (/science|research|study|discovery|space|nasa|medical|health|vaccine|drug|cancer|virus/.test(c)) return 'science';
  if (/society|social|culture|education|crime|law|court|justice|gender|protest|rights/.test(c)) return 'society';
  return 'world';
}

// ─── Region detection ────────────────────────────────────────────────────────
function detectRegion(content) {
  const c = content.toLowerCase();
  if (/usa|united states|america|canada|mexico|brazil|argentina|colombia|venezuela|chile/.test(c)) return 'americas';
  if (/europe|eu|uk|britain|england|germany|france|italy|spain|russia|ukraine|poland|nato/.test(c)) return 'europe';
  if (/china|japan|india|korea|singapore|thailand|indonesia|pakistan|bangladesh|vietnam|myanmar/.test(c)) return 'asia';
  if (/middle east|israel|palestine|iran|saudi|uae|qatar|jordan|egypt|lebanon|syria|iraq|turkey/.test(c)) return 'middle-east';
  if (/africa|nigeria|south africa|kenya|ethiopia|ghana|tanzania|mozambique|sudan|somalia/.test(c)) return 'africa';
  if (/australia|new zealand|pacific|oceania/.test(c)) return 'oceania';
  return 'world';
}

// ─── Breaking detection ──────────────────────────────────────────────────────
function detectBreaking(title) {
  return /breaking|urgent|alert|just in|developing|flash:|exclusive:|update:/i.test(title);
}

// ─── Map news points for WorldMap (derived from real articles) ───────────────
const REGION_COORDS = {
  'americas':    { lat: 37.0902, lng: -95.7129 },
  'europe':      { lat: 51.1657, lng: 10.4515 },
  'asia':        { lat: 34.0479, lng: 100.6197 },
  'middle-east': { lat: 29.3117, lng: 47.4818 },
  'africa':      { lat: 1.6508,  lng: 17.5381 },
  'oceania':     { lat: -25.2744, lng: 133.7751 },
  'world':       { lat: 20.0,    lng: 0.0 },
};

// ─── Fetch from a single RSS source ─────────────────────────────────────────
async function fetchSourceRSS(source) {
  try {
    const feed = await rssParser.parseURL(source.rssUrl);
    return (feed.items || []).slice(0, 12).map(item => {
      const text = (item.title || '') + ' ' + (item.contentSnippet || item.content || '');
      const isBreaking = detectBreaking(item.title || '');
      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      const engagement = estimateEngagement(publishedAt, isBreaking, source.reliability);
      return {
        id: `${source.id}-${Buffer.from(item.link || item.title || '').toString('base64').slice(0, 16)}`,
        sourceId: source.id,
        source: {
          id: source.id,
          name: source.name,
          logoUrl: source.logoUrl || '',
          biasRating: source.bias,
          reliabilityScore: source.reliability,
        },
        title: (item.title || '').trim(),
        summary: (item.contentSnippet || item.content || '').slice(0, 400).trim(),
        url: item.link || '',
        imageUrl: item.enclosure?.url || item['media:content']?.$.url || item['media:thumbnail']?.$.url || null,
        publishedAt,
        category: detectCategory(text),
        region: detectRegion(text),
        language: 'en',
        isBreaking,
        priorityScore: isBreaking ? Math.min(99, 85 + (source.reliability * 14 | 0)) : Math.round(source.reliability * 70),
        ...engagement,
      };
    });
  } catch (err) {
    console.warn(`RSS fetch failed for ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── Fetch from NewsAPI if key present ──────────────────────────────────────
async function fetchFromNewsAPI() {
  if (!process.env.NEWSAPI_KEY) return [];
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { language: 'en', pageSize: 40, apiKey: process.env.NEWSAPI_KEY },
      timeout: 8000,
    });
    return (response.data.articles || []).map((item, i) => {
      const isBreaking = detectBreaking(item.title || '');
      const engagement = estimateEngagement(item.publishedAt, isBreaking, 0.80);
      return {
        id: `newsapi-${i}-${Date.now()}`,
        sourceId: 'newsapi',
        source: { id: 'newsapi', name: item.source?.name || 'NewsAPI', logoUrl: '', biasRating: 0, reliabilityScore: 0.80 },
        title: item.title || '',
        summary: item.description || '',
        url: item.url || '',
        imageUrl: item.urlToImage || null,
        publishedAt: item.publishedAt || new Date().toISOString(),
        category: detectCategory((item.title || '') + ' ' + (item.description || '')),
        region: detectRegion((item.title || '') + ' ' + (item.description || '')),
        language: 'en',
        isBreaking,
        priorityScore: isBreaking ? 80 : 50,
        ...engagement,
      };
    });
  } catch (err) {
    console.warn('NewsAPI fetch failed:', err.message);
    return [];
  }
}

// ─── Main ingestion - fetch all sources concurrently ────────────────────────
async function fetchAllNews() {
  console.log('🔄 Fetching news from', NEWS_SOURCES.length, 'RSS sources...');
  const results = await Promise.allSettled(NEWS_SOURCES.map(s => fetchSourceRSS(s)));
  const rssArticles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const apiArticles = await fetchFromNewsAPI();

  // Merge, deduplicate by URL
  const seen = new Set();
  const all = [...rssArticles, ...apiArticles].filter(a => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  all.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  console.log(`✅ Fetched ${all.length} articles from ${rssArticles.length} RSS + ${apiArticles.length} API`);
  return all;
}

// ─── Public API ──────────────────────────────────────────────────────────────
async function getNews(filters = {}) {
  // Refresh if stale
  if (!lastFetchTime || Date.now() - lastFetchTime > CACHE_TTL_MS) {
    const fresh = await fetchAllNews();
    if (fresh.length > 0) {
      articlesCache = fresh;
      breakingNewsCache = fresh.filter(a => a.isBreaking).slice(0, 15);
      lastFetchTime = Date.now();
    } else if (articlesCache.length === 0) {
      // Nothing yet — return empty with a flag
      return { articles: [], page: 1, limit: filters.limit || 20, total: 0, hasMore: false };
    }
  }

  let items = [...articlesCache];

  if (filters.categories?.length) items = items.filter(a => filters.categories.includes(a.category));
  if (filters.regions?.length)    items = items.filter(a => filters.regions.includes(a.region));
  if (filters.sources?.length)    items = items.filter(a => filters.sources.includes(a.sourceId));
  if (filters.search)             items = items.filter(a =>
    a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    a.summary.toLowerCase().includes(filters.search.toLowerCase())
  );

  if (filters.sortBy === 'popularity') items.sort((a, b) => b.viewCount - a.viewCount);
  else if (filters.sortBy === 'breaking') items = [...items.filter(a => a.isBreaking), ...items.filter(a => !a.isBreaking)];
  else items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const page  = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const start = (page - 1) * limit;

  return { articles: items.slice(start, start + limit), page, limit, total: items.length, hasMore: start + limit < items.length };
}

async function getArticle(id) { return articlesCache.find(a => a.id === id) || null; }

async function getBreakingNews() {
  if (!lastFetchTime) await getNews();
  return breakingNewsCache;
}

async function getTrendingTopics() {
  const recent = articlesCache.slice(0, 80);
  const counts = {};
  const stopWords = new Set(['about', 'after', 'before', 'being', 'could', 'would', 'should', 'their', 'there', 'where', 'which', 'while', 'these', 'those', 'other', 'since', 'until', 'under', 'again', 'trump', 'biden', 'says', 'said', 'will', 'that', 'this', 'with', 'from', 'have', 'into', 'more', 'over', 'also']);
  recent.forEach(a => {
    const words = (a.title + ' ' + a.summary).toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
    words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count], i) => ({
    id: `topic-${i}`,
    name: `#${name.charAt(0).toUpperCase() + name.slice(1)}`,
    mentionCount: count * 850,
    trendDirection: count > 5 ? 'up' : count > 2 ? 'stable' : 'down',
    trendPercentage: Math.min(200, Math.round(count * 12)),
    relatedArticles: count * 4,
  }));
}

async function getMapPoints() {
  if (!lastFetchTime) await getNews();
  const byRegion = {};
  articlesCache.slice(0, 200).forEach(a => {
    if (!byRegion[a.region]) byRegion[a.region] = { articles: [], breaking: 0 };
    byRegion[a.region].articles.push(a);
    if (a.isBreaking) byRegion[a.region].breaking++;
  });
  return Object.entries(byRegion).map(([region, data]) => {
    const coords = REGION_COORDS[region] || REGION_COORDS.world;
    const top = data.articles.sort((a, b) => b.viewCount - a.viewCount)[0];
    const regionSeed = region.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      id: `hotspot-${region}`,
      region,
      latitude: coords.lat + (((regionSeed % 20) - 10) * 0.4),
      longitude: coords.lng + ((((regionSeed * 7) % 24) - 12) * 0.4),
      intensity: Math.min(10, Math.ceil(data.articles.length / 5)),
      articleCount: data.articles.length,
      breakingCount: data.breaking,
      topArticle: top ? { title: top.title, url: top.url, category: top.category } : null,
      category: top?.category || 'world',
    };
  });
}

async function searchNews(query, page = 1, limit = 20) {
  return getNews({ search: query, page, limit });
}

async function getCategoryDistribution() {
  if (!lastFetchTime) await getNews();
  const catColors = {
    politics: '#3b82f6', economy: '#10b981', technology: '#8b5cf6',
    'war-security': '#ef4444', climate: '#22c55e', business: '#f59e0b',
    science: '#06b6d4', society: '#ec4899', world: '#6b7280',
  };
  const counts = {};
  articlesCache.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
  const total = articlesCache.length || 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat, n]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' & '),
    value: Math.round((n / total) * 100),
    color: catColors[cat] || '#6b7280',
  }));
}

module.exports = {
  getNews, getArticle, getBreakingNews, getTrendingTopics,
  searchNews, getMapPoints, getCategoryDistribution, fetchAllNews,
  NEWS_SOURCES,
};
