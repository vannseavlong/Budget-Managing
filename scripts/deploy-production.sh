#!/bin/bash

# Deployment Script for Production Environment
set -e

echo "🚀 Starting production deployment..."

# Environment variables
export ENVIRONMENT="production"
export DOCKER_IMAGE_TAG="v$(date +%Y%m%d%H%M%S)"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run security:audit
npm run test --workspace=apps/frontend
npm run build --workspace=apps/frontend

# Build and deploy frontend
echo "📦 Building production frontend Docker image..."
docker build -f apps/frontend/Dockerfile -t ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG} .

echo "🔍 Running security scan..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/src aquasec/trivy image ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG}

echo "📤 Pushing image to registry..."
docker push ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG}

echo "🔄 Blue-Green deployment..."
# Add your blue-green deployment logic here
# This might include health checks, gradual traffic shifting, etc.

echo "🔍 Running smoke tests..."
# Add smoke tests here

echo "✅ Production deployment completed successfully!"
echo "🏷️  Deployed version: ${DOCKER_IMAGE_TAG}"