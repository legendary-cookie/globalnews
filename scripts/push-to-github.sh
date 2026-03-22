#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# First-time GitHub push script
# Run this ONCE from your local machine after unzipping the project.
#
# Usage:
#   chmod +x scripts/push-to-github.sh
#   ./scripts/push-to-github.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo ""
echo "════════════════════════════════════════════════"
echo "  Global News — GitHub First Push"
echo "════════════════════════════════════════════════"
echo ""

# ── Check git installed ───────────────────────────────────────────────────────
if ! command -v git &> /dev/null; then
  echo "❌ git not found. Install Git: https://git-scm.com"
  exit 1
fi

# ── Get repo URL ──────────────────────────────────────────────────────────────
echo "Enter your GitHub repo URL"
echo "(Create a NEW empty repo at github.com first — don't add README/gitignore)"
echo ""
read -rp "Repo URL (e.g. https://github.com/yourname/globalnews): " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "❌ No URL provided."
  exit 1
fi

# ── Get Docker Hub username ───────────────────────────────────────────────────
read -rp "Your Docker Hub username: " DOCKER_USER
if [ -z "$DOCKER_USER" ]; then
  echo "❌ Docker Hub username required."
  exit 1
fi

# ── Set DOCKER_USER in .env.make ──────────────────────────────────────────────
if [ ! -f ".env.make" ]; then
  cp .env.make.example .env.make
fi
sed -i "s|yourdockerhubusername|$DOCKER_USER|g" .env.make
echo "✅ .env.make updated with Docker Hub username"

# ── Update GitHub Actions workflow with correct image names ───────────────────
sed -i "s|yourusername|$DOCKER_USER|g" .github/workflows/deploy.yml 2>/dev/null || true

# ── Init git and push ─────────────────────────────────────────────────────────
echo ""
echo "📤 Initialising git and pushing to GitHub..."

if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

git add -A
git commit -m "Initial commit — Global News Intelligence Platform

- 30 live IPTV channels (Al Jazeera, BBC, DW, France24, CGTN, TRT World, etc.)
- 21 live RSS sources (Reuters, AP, BBC, CNN, Guardian, Al Jazeera, etc.)
- React + TypeScript frontend with HLS player, world map, analytics dashboard
- Node.js/Express backend with WebSocket live updates
- GitHub Actions CI/CD → Docker Hub → TrueNAS auto-deploy"

git push -u origin main

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ Pushed to GitHub!"
echo ""
echo "  Next steps:"
echo "  1. Add GitHub Secrets:  make setup-github"
echo "  2. Setup TrueNAS:       make setup-truenas"
echo "  3. Any git push to main → auto builds + deploys"
echo "════════════════════════════════════════════════"
echo ""
