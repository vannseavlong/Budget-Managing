# Budget Managing Monorepo

A comprehensive, security-first budget management application built with modern technologies and DevOps best practices.

## 🏗️ Architecture

### Monorepo Structure
```
Budget-Managing/
├── apps/
│   ├── backend/          # Node.js + Express API
│   └── frontend/         # Next.js + shadcn/ui
├── packages/             # Shared packages
├── docs/                 # Documentation
├── .github/              # GitHub Actions workflows
└── docker/              # Docker configurations
```

### Technology Stack

#### Backend
- **Framework**: Node.js + Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Redis
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, Rate limiting, Input validation
- **Logging**: Winston
- **Testing**: Jest + Supertest

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Testing**: Jest + Playwright

#### DevOps & Infrastructure
- **Build Tool**: Turbo (Monorepo)
- **Package Manager**: npm (workspaces)
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose
- **Security Scanning**: Snyk, OWASP ZAP
- **Code Quality**: ESLint, Prettier, Husky

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Budget-Managing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   
   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Start development services**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individual services
   npm run dev --workspace=apps/backend
   npm run dev --workspace=apps/frontend
   ```

### Using Docker

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 📝 Development Guidelines

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with consistent configuration
- **Type Safety**: Strict TypeScript configuration
- **Testing**: Minimum 80% code coverage

### Git Workflow
- **Branching**: GitFlow (main, develop, feature/*)
- **Commits**: Conventional commits format
- **PR Reviews**: Required for all changes
- **CI/CD**: Automated testing and deployment

### Security Best Practices
- **Input Validation**: Zod schemas for all inputs
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit

## 🧪 Testing

### Running Tests
```bash
# All tests
npm run test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Full user workflows with Playwright
- **Security Tests**: Vulnerability scanning and penetration testing

## 🔒 Security

### Security Measures
- **OWASP Top 10 Protection**: Comprehensive coverage
- **Dependency Scanning**: Automated vulnerability detection
- **Secret Management**: Environment variables and secure storage
- **Access Control**: JWT-based authentication with RBAC
- **Data Encryption**: AES-256 encryption for sensitive data

### Security Testing
- **SAST**: Static application security testing
- **DAST**: Dynamic application security testing
- **Dependency Scanning**: Snyk integration
- **Container Scanning**: Docker image vulnerability scanning

See [SECURITY.md](SECURITY.md) for detailed security policies.

## 📦 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build all apps
npm run build

# Start production servers
npm run start
```

### Docker Deployment
```bash
# Production with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline with:
- **Code Quality Checks**: Linting, type checking, testing
- **Security Scanning**: Vulnerability assessment, dependency audit
- **Build Process**: Multi-stage Docker builds
- **Deployment**: Automated staging and production deployment

## 📊 Monitoring & Logging

### Application Monitoring
- **Logging**: Structured logging with Winston
- **Health Checks**: Application and dependency health endpoints
- **Performance**: Response time and resource usage monitoring
- **Error Tracking**: Centralized error collection and alerting

### Infrastructure Monitoring
- **Container Health**: Docker health checks
- **Database**: MongoDB and Redis monitoring
- **Network**: Traffic and security monitoring
- **Resource Usage**: CPU, memory, and disk monitoring

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow coding standards
4. **Add tests**: Ensure good test coverage
5. **Commit changes**: Use conventional commit format
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**: Include description and testing notes

### Development Setup
```bash
# Install dependencies
npm install

# Set up git hooks
npm run prepare

# Start development
npm run dev
```

## 📋 Scripts

### Root Level
- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format all code
- `npm run security:audit` - Run security audit

### Workspace Specific
```bash
# Backend
npm run dev --workspace=apps/backend
npm run build --workspace=apps/backend
npm run test --workspace=apps/backend

# Frontend  
npm run dev --workspace=apps/frontend
npm run build --workspace=apps/frontend
npm run test --workspace=apps/frontend
```

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Frontend Components](docs/frontend/README.md)
- [Security Policy](SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Deployment Guide](docs/deployment/README.md)

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's running on ports
   lsof -i :3000
   lsof -i :3001
   ```

2. **Docker issues**
   ```bash
   # Reset Docker environment
   docker-compose down -v
   docker system prune -a
   ```

3. **Database connection issues**
   ```bash
   # Check MongoDB connection
   docker-compose logs mongodb
   
   # Check Redis connection
   docker-compose logs redis
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs/ directory
- **Issues**: GitHub Issues for bug reports
- **Security**: security@yourcompany.com
- **General**: support@yourcompany.com

---

**Built with ❤️ using modern web technologies and security best practices.**