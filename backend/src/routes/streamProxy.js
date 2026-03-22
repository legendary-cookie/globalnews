const express = require('express');
const router = express.Router();
const axios = require('axios');

// Resolve a potentially relative URL against a base URL
function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

// Rewrite an M3U8 playlist so all relative URLs go through our proxy
function rewriteM3U8(content, originalUrl, proxyBase) {
  const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
  const lines = content.split('\n');

  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line; // keep comments & empty lines as-is

    // It's a URL line — resolve and proxy it
    const absoluteUrl = resolveUrl(baseUrl, trimmed);
    // .m3u8 sub-playlists also go through proxy; .ts/.aac segments go through /segment
    if (absoluteUrl.includes('.m3u8')) {
      return `${proxyBase}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    }
    return `${proxyBase}/segment?url=${encodeURIComponent(absoluteUrl)}`;
  }).join('\n');
}

// Common headers for upstream requests
function upstreamHeaders(targetUrl) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': new URL(targetUrl).origin,
    'Origin': new URL(targetUrl).origin,
  };
}

// Set CORS headers on every response
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
}

// OPTIONS preflight
router.options('*', (req, res) => {
  setCors(res);
  res.status(200).end();
});

// HLS M3U8 proxy — rewrites all relative segment/playlist URLs
router.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'url parameter required' });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    new URL(targetUrl); // validate
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!targetUrl.includes('.m3u8')) {
    return res.status(400).json({ error: 'Only HLS .m3u8 playlists are supported' });
  }

  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      responseType: 'text',
      headers: upstreamHeaders(targetUrl),
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 400) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    // Build the proxy base URL so rewritten URLs point back here
    const proxyBase = `${req.protocol}://${req.get('host')}/api/stream`;

    const rewritten = rewriteM3U8(response.data, targetUrl, proxyBase);

    res.status(200);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(rewritten);
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: error.message });
    }
  }
});

// Segment proxy — streams raw TS/AAC segments with CORS headers
router.get('/segment', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'url parameter required' });

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(url);
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  setCors(res);

  try {
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: upstreamHeaders(targetUrl),
      validateStatus: () => true,
    });

    res.status(response.status);

    // Forward relevant headers
    const forward = ['content-type', 'content-length', 'cache-control', 'content-range'];
    for (const h of forward) {
      if (response.headers[h]) res.setHeader(h, response.headers[h]);
    }

    response.data.pipe(res);
    response.data.on('error', (err) => {
      console.error('Segment stream error:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
  } catch (error) {
    console.error('Segment proxy error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Segment proxy error', message: error.message });
    }
  }
});

module.exports = router;
