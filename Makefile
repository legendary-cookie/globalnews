# ─────────────────────────────────────────────────────────────────────────────
# Global News Intelligence — Makefile
# Usage: make <target>
#
# Set your Docker Hub username first:
#   export DOCKER_USER=yourusername
# Or create a .env.make file with: DOCKER_USER=yourusername
# ─────────────────────────────────────────────────────────────────────────────

-include .env.make

DOCKER_USER   ?= $(shell echo $$DOCKER_USER)
IMAGE_BACKEND  = $(DOCKER_USER)/globalnews-backend
IMAGE_FRONTEND = $(DOCKER_USER)/globalnews-frontend
TRUENAS_HOST  ?= $(shell echo $$TRUENAS_HOST)
TRUENAS_USER  ?= root
APP_DIR        = /mnt/SSD/globalnews

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  Global News Intelligence"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  SETUP"
	@echo "    make setup-local       Install deps for local dev"
	@echo "    make setup-truenas     Create datasets + dirs on TrueNAS"
	@echo "    make setup-github      Print GitHub Secrets checklist"
	@echo ""
	@echo "  DEV"
	@echo "    make dev               Start backend + frontend in dev mode"
	@echo "    make dev-backend       Backend only (port 3001)"
	@echo "    make dev-frontend      Frontend only (port 5173)"
	@echo ""
	@echo "  BUILD & PUSH"
	@echo "    make build             Build both Docker images locally"
	@echo "    make push              Push images to Docker Hub"
	@echo "    make build-push        Build + push in one step"
	@echo "    make build-push-deploy Build + push + deploy to TrueNAS"
	@echo ""
	@echo "  DEPLOY"
	@echo "    make deploy            Pull latest images on TrueNAS + restart"
	@echo "    make deploy-compose    Copy compose file to TrueNAS + deploy"
	@echo "    make restart           Restart all containers on TrueNAS"
	@echo "    make stop              Stop all containers on TrueNAS"
	@echo "    make logs              Tail logs from TrueNAS"
	@echo "    make status            Show container status on TrueNAS"
	@echo ""
	@echo "  MAINTENANCE"
	@echo "    make backup-redis      Backup Redis data from TrueNAS"
	@echo "    make clean             Remove local Docker images"
	@echo "    make prune-truenas     Remove old images on TrueNAS"
	@echo ""

# ── Setup ────────────────────────────────────────────────────────────────────
.PHONY: setup-local
setup-local:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd app && npm install
	@echo "✅ Local setup complete. Run: make dev"

.PHONY: setup-truenas
setup-truenas:
	@echo "🗂  Creating datasets and directories on TrueNAS..."
	@[ -n "$(TRUENAS_HOST)" ] || (echo "❌ Set TRUENAS_HOST first: export TRUENAS_HOST=192.168.1.x" && exit 1)
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) '\
		set -e; \
		echo "Creating directories under /mnt/SSD/globalnews..."; \
		mkdir -p /mnt/SSD/globalnews/redis-data; \
		mkdir -p /mnt/SSD/globalnews/app; \
		mkdir -p /mnt/SSD/globalnews/backups; \
		chmod -R 755 /mnt/SSD/globalnews; \
		echo "✅ Directories created:"; \
		ls -la /mnt/SSD/globalnews/; \
	'
	@echo "✅ TrueNAS setup complete"
	@echo ""
	@echo "  ⚠️  In TrueNAS UI, also create these ZFS datasets:"
	@echo "     /mnt/SSD/globalnews          (parent)"
	@echo "     /mnt/SSD/globalnews/redis-data"
	@echo "     /mnt/SSD/globalnews/app"
	@echo ""
	@echo "  Go to: Storage → Datasets → Add Dataset"

.PHONY: setup-github
setup-github:
	@echo ""
	@echo "  GitHub Secrets Checklist"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  Go to: your-repo → Settings → Secrets → Actions → New secret"
	@echo ""
	@echo "  Required:"
	@echo "    DOCKER_USERNAME    Your Docker Hub username"
	@echo "    DOCKER_PASSWORD    Docker Hub access token"
	@echo "                       (hub.docker.com → Account → Security → New Token)"
	@echo "    TRUENAS_HOST       TrueNAS IP e.g. 192.168.1.50"
	@echo "    TRUENAS_USER       SSH user  (usually: root)"
	@echo "    TRUENAS_SSH_KEY    Contents of your ~/.ssh/id_ed25519 private key"
	@echo "    JWT_SECRET         Any long random string (32+ chars)"
	@echo "    JWT_REFRESH_SECRET Another long random string (32+ chars)"
	@echo ""
	@echo "  Optional:"
	@echo "    NEWSAPI_KEY        From newsapi.org (free tier = 100 req/day)"
	@echo ""
	@echo "  Generate random secrets:"
	@echo "    openssl rand -hex 32"
	@echo ""
	@echo "  Generate SSH key pair (if needed):"
	@echo "    ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/truenas_deploy"
	@echo "    # Add ~/.ssh/truenas_deploy.pub to TrueNAS:"
	@echo "    # Credentials → SSH Keypairs, or paste into /root/.ssh/authorized_keys"
	@echo "    # Add ~/.ssh/truenas_deploy (private key) as TRUENAS_SSH_KEY secret"
	@echo ""

