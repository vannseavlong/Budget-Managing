#!/bin/bash

# Deployment Script for Staging Environment
set -e

echo "🚀 Starting staging deployment..."

# Environment variables
export ENVIRONMENT="staging"
export DOCKER_IMAGE_TAG="staging-$(date +%Y%m%d%H%M%S)"

# Build and deploy frontend
echo "📦 Building frontend Docker image..."
docker build -f apps/frontend/Dockerfile -t ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG} .

echo "🔍 Running security scan..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/src aquasec/trivy image ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG}

echo "📤 Pushing image to registry..."
docker push ${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG}

echo "🔄 Updating deployment..."
# Add your deployment commands here (e.g., kubectl, helm, docker-compose)
# kubectl set image deployment/frontend-staging frontend=${REGISTRY}/${IMAGE_NAME}-frontend:${DOCKER_IMAGE_TAG}

echo "✅ Staging deployment completed successfully!"