#!/bin/bash

# Budget Managing Monorepo Setup Script
# This script sets up the complete development environment

echo "🚀 Setting up Budget Managing Monorepo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Set up Git hooks
print_status "Setting up Git hooks..."
npx husky install
if [ $? -eq 0 ]; then
    print_success "Git hooks set up successfully"
else
    print_warning "Failed to set up Git hooks"
fi

# Create environment files
print_status "Setting up environment files..."

# Backend environment
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    print_success "Backend .env file created from example"
else
    print_warning "Backend .env file already exists"
fi

# Frontend environment
if [ ! -f "apps/frontend/.env.local" ]; then
    cp apps/frontend/.env.example apps/frontend/.env.local
    print_success "Frontend .env.local file created from example"
else
    print_warning "Frontend .env.local file already exists"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    print_success "Docker is installed: $(docker --version)"
    
    # Check if Docker Compose is available
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is available"
        
        print_status "Starting development databases..."
        docker-compose up -d mongodb redis
        if [ $? -eq 0 ]; then
            print_success "Development databases started"
        else
            print_warning "Failed to start development databases"
        fi
    else
        print_warning "Docker Compose is not available"
    fi
else
    print_warning "Docker is not installed. Database services will not be started."
    print_warning "Please install Docker to run the complete development environment."
fi

# Create logs directory for backend
mkdir -p apps/backend/logs
print_success "Created logs directory for backend"

# Build all packages
print_status "Building all packages..."
npm run build
if [ $? -eq 0 ]; then
    print_success "All packages built successfully"
else
    print_warning "Some packages failed to build (this is normal for fresh setup)"
fi

# Run initial tests
print_status "Running initial tests..."
npm run test
if [ $? -eq 0 ]; then
    print_success "All tests passed"
else
    print_warning "Some tests failed (this is normal for fresh setup)"
fi

# Security audit
print_status "Running security audit..."
npm audit --audit-level moderate
if [ $? -eq 0 ]; then
    print_success "No security vulnerabilities found"
else
    print_warning "Security vulnerabilities detected. Run 'npm audit fix' to resolve."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in:"
echo "   - apps/backend/.env"
echo "   - apps/frontend/.env.local"
echo ""
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "3. Or start individual services:"
echo "   npm run dev --workspace=apps/backend"
echo "   npm run dev --workspace=apps/frontend"
echo ""
echo "4. Access the applications:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - API Health: http://localhost:3001/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md - General overview"
echo "   - docs/DEVOPS.md - DevOps practices"
echo "   - docs/security/THREAT_MODEL.md - Security documentation"
echo ""
echo "🔒 Security:"
echo "   - Review SECURITY.md for security policies"
echo "   - Update default passwords and secrets"
echo "   - Enable MFA for production deployments"
echo ""
print_success "Happy coding! 🚀"