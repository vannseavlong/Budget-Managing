#!/bin/bash

# Render.com Build Script for Turborepo Monorepo
# This script ensures proper installation and build for the backend service

echo "🚀 Starting Render build for Budget Manager Backend..."

# Set Node environment
export NODE_ENV=production

echo "📦 Installing dependencies..."
corepack enable
pnpm install --frozen-lockfile

echo "🏗️ Building backend workspace..."
pnpm --filter ./apps/backend run build

echo "✅ Build complete!"
echo "📂 Build output location: apps/backend/dist/"

# Verify build
if [ -f "apps/backend/dist/index.js" ]; then
    echo "✅ Backend build successful - dist/index.js found"
else
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi
