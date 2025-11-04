# Threat Modeling Documentation

## Overview

This document outlines the comprehensive threat modeling approach for the Budget Managing application, following industry-standard methodologies including STRIDE, PASTA, and OWASP guidelines.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│     Backend     │◄──►│    Database     │
│   (Next.js)     │    │  (Node.js API)  │    │   (MongoDB)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│      CDN        │    │     Cache       │    │    File Store   │
│                 │    │    (Redis)      │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Diagram
```
User Browser ──HTTPS──► Load Balancer ──HTTP──► Frontend App
                              │
                              ▼
                       Backend API ──► Authentication Service
                              │                    │
                              ▼                    ▼
                         Database ◄────────► Session Store
                              │                    │
                              ▼                    ▼
                         Audit Logs        Monitoring System
```

## Asset Identification

### Critical Assets

#### 1. User Data
- **Personal Information**: Names, emails, phone numbers
- **Financial Data**: Budget amounts, transaction history, account details
- **Authentication Data**: Passwords, tokens, session information
- **Metadata**: Usage patterns, preferences, analytics data

#### 2. Application Assets
- **Source Code**: Intellectual property, business logic
- **Configuration**: Environment variables, secrets, API keys
- **Infrastructure**: Servers, databases, network components
- **Backups**: Data backups, configuration backups

#### 3. Business Assets
- **Reputation**: Brand trust, customer confidence
- **Compliance**: Regulatory adherence, audit trails
- **Availability**: Service uptime, business continuity
- **Intellectual Property**: Algorithms, processes, designs

## Threat Identification (STRIDE)

### Spoofing Identity
#### Threats
- User account takeover
- API key theft and misuse
- Session hijacking
- Identity fraud

#### Attack Vectors
- Credential stuffing attacks
- Phishing campaigns
- Man-in-the-middle attacks
- Social engineering

#### Mitigations
- Multi-factor authentication (MFA)
- Strong password policies
- Account lockout mechanisms
- Session management best practices

### Tampering with Data
#### Threats
- Database manipulation
- Transaction modification
- Code injection attacks
- File system tampering

#### Attack Vectors
- SQL injection
- NoSQL injection
- Cross-site scripting (XSS)
- File upload vulnerabilities

#### Mitigations
- Input validation and sanitization
- Parameterized queries
- Content Security Policy (CSP)
- File type restrictions and scanning

### Repudiation
#### Threats
- Denial of transactions
- Unauthorized actions without accountability
- Log tampering or deletion
- Non-repudiation of financial operations

#### Attack Vectors
- Log file manipulation
- System clock tampering
- Weak audit trails
- Insufficient logging

#### Mitigations
- Comprehensive audit logging
- Digital signatures for critical operations
- Tamper-evident log systems
- Time synchronization (NTP)

### Information Disclosure
#### Threats
- Sensitive data exposure
- Configuration data leakage
- Database information disclosure
- API data exposure

#### Attack Vectors
- Directory traversal
- Information disclosure through error messages
- Insecure direct object references
- API enumeration

#### Mitigations
- Data encryption at rest and in transit
- Access control lists (ACLs)
- Error handling without information disclosure
- API rate limiting and access controls

### Denial of Service
#### Threats
- Application unavailability
- Resource exhaustion
- Database overload
- Network congestion

#### Attack Vectors
- DDoS attacks
- Application-layer attacks
- Database connection exhaustion
- Memory exhaustion attacks

#### Mitigations
- Rate limiting
- Resource monitoring and alerting
- Load balancing
- Circuit breaker patterns

### Elevation of Privilege
#### Threats
- Unauthorized access to admin functions
- Privilege escalation attacks
- Broken access control
- Insecure direct object references

#### Attack Vectors
- Vertical privilege escalation
- Horizontal privilege escalation
- JWT token manipulation
- Authorization bypass

#### Mitigations
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews
- Secure coding practices

## Risk Assessment Matrix

### Risk Scoring
- **Probability**: Very Low (1), Low (2), Medium (3), High (4), Very High (5)
- **Impact**: Very Low (1), Low (2), Medium (3), High (4), Very High (5)
- **Risk Level**: Probability × Impact

### Critical Risks (16-25)

