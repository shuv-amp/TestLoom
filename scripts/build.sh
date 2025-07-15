#!/bin/bash

# TestLoom Build Script
set -e

echo "🚀 Building TestLoom..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
pnpm clean

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
echo "🧪 Running tests..."
pnpm test

# Build packages
echo "🔨 Building packages..."
pnpm build

echo "✅ Build completed successfully!"
