# Project Structure Overview - Google Sheets Integration

> **Status note**: the directory structure and stack details below describe an early/
> aspirational version of this project and don't match the current code (which uses pnpm
> workspaces, not npm; Next.js App Router, not the `src/app` layout shown here; etc.). The
> backend is also currently being rebuilt from scratch — see
> `docs/BACKEND_REBUILD_PLAN.md` for the actual current plan and `CLAUDE.md` for what's
> accurate about the codebase today. Treat this file as historical context on the project's
> original vision, not a structural reference.

## 🎯 Project Vision

A privacy-first budget management application where each user's data is stored in their own Google Drive, eliminating the need for centralized databases while providing a rich, responsive user experience.

## 🏗️ Architecture Overview

### Data Flow
```
User Authentication (Google OAuth)
         ↓
Google Sheets API (User's Drive)
         ↓
Express.js API Layer
         ↓
Next.js Frontend (Responsive)
```

### Key Benefits
- **Privacy-First**: Data stays in user's Google Drive
- **No Database Setup**: Eliminates MongoDB/Redis infrastructure
- **Automatic Backup**: Google Drive handles data persistence
- **Collaborative**: Users can view/edit their spreadsheet directly
- **Cost-Effective**: No database hosting costs

## 📁 Complete Directory Structure

```
Budget-Managing/
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 ci-cd.yml                    # GitHub Actions CI/CD pipeline
├── 📁 apps/
│   ├── 📁 backend/                         # Node.js + Express API
│   │   ├── 📁 src/
│   │   │   ├── 📁 middleware/
│   │   │   │   ├── 📄 errorHandler.ts      # Error handling middleware
│   │   │   │   ├── 📄 notFoundHandler.ts   # 404 handler
│   │   │   │   └── 📄 security.ts          # Security middleware
│   │   │   ├── 📁 utils/
│   │   │   │   └── 📄 logger.ts            # Winston logging configuration
│   │   │   └── 📄 index.ts                 # Main application entry point
│   │   ├── 📄 .env.example                 # Environment variables template
│   │   ├── 📄 Dockerfile                   # Backend container configuration
│   │   ├── 📄 package.json                 # Backend dependencies and scripts
│   │   └── 📄 tsconfig.json               # TypeScript configuration
   └── 📁 frontend/                        # Next.js + shadcn/ui
       ├── 📁 src/
       │   ├── 📁 app/                         # Next.js App Router
       │   │   ├── 📄 globals.css              # Global styles with Tailwind
       │   │   ├── 📄 layout.tsx               # Root layout component
       │   │   └── 📄 page.tsx                 # Home page component
       │   ├── 📁 components/                  # React Components
       │   │   ├── 📁 features/                # Feature-specific components
       │   │   │   ├── 📄 Dashboard.tsx        # Dashboard overview
       │   │   │   ├── 📄 BudgetManagement.tsx # Budget tracking
       │   │   │   ├── 📄 Categories.tsx       # Category management
       │   │   │   ├── 📄 DailyTracker.tsx     # Daily expense tracking
       │   │   │   ├── 📄 Goals.tsx            # Financial goals
       │   │   │   ├── 📄 Settings.tsx         # App settings
       │   │   │   └── 📄 Summary.tsx          # Financial summary
       │   │   ├── 📁 layout/                  # Layout components
       │   │   │   ├── 📄 BottomNavigation.tsx # Mobile navigation
       │   │   │   └── 📄 DesktopSidebar.tsx   # Desktop sidebar
       │   │   ├── 📁 ui/                      # shadcn/ui components
       │   │   │   ├── 📄 button.tsx           # Button component
       │   │   │   ├── 📄 card.tsx             # Card component
       │   │   │   ├── 📄 input.tsx            # Input component
       │   │   │   └── ...                     # Other UI components
       │   │   └── 📄 App.tsx                  # Main app component
       │   ├── 📁 context/                     # React Context
       │   │   └── 📄 AppContext.tsx           # Global state management
       │   ├── 📁 hooks/                       # Custom React hooks
       │   │   └── 📄 use-mobile.ts            # Mobile detection hook
       │   ├── 📁 services/                    # API services
       │   │   └── 📄 api.ts                   # API client functions
       │   └── 📁 types/                       # TypeScript types
       │       └── 📄 index.ts                 # Type definitions
│       ├── 📄 .env.example                 # Frontend environment template
│       ├── 📄 Dockerfile                   # Frontend container configuration
│       ├── 📄 next.config.js              # Next.js configuration
│       ├── 📄 package.json                 # Frontend dependencies and scripts
│       ├── 📄 tailwind.config.js          # Tailwind CSS configuration
│       └── 📄 tsconfig.json               # TypeScript configuration
├── 📁 docs/                               # Documentation
│   ├── 📁 api/                            # API documentation
│   ├── 📁 deployment/                     # Deployment guides
│   ├── 📁 security/                       # Security documentation
│   │   └── 📄 THREAT_MODEL.md             # Comprehensive threat model
│   ├── 📄 CONFIGURATION.md                # Configuration guidelines
│   └── 📄 DEVOPS.md                       # DevOps implementation guide
├── 📁 packages/                           # Shared packages
│   ├── 📁 config/                         # Shared configuration
│   │   └── 📄 package.json
│   └── 📁 ui/                             # Shared UI components
│       └── 📄 package.json
├── 📄 .eslintrc.json                      # ESLint configuration
├── 📄 .gitignore                          # Git ignore rules
├── 📄 .lintstagedrc                       # Lint-staged configuration
├── 📄 .prettierrc.json                    # Prettier configuration
├── 📄 commitlint.config.js                # Commit message linting
├── 📄 docker-compose.yml                  # Multi-container orchestration
├── 📄 package.json                        # Root package configuration
├── 📄 README.md                           # Project overview and setup
├── 📄 SECURITY.md                         # Security policy and practices
├── 📄 setup.ps1                           # Windows PowerShell setup script
├── 📄 setup.sh                            # Unix/Linux setup script
└── 📄 turbo.json                          # Turbo monorepo configuration
```

