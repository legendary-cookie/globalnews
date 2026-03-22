# 🌐 Global News Intelligence Platform

Live news aggregation + IPTV streaming. 21 RSS sources, 30 live TV channels, world map, bias comparison, and analytics — all pulling real data.

## ⚡ Quick Start (3 steps)

### 1. First-time GitHub push

```bash
unzip Kimi_Agent_Live_News_PRODUCTION.zip -d globalnews
cd globalnews
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh
```

That script will ask for your GitHub repo URL and Docker Hub username, then push everything.

### 2. Add GitHub Secrets

```bash
make setup-github
```

Follow the printed checklist. Go to your repo → **Settings → Secrets → Actions** and add:

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `TRUENAS_HOST` | TrueNAS IP e.g. `192.168.1.50` |
| `TRUENAS_USER` | `root` |
| `TRUENAS_SSH_KEY` | Your private SSH key contents |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
| `NEWSAPI_KEY` | *(optional)* from newsapi.org |

### 3. Setup TrueNAS (one-time)

SSH into your TrueNAS box and run the setup script:

```bash
ssh root@YOUR_TRUENAS_IP 'sh -s' < scripts/setup-truenas.sh
```

Or copy-paste these ZFS commands in TrueNAS **Storage → Shell**:

```bash
zfs create -o compression=lz4 SSD/globalnews
zfs create -o compression=lz4 SSD/globalnews/redis-data
zfs create -o compression=lz4 SSD/globalnews/app
zfs create -o compression=lz4 SSD/globalnews/backups
```

### Deploy

Now every `git push` to `main` automatically:
1. Builds Docker images
2. Pushes to Docker Hub
3. SSHes into TrueNAS and restarts containers

**That's it.** Visit `http://YOUR_TRUENAS_IP:8080`

---

## 🛠 All Make Commands

```bash
make help               # full command list

# Setup
make setup-local        # install npm deps for local dev
make setup-truenas      # create dirs on TrueNAS via SSH
make setup-github       # print GitHub Secrets checklist

# Local dev
make dev                # start both servers (port 3001 + 5173)
make dev-backend        # backend only
make dev-frontend       # frontend only

# Build & deploy manually
make build-push-deploy  # build images + push + deploy in one command
make build              # build Docker images locally
make push               # push to Docker Hub
make deploy             # pull latest on TrueNAS + restart

# Operations
make status             # show running containers on TrueNAS
make logs               # tail logs from TrueNAS
make restart            # restart containers
make stop               # stop containers
make backup-redis       # backup Redis data
make prune-truenas      # remove old images on TrueNAS
```

---

## 🗂 Project Structure

```
├── .github/workflows/
│   └── deploy.yml          ← CI/CD: build → push → deploy on git push
├── scripts/
│   ├── push-to-github.sh   ← First-time setup
│   └── setup-truenas.sh    ← TrueNAS dataset + SSH setup
├── backend/                ← Node.js/Express API
│   ├── src/services/       ← newsService, tvService, analyticsService
│   └── Dockerfile
├── app/                    ← React/TypeScript frontend
│   ├── src/components/     ← NewsFeed, TVSection, WorldMap, Analytics
│   └── Dockerfile
├── Makefile                ← All commands
├── docker-compose.yml      ← Local/dev compose
├── docker-compose.truenas.yml ← Production TrueNAS compose (image-based)
└── .env.make.example       ← Copy to .env.make and fill in your values
```

---

## 📡 Data Sources

**News (RSS):** Reuters · AP · BBC ×2 · Al Jazeera · Deutsche Welle · CNN · Fox News · ABC · CBS · NBC · Politico · The Guardian · Yahoo News · NDTV · Hindustan Times · Times of India · Japan Times · Sydney Morning Herald · CBC · AllAfrica · BBC Africa

**Live TV (HLS):** Al Jazeera EN/AR · BBC World · France 24 EN/FR/AR/ES · DW · Sky News · CGTN · TRT World · WION · NDTV · ABC Australia · NHK World · RT · Euronews · CBC · i24 · Africanews · teleSUR · Newsmax · ABC7 NY · Aaj Tak · A Haber · YTN · 3Cat Info · 24 Horas

Plus auto-fetched channels from **iptv-org** and **Free-TV** playlists.

---

## 📋 Ports

| Service | Port | Notes |
|---------|------|-------|
| Frontend | `8080` | Main UI |
| Backend API | `3001` | REST + WebSocket |
| Redis | `localhost:6379` | Internal only |

---

## 🔑 Optional: NewsAPI key

Get a free key at [newsapi.org](https://newsapi.org) (100 req/day free) and add it as the `NEWSAPI_KEY` GitHub Secret for extra article sources.
