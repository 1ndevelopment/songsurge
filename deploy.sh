#!/bin/bash

# SongSurge Deployment Script
# This script helps you deploy the music streaming application

set -e

echo "🎵 SongSurge - Music Streaming App Deployment"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if music directory exists and has files
if [ ! -d "music" ] || [ -z "$(ls -A music 2>/dev/null | grep -v '.gitkeep')" ]; then
    echo "⚠️  Warning: Music directory is empty or doesn't exist."
    echo "   Please add some audio files to the 'music/' directory."
    echo "   Supported formats: MP3, WAV, FLAC, OGG, AAC"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo "🚀 Starting deployment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the containers
echo "🔨 Building containers..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Access your app at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo ""
    echo "📱 The app is now running in the background."
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop app: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Update: docker-compose up --build -d"
    echo ""
    echo "🎵 Add music files to the 'music/' directory and refresh the page!"
else
    echo "❌ Deployment failed. Check the logs with: docker-compose logs"
    exit 1
fi
