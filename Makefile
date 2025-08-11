# LingoAnki Makefile
# A language learning flashcard application

.PHONY: help install dev build preview clean test lint format check-deps update-deps docker-build docker-run docker-clean

# Default target
help: ## Show this help message
	@echo "LingoAnki - Language Learning Flashcard App"
	@echo "=========================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make preview    - Preview production build"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint       - Run ESLint"
	@echo "  make format     - Format code with Prettier"
	@echo "  make test       - Run tests (if configured)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make check-deps - Check for outdated dependencies"
	@echo "  make update-deps - Update dependencies"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make docker-clean - Clean Docker artifacts"

# Development commands
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install

dev: ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

build: ## Build for production
	@echo "🔨 Building for production..."
	npm run build

preview: ## Preview production build
	@echo "👀 Previewing production build..."
	npm run preview

# Code quality commands
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	@if command -v npx >/dev/null 2>&1; then \
		npx eslint . --ext .ts,.tsx,.js,.jsx || true; \
	else \
		echo "ESLint not available. Install with: npm install -D eslint"; \
	fi

format: ## Format code with Prettier
	@echo "✨ Formatting code with Prettier..."
	@if command -v npx >/dev/null 2>&1; then \
		npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" || true; \
	else \
		echo "Prettier not available. Install with: npm install -D prettier"; \
	fi

test: ## Run tests
	@echo "🧪 Running tests..."
	@if [ -f "package.json" ] && grep -q '"test"' package.json; then \
		npm test; \
	else \
		echo "No test script configured in package.json"; \
	fi

# Maintenance commands
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/
	rm -rf .vite/
	rm -rf coverage/
	@echo "✅ Cleaned!"

check-deps: ## Check for outdated dependencies
	@echo "🔍 Checking for outdated dependencies..."
	@if command -v npx >/dev/null 2>&1; then \
		npx npm-check-updates --target minor || true; \
	else \
		echo "npm-check-updates not available. Install with: npm install -g npm-check-updates"; \
	fi

update-deps: ## Update dependencies
	@echo "⬆️ Updating dependencies..."
	@if command -v npx >/dev/null 2>&1; then \
		npx npm-check-updates -u && npm install; \
	else \
		echo "npm-check-updates not available. Install with: npm install -g npm-check-updates"; \
	fi

# Docker commands
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t lingo-anki:latest .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	docker run -p 3000:3000 --name lingo-anki lingo-anki:latest

docker-clean: ## Clean Docker artifacts
	@echo "🧹 Cleaning Docker artifacts..."
	docker stop lingo-anki 2>/dev/null || true
	docker rm lingo-anki 2>/dev/null || true
	docker rmi lingo-anki:latest 2>/dev/null || true

# # Nix development commands
# nix-dev: ## Enter Nix development shell
# 	@echo "🔧 Entering Nix development shell..."
# 	nix develop

# nix-dev-full: ## Enter Nix development shell with full tools
# 	@echo "🔧 Entering Nix development shell with full tools..."
# 	nix develop .#full

# nix-build: ## Build with Nix
# 	@echo "🔨 Building with Nix..."
# 	nix build

# Utility commands
setup: install ## Setup project (install dependencies)
	@echo "✅ Project setup complete!"

dev-setup: setup dev ## Setup and start development server

# Production deployment helpers
deploy-check: build ## Check if build is ready for deployment
	@echo "✅ Build ready for deployment!"
	@echo "📁 Build artifacts in: dist/"

# Development workflow
workflow: format lint test build ## Run full development workflow
	@echo "✅ Development workflow complete!"

# Quick development cycle
cycle: clean install dev ## Clean, install, and start development

# Show project info
info: ## Show project information
	@echo "📋 Project Information:"
	@echo "  Name: $(shell node -p "require('./package.json').name" 2>/dev/null || echo 'lingo-anki')"
	@echo "  Version: $(shell node -p "require('./package.json').version" 2>/dev/null || echo '1.0.0')"
	@echo "  Node.js: $(shell node --version 2>/dev/null || echo 'Not installed')"
	@echo "  npm: $(shell npm --version 2>/dev/null || echo 'Not installed')"
	@echo "  TypeScript: $(shell npx tsc --version 2>/dev/null || echo 'Not available')"
