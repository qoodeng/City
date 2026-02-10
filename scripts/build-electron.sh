#!/bin/bash
set -e

# Code Signing & Notarization (set these env vars for signed builds):
#   CSC_LINK          — path to .p12 certificate (or base64-encoded)
#   CSC_KEY_PASSWORD   — certificate password
#   APPLE_ID          — Apple ID email for notarization
#   APPLE_APP_SPECIFIC_PASSWORD — app-specific password (generate at appleid.apple.com)
#   APPLE_TEAM_ID     — Apple Developer Team ID
#
# Without these, the build produces an unsigned/ad-hoc binary (fine for local dev).

if [ -z "$CSC_LINK" ]; then
  echo "⚠️  CSC_LINK not set — building unsigned (ad-hoc). Set code signing env vars for distribution builds."
fi

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

# 3. Prepare standalone package (resolve pnpm symlinks into real files)
echo "📦 Preparing standalone package..."
rsync -rL .next/standalone/ .next/standalone-pkg/

# Flatten pnpm's .pnpm store: hoist all packages to top-level node_modules
# so Node.js module resolution works without pnpm's symlink structure
echo "📦 Flattening pnpm dependencies..."
cd .next/standalone-pkg
if [ -d "node_modules/.pnpm" ]; then
  for pkg_dir in node_modules/.pnpm/*/node_modules/*; do
    pkg_name=$(basename "$pkg_dir")
    # Handle scoped packages (@scope/name)
    parent_name=$(basename "$(dirname "$pkg_dir")")
    if [ "$parent_name" != "node_modules" ]; then
      # This is inside a .pnpm entry's node_modules, skip if it's the package itself
      true
    fi
    # Only copy if not already at top level
    if [ -d "$pkg_dir" ] && [ ! -d "node_modules/$pkg_name" ]; then
      cp -R "$pkg_dir" "node_modules/$pkg_name"
    fi
  done
  # Handle scoped packages
  for pkg_dir in node_modules/.pnpm/*/node_modules/@*/*; do
    if [ -d "$pkg_dir" ]; then
      scope=$(basename "$(dirname "$pkg_dir")")
      name=$(basename "$pkg_dir")
      mkdir -p "node_modules/$scope"
      if [ ! -d "node_modules/$scope/$name" ]; then
        cp -R "$pkg_dir" "node_modules/$scope/$name"
      fi
    fi
  done
  rm -rf node_modules/.pnpm
fi

# 4. Rebuild better-sqlite3 for Electron ABI at project root (where electron package exists)
echo "🔧 Rebuilding native modules for Electron..."
cd ../..
npx electron-rebuild --force --only better-sqlite3

# 4b. Copy Electron-rebuilt binary to ALL locations in standalone package
echo "🔧 Patching all better-sqlite3 native binaries for Electron ABI..."
REBUILT_BINARY="node_modules/better-sqlite3/build/Release/better_sqlite3.node"
if [ -f "$REBUILT_BINARY" ]; then
  find .next/standalone-pkg -name "better_sqlite3.node" 2>/dev/null | while read target; do
    echo "  Patching: $target"
    cp "$REBUILT_BINARY" "$target"
  done
fi

# 5. Build Electron Main Process
echo "⚡ Building Electron main process..."
pnpm electron:build

# 7. Rename node_modules so electron-builder doesn't strip it
mv .next/standalone-pkg/node_modules .next/standalone-pkg/_modules

# 8. Package Electron App
echo "🎁 Packaging Electron App..."
pnpm exec electron-builder

# 9. Restore node_modules in the packaged app
echo "🔗 Restoring server dependencies..."
# Find the app directory (works for mac-arm64, mac, etc.)
APP_PATH=$(find dist -name "*.app" -type d -print -quit)
if [ -z "$APP_PATH" ]; then
  echo "❌ Error: Could not find .app directory in dist/"
  exit 1
fi

echo "Found app at: $APP_PATH"
APP_DIR="$APP_PATH/Contents/Resources/server"
if [ -d "$APP_DIR/_modules" ]; then
  mv "$APP_DIR/_modules" "$APP_DIR/node_modules"
fi

echo "✅ Build complete!"