## 🛠️ Technology Stack Summary

### Backend Technologies
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Google Sheets API (User-owned spreadsheets)
- **Authentication**: Google OAuth 2.0 + JWT
- **Security**: Helmet, Rate limiting, Input validation (Zod)
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **API Documentation**: Swagger/OpenAPI
- **Google APIs**: googleapis, google-auth-library

### Frontend Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Charts**: Recharts
- **Date Picker**: react-day-picker
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Responsive Design**: Mobile-first with conditional layouts
- **Testing**: Jest + Playwright
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Testing**: Jest + Playwright + Testing Library

### DevOps & Infrastructure
- **Monorepo**: Turbo
- **Package Manager**: npm workspaces
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Security Scanning**: Snyk, OWASP ZAP
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Commit Standards**: Conventional Commits + Commitlint

### Security Features
- **OWASP Top 10 Protection**: Comprehensive coverage
- **Input Validation**: Zod schemas
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Security Headers**: Helmet.js implementation
- **Rate Limiting**: Express rate limit
- **Data Encryption**: AES-256 encryption
- **Secret Management**: Environment variables
- **Vulnerability Scanning**: Automated dependency checking
- **HTTPS/TLS**: SSL/TLS encryption
- **CORS**: Configurable cross-origin resource sharing

## 🚀 Quick Start Commands

### Initial Setup
```bash
# Clone and setup (Unix/Linux/macOS)
./setup.sh

# Clone and setup (Windows PowerShell)
./setup.ps1

# Manual setup
npm install
npm run prepare
```

### Development
```bash
# Start all services
npm run dev

# Start individual services
npm run dev --workspace=apps/backend
npm run dev --workspace=apps/frontend

# Start with Docker
docker-compose up -d
```

### Production
```bash
# Build all applications
npm run build

# Start production servers
npm run start

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Testing
```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Code Quality
```bash
# Lint all code
npm run lint

# Format all code
npm run format

# Type check all code
npm run type-check

# Security audit
npm run security:audit
```

## 🔐 Security Implementation

### Authentication Flow
1. User registration with strong password requirements
2. Password hashing using bcrypt (12 rounds)
3. JWT token generation with short expiration
4. Refresh token mechanism for session management
5. Multi-factor authentication (MFA) support

### Authorization System
- Role-based access control (RBAC)
- Principle of least privilege
- Resource-level permissions
- API endpoint protection

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS protection with CSP headers

### Security Monitoring
- Comprehensive audit logging
- Failed login attempt tracking
- Anomaly detection algorithms
- Real-time security alerts
- Automated incident response

## 📊 DevOps Pipeline

### CI/CD Stages
1. **Code Quality**: Linting, type checking, formatting
2. **Testing**: Unit, integration, and E2E tests
3. **Security**: Vulnerability scanning, dependency audit
4. **Build**: Application compilation and containerization
5. **Deploy**: Automated deployment to staging/production

### Monitoring & Observability
- Application health checks
- Performance metrics collection
- Error tracking and alerting
- Resource usage monitoring
- Security event logging

### Deployment Strategies
- Blue-green deployments
- Rolling updates
- Canary releases
- Automated rollback capabilities

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **End-to-End Tests**: Complete user workflows
- **Security Tests**: Vulnerability and penetration testing
- **Performance Tests**: Load and stress testing

### Test Coverage Goals
- Minimum 80% code coverage
- 100% critical path coverage
- All security controls tested
- Performance benchmarks established

## 📈 Scalability Considerations

### Application Architecture
- Microservices-ready monorepo structure
- Stateless application design
- Database connection pooling
- Caching strategies (Redis)
- API rate limiting

### Infrastructure Scalability
- Horizontal scaling capabilities
- Load balancing configuration
- Database sharding preparation
- CDN integration ready
- Auto-scaling policies

## 🔧 Maintenance & Updates

### Regular Tasks
- Dependency updates (weekly)
- Security patches (immediate)
- Performance optimization (monthly)
- Documentation updates (ongoing)
- Backup verification (daily)

### Monitoring & Alerts
- Application uptime monitoring
- Performance threshold alerts
- Security incident notifications
- Resource usage warnings
- Backup failure alerts

## 📋 Next Steps After Setup

1. **Environment Configuration**
   - Update environment variables
   - Configure database connections
   - Set up external service integrations

2. **Security Hardening**
   - Change default passwords
   - Generate new JWT secrets
   - Configure SSL certificates
   - Enable MFA for admin accounts

3. **Development Workflow**
   - Set up IDE configurations
   - Configure development databases
   - Establish branching strategy
   - Set up local testing environment

4. **Production Preparation**
   - Configure production databases
   - Set up monitoring and logging
   - Implement backup strategies
   - Establish incident response procedures

---

This monorepo provides a solid foundation for building a secure, scalable budget management application with modern development practices and comprehensive security measures.