#### 1. Financial Data Breach
- **Probability**: 3 (Medium)
- **Impact**: 5 (Very High)
- **Risk Score**: 15
- **Mitigation Priority**: Critical

#### 2. Account Takeover
- **Probability**: 4 (High)
- **Impact**: 4 (High)
- **Risk Score**: 16
- **Mitigation Priority**: Critical

#### 3. SQL/NoSQL Injection
- **Probability**: 3 (Medium)
- **Impact**: 5 (Very High)
- **Risk Score**: 15
- **Mitigation Priority**: Critical

### High Risks (11-15)

#### 1. Cross-Site Scripting (XSS)
- **Probability**: 4 (High)
- **Impact**: 3 (Medium)
- **Risk Score**: 12
- **Mitigation Priority**: High

#### 2. Insecure Direct Object References
- **Probability**: 3 (Medium)
- **Impact**: 4 (High)
- **Risk Score**: 12
- **Mitigation Priority**: High

#### 3. Session Management Vulnerabilities
- **Probability**: 3 (Medium)
- **Impact**: 4 (High)
- **Risk Score**: 12
- **Mitigation Priority**: High

### Medium Risks (6-10)

#### 1. Information Disclosure
- **Probability**: 3 (Medium)
- **Impact**: 2 (Low)
- **Risk Score**: 6
- **Mitigation Priority**: Medium

#### 2. Denial of Service
- **Probability**: 2 (Low)
- **Impact**: 3 (Medium)
- **Risk Score**: 6
- **Mitigation Priority**: Medium

## Security Controls Implementation

### Prevention Controls

#### 1. Input Validation
```typescript
// Zod schema validation
const createTransactionSchema = z.object({
  amount: z.number().positive().max(1000000),
  description: z.string().min(1).max(500),
  category: z.enum(['income', 'expense']),
  date: z.date(),
});

// Sanitization middleware
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};
```

#### 2. Authentication and Authorization
```typescript
// Multi-factor authentication
const verifyMFA = async (userId: string, token: string): Promise<boolean> => {
  const user = await User.findById(userId);
  return speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
};

// Role-based access control
const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

#### 3. Data Encryption
```typescript
// Encryption at rest
const encryptSensitiveData = (data: string): string => {
  const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// TLS configuration
const tlsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:!RC4:!MD5',
  secureProtocol: 'TLSv1_2_method',
};
```

### Detection Controls

#### 1. Monitoring and Alerting
```typescript
// Security event logging
const logSecurityEvent = (event: SecurityEvent): void => {
  logger.warn({
    type: 'SECURITY_EVENT',
    event: event.type,
    userId: event.userId,
    ip: event.ip,
    userAgent: event.userAgent,
    timestamp: new Date().toISOString(),
    severity: event.severity,
  });
};

