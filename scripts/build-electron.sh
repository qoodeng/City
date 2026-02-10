#!/bin/bash
set -e

# 1. Clean previous build artifacts
echo "🧹 Cleaning previous builds..."
rm -rf dist || true
rm -rf .next/standalone-pkg || true
rm -rf .next/standalone || true

# 2. Build Next.js (Requires Node.js ABI for better-sqlite3)
echo "🔄 Ensuring Node.js ABI for native modules..."
# Rebuild for current Node version (for build process)
pnpm rebuild better-sqlite3

echo "🏗️  Building Next.js..."
pnpm build

# 3. Prepare standalone package
echo "📦 Preparing standalone package..."
# Copy standalone build and dereference symlinks
# This ensures we have a physical copy of node_modules/better-sqlite3
cp -R -L .next/standalone .next/standalone-pkg

# 4. Rebuild native modules for Electron
echo "🔧 Rebuilding native modules for Electron..."
# Use electron-rebuild to target the keys in the standalone package
./node_modules/.bin/electron-rebuild \
  --force \
  --module-dir .next/standalone-pkg \
  --only better-sqlite3

# 5. Build Electron Main Process
echo "⚡ Building Electron main process..."
pnpm electron:build

# 6. Package Electron App
echo "🎁 Packaging Electron App..."
pnpm exec electron-builder

echo "✅ Build complete!"
