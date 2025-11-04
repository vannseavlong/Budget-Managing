# DevOps Implementation Guide

This guide provides comprehensive instructions for implementing DevOps practices in the Budget Managing monorepo.

## 🔄 CI/CD Pipeline

### Pipeline Overview

The CI/CD pipeline is implemented using GitHub Actions and consists of the following stages:

1. **Code Quality & Testing**
2. **Security Scanning**
3. **Build & Containerization**
4. **End-to-End Testing**
5. **Deployment**

### Pipeline Configuration

#### Workflow Triggers
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

#### Environment Variables
```yaml
env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```

### Stage Details

#### 1. Code Quality & Testing
- **Linting**: ESLint for code quality
- **Type Checking**: TypeScript validation
- **Unit Tests**: Jest test execution
- **Coverage**: Code coverage reporting

#### 2. Security Scanning
- **Dependency Audit**: npm audit for vulnerabilities
- **SAST**: Snyk security scanning
- **DAST**: OWASP ZAP baseline scan
- **Container Scanning**: Docker image vulnerability assessment

#### 3. Build & Containerization
- **Application Build**: TypeScript compilation and Next.js build
- **Docker Images**: Multi-stage container builds
- **Registry Push**: Container registry deployment
- **Artifact Storage**: Build artifact preservation

#### 4. End-to-End Testing
- **Environment Setup**: Test environment provisioning
- **Playwright Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing
- **Integration Tests**: API and database testing

#### 5. Deployment
- **Staging**: Automatic deployment to staging environment
- **Production**: Manual approval for production deployment
- **Rollback**: Automated rollback capabilities

## 🛠️ Tools and Technologies

### Version Control
- **Git**: Source code management
- **GitHub**: Repository hosting and collaboration
- **Branch Protection**: Enforce review requirements
- **Conventional Commits**: Standardized commit messages

### Build and Package Management
- **Turbo**: Monorepo build system
- **npm Workspaces**: Package management
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting
- **Commitlint**: Commit message validation

### Testing
- **Jest**: Unit and integration testing
- **Supertest**: API testing
- **Playwright**: End-to-end testing
- **Testing Library**: React component testing

### Security
- **Snyk**: Vulnerability scanning
- **OWASP ZAP**: Security testing
- **npm audit**: Dependency vulnerability checking
- **Helmet**: Security headers
- **bcrypt**: Password hashing

### Monitoring and Logging
- **Winston**: Application logging
- **Morgan**: HTTP request logging
- **Health Checks**: Application monitoring
- **Performance Metrics**: Application performance tracking

## 🔒 Security Implementation

### OWASP Top 10 Protection

#### 1. Injection Prevention
```typescript
// Input validation with Zod
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Parameterized queries with Mongoose
const user = await User.findOne({ email: validatedInput.email });
```

#### 2. Broken Authentication Prevention
```typescript
// Strong password hashing
const hashedPassword = await bcrypt.hash(password, 12);

// JWT with short expiration
const token = jwt.sign(payload, secret, { expiresIn: '15m' });
```

#### 3. Sensitive Data Exposure Prevention
```typescript
// Environment variable protection
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Secure headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
}));
```

### Security Headers Implementation
```typescript
// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

### Input Validation
```typescript
// Zod schema validation
const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  category: z.enum(['income', 'expense']),
});

// Middleware for validation
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid input' });
    }
  };
};
```

## 🏗️ Infrastructure as Code

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine AS base
# Multi-stage build for optimized production image
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Security: Run as non-root user
USER backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health')"
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS base
# Next.js optimized production build
ENV NEXT_TELEMETRY_DISABLED=1
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### Docker Compose Services
```yaml
services:
  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## 📊 Monitoring and Observability

### Application Monitoring

#### Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  });
});
```

#### Logging Strategy
```typescript
// Structured logging with Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Performance Monitoring
```typescript
// Response time tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
    });
  });
  next();
});
```

## 🚀 Deployment Strategies

### Environment Management

#### Development
```bash
# Start development environment
npm run dev

# Individual services
npm run dev --workspace=apps/backend
npm run dev --workspace=apps/frontend
```

#### Staging
```bash
# Build for staging
npm run build
docker-compose -f docker-compose.staging.yml up -d
```

#### Production
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

### Deployment Checklist

#### Pre-deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Environment variables configured

#### Deployment
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] SSL certificates valid

#### Post-deployment
- [ ] Smoke tests completed
- [ ] Performance metrics normal
- [ ] Error rates within threshold
- [ ] User acceptance testing
- [ ] Rollback plan verified

## 🔧 Automation Scripts

### Setup Scripts
```bash
#!/bin/bash
# setup-dev.sh - Development environment setup

echo "Setting up development environment..."

# Install dependencies
npm install

# Set up Git hooks
npm run prepare

# Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start Docker services
docker-compose up -d mongodb redis

echo "Development environment ready!"
```

### Build Scripts
```bash
#!/bin/bash
# build-prod.sh - Production build script

echo "Building for production..."

# Clean previous builds
npm run clean

# Build all applications
npm run build

# Run tests
npm run test

# Security audit
npm run security:audit

echo "Production build complete!"
```

## 📈 Metrics and KPIs

### Development Metrics
- **Build Time**: Average build duration
- **Test Coverage**: Code coverage percentage
- **Code Quality**: ESLint errors and warnings
- **Security**: Number of vulnerabilities

### Operational Metrics
- **Uptime**: Application availability
- **Response Time**: API response times
- **Error Rate**: Application error percentage
- **Throughput**: Requests per second

### Business Metrics
- **Feature Velocity**: Features delivered per sprint
- **Bug Rate**: Bugs per feature
- **Customer Satisfaction**: User feedback scores
- **Time to Market**: Feature delivery time

## 🎯 Best Practices

### Development
1. **Code Reviews**: All changes require peer review
2. **Test-Driven Development**: Write tests before code
3. **Documentation**: Keep documentation up-to-date
4. **Security First**: Consider security in all decisions

### Operations
1. **Infrastructure as Code**: Version control all infrastructure
2. **Monitoring**: Monitor everything that matters
3. **Automation**: Automate repetitive tasks
4. **Incident Response**: Have a plan for when things go wrong

### Security
1. **Defense in Depth**: Multiple layers of security
2. **Principle of Least Privilege**: Minimal necessary permissions
3. **Regular Updates**: Keep dependencies current
4. **Security Training**: Educate the team

## 🚨 Incident Response

### Incident Classification
- **Critical**: System down or data breach
- **High**: Major feature broken
- **Medium**: Minor feature issues
- **Low**: Cosmetic or enhancement requests

### Response Process
1. **Detection**: Monitoring alerts or user reports
2. **Assessment**: Determine severity and impact
3. **Response**: Immediate actions to mitigate
4. **Resolution**: Fix the root cause
5. **Post-mortem**: Learn and improve

### Communication Plan
- **Stakeholders**: Who to notify for each severity
- **Channels**: How to communicate (Slack, email, phone)
- **Updates**: Frequency of status updates
- **Documentation**: Record all actions and decisions

---

This DevOps guide provides the foundation for implementing modern DevOps practices in your Budget Managing application. Regular review and updates of these practices will ensure continued improvement and security.