# ── Dev ──────────────────────────────────────────────────────────────────────
.PHONY: dev
dev:
	@echo "🚀 Starting dev servers..."
	@$(MAKE) -j2 dev-backend dev-frontend

.PHONY: dev-backend
dev-backend:
	cd backend && npm run dev

.PHONY: dev-frontend
dev-frontend:
	cd app && npm run dev

# ── Build & Push ─────────────────────────────────────────────────────────────
.PHONY: build
build: _check-docker-user
	@echo "🔨 Building backend image..."
	docker build -t $(IMAGE_BACKEND):latest ./backend
	@echo "🔨 Building frontend image..."
	docker build \
		--build-arg VITE_API_URL=/api \
		--build-arg VITE_WS_URL=ws://$(TRUENAS_HOST)/ws \
		-t $(IMAGE_FRONTEND):latest ./app
	@echo "✅ Build complete"
	@docker images | grep "$(DOCKER_USER)/globalnews"

.PHONY: push
push: _check-docker-user
	@echo "📤 Pushing to Docker Hub..."
	docker push $(IMAGE_BACKEND):latest
	docker push $(IMAGE_FRONTEND):latest
	@echo "✅ Pushed to https://hub.docker.com/u/$(DOCKER_USER)"

.PHONY: build-push
build-push: build push

.PHONY: build-push-deploy
build-push-deploy: build push deploy
	@echo "✅ Full pipeline complete"

# ── Deploy ───────────────────────────────────────────────────────────────────
.PHONY: deploy
deploy: _check-truenas
	@echo "🚀 Deploying to TrueNAS ($(TRUENAS_HOST))..."
	$(MAKE) deploy-compose
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) '\
		docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml \
		  -p globalnews pull && \
		docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml \
		  -p globalnews up -d --remove-orphans && \
		docker image prune -f \
	'
	@echo "✅ Deployed. Visit: http://$(TRUENAS_HOST):8080"

.PHONY: deploy-compose
deploy-compose: _check-truenas _check-docker-user
	@echo "📋 Copying compose file to TrueNAS..."
	@envsubst < docker-compose.truenas.yml > /tmp/docker-compose.prod.yml
	scp /tmp/docker-compose.prod.yml \
	    $(TRUENAS_USER)@$(TRUENAS_HOST):/mnt/SSD/globalnews/app/docker-compose.prod.yml
	@rm /tmp/docker-compose.prod.yml
	@echo "✅ Compose file deployed"

.PHONY: restart
restart: _check-truenas
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) \
	  'docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml -p globalnews restart'

.PHONY: stop
stop: _check-truenas
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) \
	  'docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml -p globalnews stop'

.PHONY: logs
logs: _check-truenas
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) \
	  'docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml -p globalnews logs -f --tail=100'

.PHONY: status
status: _check-truenas
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) \
	  'docker compose -f /mnt/SSD/globalnews/app/docker-compose.prod.yml -p globalnews ps'

# ── Maintenance ──────────────────────────────────────────────────────────────
.PHONY: backup-redis
backup-redis: _check-truenas
	@echo "💾 Backing up Redis data..."
	@TS=$$(date +%Y%m%d_%H%M%S); \
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) \
	  "tar czf /mnt/SSD/globalnews/backups/redis-$$TS.tar.gz /mnt/SSD/globalnews/redis-data"
	@echo "✅ Backup created in /mnt/SSD/globalnews/backups/"

.PHONY: clean
clean:
	@echo "🧹 Removing local images..."
	-docker rmi $(IMAGE_BACKEND):latest 2>/dev/null
	-docker rmi $(IMAGE_FRONTEND):latest 2>/dev/null
	@echo "✅ Cleaned"

.PHONY: prune-truenas
prune-truenas: _check-truenas
	ssh $(TRUENAS_USER)@$(TRUENAS_HOST) 'docker image prune -f && docker volume prune -f'

# ── Internal guards ──────────────────────────────────────────────────────────
.PHONY: _check-docker-user
_check-docker-user:
	@[ -n "$(DOCKER_USER)" ] || (echo "❌ Set DOCKER_USER: export DOCKER_USER=yourhubusername" && exit 1)

.PHONY: _check-truenas
_check-truenas:
	@[ -n "$(TRUENAS_HOST)" ] || (echo "❌ Set TRUENAS_HOST: export TRUENAS_HOST=192.168.1.x" && exit 1)
