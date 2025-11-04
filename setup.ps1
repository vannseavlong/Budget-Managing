# Budget Managing Monorepo Setup Script (PowerShell)
# This script sets up the complete development environment for Windows

Write-Host "🚀 Setting up Budget Managing Monorepo..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
  param([string]$Message)
  Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
  param([string]$Message)
  Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
  param([string]$Message)
  Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
  param([string]$Message)
  Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
  $nodeVersion = node --version
  Write-Success "Node.js version: $nodeVersion"
}
catch {
  Write-Error "Node.js is not installed. Please install Node.js 20+ and try again."
  exit 1
}

# Check Node.js version
$nodeVersionNumber = $nodeVersion.Replace('v', '').Split('.')[0]
if ([int]$nodeVersionNumber -lt 18) {
  Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
  exit 1
}

# Check if npm is installed
try {
  $npmVersion = npm --version
  Write-Success "npm version: $npmVersion"
}
catch {
  Write-Error "npm is not installed. Please install npm and try again."
  exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."
npm install
if ($LASTEXITCODE -eq 0) {
  Write-Success "Dependencies installed successfully"
}
else {
  Write-Error "Failed to install dependencies"
  exit 1
}

# Set up Git hooks
Write-Status "Setting up Git hooks..."
npx husky install
if ($LASTEXITCODE -eq 0) {
  Write-Success "Git hooks set up successfully"
}
else {
  Write-Warning "Failed to set up Git hooks"
}

# Create environment files
Write-Status "Setting up environment files..."

# Backend environment
if (-not (Test-Path "apps/backend/.env")) {
  Copy-Item "apps/backend/.env.example" "apps/backend/.env"
  Write-Success "Backend .env file created from example"
}
else {
  Write-Warning "Backend .env file already exists"
}

# Frontend environment
if (-not (Test-Path "apps/frontend/.env.local")) {
  Copy-Item "apps/frontend/.env.example" "apps/frontend/.env.local"
  Write-Success "Frontend .env.local file created from example"
}
else {
  Write-Warning "Frontend .env.local file already exists"
}

# Check if Docker is installed
try {
  $dockerVersion = docker --version
  Write-Success "Docker is installed: $dockerVersion"
    
  # Check if Docker Compose is available
  try {
    docker-compose --version | Out-Null
    $composeAvailable = $true
  }
  catch {
    try {
      docker compose version | Out-Null
      $composeAvailable = $true
    }
    catch {
      $composeAvailable = $false
    }
  }
    
  if ($composeAvailable) {
    Write-Success "Docker Compose is available"
        
    Write-Status "Starting development databases..."
    docker-compose up -d mongodb redis
    if ($LASTEXITCODE -eq 0) {
      Write-Success "Development databases started"
    }
    else {
      Write-Warning "Failed to start development databases"
    }
  }
  else {
    Write-Warning "Docker Compose is not available"
  }
}
catch {
  Write-Warning "Docker is not installed. Database services will not be started."
  Write-Warning "Please install Docker to run the complete development environment."
}

# Create logs directory for backend
$logsDir = "apps/backend/logs"
if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
  Write-Success "Created logs directory for backend"
}

# Build all packages
Write-Status "Building all packages..."
npm run build
if ($LASTEXITCODE -eq 0) {
  Write-Success "All packages built successfully"
}
else {
  Write-Warning "Some packages failed to build (this is normal for fresh setup)"
}

# Run initial tests
Write-Status "Running initial tests..."
npm run test
if ($LASTEXITCODE -eq 0) {
  Write-Success "All tests passed"
}
else {
  Write-Warning "Some tests failed (this is normal for fresh setup)"
}

# Security audit
Write-Status "Running security audit..."
npm audit --audit-level moderate
if ($LASTEXITCODE -eq 0) {
  Write-Success "No security vulnerabilities found"
}
else {
  Write-Warning "Security vulnerabilities detected. Run 'npm audit fix' to resolve."
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update environment variables in:" -ForegroundColor White
Write-Host "   - apps/backend/.env" -ForegroundColor Gray
Write-Host "   - apps/frontend/.env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start development servers:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or start individual services:" -ForegroundColor White
Write-Host "   npm run dev --workspace=apps/backend" -ForegroundColor Gray
Write-Host "   npm run dev --workspace=apps/frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access the applications:" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Backend API: http://localhost:3001" -ForegroundColor Gray
Write-Host "   - API Health: http://localhost:3001/health" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - README.md - General overview" -ForegroundColor Gray
Write-Host "   - docs/DEVOPS.md - DevOps practices" -ForegroundColor Gray
Write-Host "   - docs/security/THREAT_MODEL.md - Security documentation" -ForegroundColor Gray
Write-Host ""
Write-Host "🔒 Security:" -ForegroundColor Yellow
Write-Host "   - Review SECURITY.md for security policies" -ForegroundColor Gray
Write-Host "   - Update default passwords and secrets" -ForegroundColor Gray
Write-Host "   - Enable MFA for production deployments" -ForegroundColor Gray
Write-Host ""
Write-Success "Happy coding! 🚀"