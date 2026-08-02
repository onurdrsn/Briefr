# ─── BRIEFR MONOREPO MAKEFILE ──────────────────────────────────────────────────

PNPM ?= npx pnpm

.PHONY: all install install-web install-worker dev dev-web dev-worker build build-web build-worker clean

all: install build

# ─── INSTALLATION ─────────────────────────────────────────────────────────────

# Install dependencies for all workspace projects
install:
	$(PNPM) install
	$(PNPM) approve-builds --all

# Install dependencies for web frontend only
install-web:
	$(PNPM) --filter @briefr/web install

# Install dependencies for worker backend only
install-worker:
	$(PNPM) --filter @briefr/worker install

# ─── DEVELOPMENT ──────────────────────────────────────────────────────────────

# Start dev environment for all apps concurrently
dev:
	$(PNPM) dev

# Start dev server for web frontend only
dev-web:
	$(PNPM) --filter @briefr/web dev

# Start dev server for worker backend only
dev-worker:
	$(PNPM) --filter @briefr/worker dev

dev-ingestion:
	$(PNPM) --filter @briefr/ingestion dev
# ─── BUILD ────────────────────────────────────────────────────────────────────

# Build production bundles for all apps and packages
build:
	$(PNPM) build

# Build production bundle for web frontend only
build-web:
	$(PNPM) --filter @briefr/web build

# Build production bundle for worker backend only
build-worker:
	$(PNPM) --filter @briefr/worker build

# ─── DEPLOY ───────────────────────────────────────────────────────────────────

# Deploy worker backend to Cloudflare
deploy-worker:
	$(PNPM) --filter @briefr/worker run deploy

# ─── CLEAN ────────────────────────────────────────────────────────────────────

# Remove node_modules, build artifacts, and turbo cache
clean:
	rm -rf node_modules .turbo
	rm -rf apps/web/node_modules apps/web/dist
	rm -rf apps/worker/node_modules apps/worker/dist
	rm -rf apps/ingestion/node_modules apps/ingestion/dist
	rm -rf packages/types/node_modules packages/types/dist