// Anomaly detection
const detectAnomalousActivity = async (userId: string): Promise<boolean> => {
  const recentLogins = await getRecentLogins(userId, '24h');
  const uniqueIPs = new Set(recentLogins.map(login => login.ip));
  
  // Alert if more than 3 unique IPs in 24 hours
  return uniqueIPs.size > 3;
};
```

#### 2. Intrusion Detection
```typescript
// Failed login attempt tracking
const trackFailedLogins = async (ip: string): Promise<void> => {
  const key = `failed_logins:${ip}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour expiry
  
  if (count > 5) {
    await blockIP(ip, 3600); // Block for 1 hour
    logSecurityEvent({
      type: 'BRUTE_FORCE_ATTEMPT',
      ip,
      severity: 'HIGH',
    });
  }
};
```

### Response Controls

#### 1. Incident Response
```typescript
// Automatic incident response
const respondToSecurityIncident = async (incident: SecurityIncident): Promise<void> => {
  // Immediate response actions
  switch (incident.severity) {
    case 'CRITICAL':
      await lockUserAccount(incident.userId);
      await notifySecurityTeam(incident);
      await createIncidentTicket(incident);
      break;
    case 'HIGH':
      await flagUserAccount(incident.userId);
      await notifySecurityTeam(incident);
      break;
    case 'MEDIUM':
      await logIncident(incident);
      break;
  }
};
```

#### 2. Recovery Procedures
```typescript
// Account recovery with verification
const initiateAccountRecovery = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal if account exists
  
  const recoveryToken = generateSecureToken();
  await storeRecoveryToken(user.id, recoveryToken, '1h');
  await sendRecoveryEmail(email, recoveryToken);
  
  logSecurityEvent({
    type: 'ACCOUNT_RECOVERY_INITIATED',
    userId: user.id,
    severity: 'MEDIUM',
  });
};
```

## Compliance Mapping

### OWASP Top 10 2021

#### A01 - Broken Access Control
- **Risk**: High
- **Controls**: RBAC, access reviews, principle of least privilege
- **Testing**: Authorization testing, privilege escalation tests

#### A02 - Cryptographic Failures
- **Risk**: High
- **Controls**: TLS 1.3, AES-256 encryption, secure key management
- **Testing**: Cryptographic implementation reviews, SSL/TLS testing

#### A03 - Injection
- **Risk**: High
- **Controls**: Input validation, parameterized queries, WAF
- **Testing**: SAST/DAST scanning, manual penetration testing

#### A04 - Insecure Design
- **Risk**: Medium
- **Controls**: Security requirements, threat modeling, design reviews
- **Testing**: Architecture reviews, design pattern analysis

#### A05 - Security Misconfiguration
- **Risk**: Medium
- **Controls**: Hardening guides, configuration management, scanning
- **Testing**: Configuration reviews, vulnerability scanning

#### A06 - Vulnerable Components
- **Risk**: High
- **Controls**: Dependency scanning, update management, SCA tools
- **Testing**: Automated dependency checks, SBOM analysis

#### A07 - Identity and Authentication Failures
- **Risk**: High
- **Controls**: MFA, password policies, session management
- **Testing**: Authentication testing, session analysis

#### A08 - Software and Data Integrity Failures
- **Risk**: Medium
- **Controls**: Digital signatures, integrity checks, secure CI/CD
- **Testing**: Supply chain security testing, integrity validation

#### A09 - Security Logging and Monitoring Failures
- **Risk**: Medium
- **Controls**: Comprehensive logging, SIEM, alerting
- **Testing**: Log analysis, monitoring effectiveness tests

#### A10 - Server-Side Request Forgery (SSRF)
- **Risk**: Low
- **Controls**: Input validation, network segmentation, allowlists
- **Testing**: SSRF testing, network security validation

## Testing and Validation

### Security Testing Strategy

#### 1. Static Application Security Testing (SAST)
- **Tools**: ESLint Security Plugin, Semgrep, SonarQube
- **Frequency**: Every commit
- **Coverage**: Source code analysis, dependency scanning

#### 2. Dynamic Application Security Testing (DAST)
- **Tools**: OWASP ZAP, Burp Suite
- **Frequency**: Weekly, before releases
- **Coverage**: Running application testing, API security

#### 3. Interactive Application Security Testing (IAST)
- **Tools**: Contrast Security, Veracode
- **Frequency**: During testing phases
- **Coverage**: Real-time vulnerability detection

#### 4. Penetration Testing
- **Internal Testing**: Quarterly
- **External Testing**: Annually
- **Bug Bounty**: Continuous
- **Red Team Exercises**: Bi-annually

### Threat Model Validation

#### 1. Architecture Reviews
- **Frequency**: Before major releases
- **Scope**: System design, data flows, trust boundaries
- **Participants**: Security team, architects, developers

#### 2. Code Reviews
- **Frequency**: Every pull request
- **Focus**: Security controls implementation
- **Tools**: Automated and manual review processes

#### 3. Penetration Testing
- **Scope**: Full application stack
- **Methodology**: OWASP Testing Guide
- **Reporting**: Executive summary, technical details, remediation

## Continuous Improvement

### Threat Intelligence Integration
- **Sources**: CVE databases, security feeds, industry reports
- **Frequency**: Daily updates
- **Integration**: Automated threat model updates

### Security Metrics
- **Vulnerability Metrics**: Time to detection, time to remediation
- **Compliance Metrics**: Control effectiveness, audit results
- **Incident Metrics**: MTTD, MTTR, incident frequency

### Training and Awareness
- **Developer Training**: Secure coding practices
- **Security Awareness**: Phishing simulation, security updates
- **Incident Response**: Tabletop exercises, response drills

---

This threat modeling document should be reviewed and updated quarterly or after any significant system changes.