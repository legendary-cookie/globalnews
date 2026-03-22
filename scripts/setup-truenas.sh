#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# TrueNAS Dataset & Directory Setup Script
# Run this ONCE on your TrueNAS machine via SSH or the TrueNAS Shell tab.
#
# Quick usage (after adding your GitHub repo URL):
#   ssh root@YOUR_TRUENAS_IP 'sh -s' < scripts/setup-truenas.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

BASE="/mnt/SSD/globalnews"

echo ""
echo "════════════════════════════════════════════════"
echo "  Global News Intelligence - TrueNAS Setup"
echo "════════════════════════════════════════════════"
echo ""

echo "--- Step 1: ZFS Datasets ---"
echo "Run these commands in TrueNAS Shell (Storage > Shell) if datasets don't exist:"
echo ""
echo "  zfs create -o compression=lz4 SSD/globalnews"
echo "  zfs create -o compression=lz4 SSD/globalnews/redis-data"
echo "  zfs create -o compression=lz4 SSD/globalnews/app"
echo "  zfs create -o compression=lz4 SSD/globalnews/backups"
echo ""
echo "  (Or via TrueNAS UI: Storage -> Datasets -> Add Dataset)"
echo ""

echo "--- Step 2: Creating directories ---"
mkdir -p "$BASE/redis-data"
mkdir -p "$BASE/app"
mkdir -p "$BASE/backups"
mkdir -p "$BASE/logs"
chmod 755 "$BASE" "$BASE/redis-data" "$BASE/app" "$BASE/backups"
echo "  OK: $BASE layout created"
ls -la "$BASE/"
echo ""

echo "--- Step 3: Checking Docker ---"
if ! command -v docker > /dev/null 2>&1; then
  echo "  ERROR: Docker not found."
  echo "  Enable Apps in TrueNAS: Apps -> Settings -> Enable Apps"
  exit 1
fi
docker --version
docker compose version
echo "  OK: Docker ready"
echo ""

echo "--- Step 4: SSH Key for GitHub Actions ---"
mkdir -p /root/.ssh && chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys
echo ""
echo "  On your LOCAL machine run:"
echo "    ssh-keygen -t ed25519 -C github-deploy -f ~/.ssh/truenas_deploy -N ''"
echo "    cat ~/.ssh/truenas_deploy.pub"
echo ""
echo "  Paste that public key into: /root/.ssh/authorized_keys"
echo "  Then add the PRIVATE key as TRUENAS_SSH_KEY in GitHub Secrets."
echo ""

echo "════════════════════════════════════════════════"
echo "  Setup complete. Now configure GitHub Secrets:"
echo "  run: make setup-github"
echo "════════════════════════════════════════════════"
