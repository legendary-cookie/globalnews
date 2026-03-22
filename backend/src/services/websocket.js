const WebSocket = require('ws');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });
  console.log('🔌 WebSocket server initialized');

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.subscriptions = [];

    ws.send(JSON.stringify({
      event: 'connected',
      data: { message: 'Connected to Global News Intelligence' },
      timestamp: new Date().toISOString(),
    }));

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw);
        handleMessage(ws, data);
      } catch { /* ignore malformed */ }
    });

    ws.on('close', () => { ws.isAlive = false; });
    ws.on('error', () => { ws.isAlive = false; });
  });

  // Heartbeat — drop dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  startBroadcasting();
}

function handleMessage(ws, data) {
  const { action, payload } = data;
  switch (action) {
    case 'subscribe':
      if (payload?.channel && !ws.subscriptions.includes(payload.channel)) {
        ws.subscriptions.push(payload.channel);
      }
      ws.send(JSON.stringify({ event: 'subscribed', data: { channel: payload?.channel } }));
      break;
    case 'unsubscribe':
      ws.subscriptions = ws.subscriptions.filter(c => c !== payload?.channel);
      break;
    case 'ping':
      ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
      break;
  }
}

function broadcast(event, data, channel = null) {
  if (!wss) return;
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (!channel || client.subscriptions?.includes(channel)) {
      client.send(message);
    }
  });
}

function startBroadcasting() {
  // Push live viewer count updates derived from real channel data (with ±2% jitter)
  setInterval(() => {
    try {
      const { TV_CHANNELS } = require('./tvService');
      const seed = Math.floor(Date.now() / 30000); // Changes every 30s
      const viewerCounts = TV_CHANNELS.map(ch => {
        const jitter = ((ch.id.charCodeAt(0) + seed) % 100 - 50) * 0.002;
        return {
          channelId: ch.id,
          viewers: Math.max(200, Math.round((ch.viewerCount || 1000) * (1 + jitter))),
        };
      });
      broadcast('viewer_update', viewerCounts);
    } catch { /* tvService may not be ready yet */ }
  }, 30000);

  // Heartbeat every 10 seconds
  setInterval(() => {
    broadcast('heartbeat', { time: Date.now(), clients: wss ? wss.clients.size : 0 });
  }, 10000);
}

function sendBreakingNewsAlert(news) {
  broadcast('breaking_news', news, 'breaking-news');
}

function sendNewArticle(article) {
  broadcast('new_article', article, 'news-feed');
}

module.exports = { setupWebSocket, broadcast, sendBreakingNewsAlert, sendNewArticle };
