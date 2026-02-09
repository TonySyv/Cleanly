# Backend Architecture Documentation

## Overview

This document outlines the backend architecture for the Cleanly Android app, designed to be production-ready, scalable, and marketplace-ready.

## Infrastructure Stack

### Database: Neon (PostgreSQL)
- **Why Neon**: Serverless PostgreSQL with automatic scaling, branching, and point-in-time recovery
- **Setup**: 
  1. Create account at [neon.tech](https://neon.tech)
  2. Create a new project
  3. Note connection string for environment variables

### API Backend: Render (Web Service)
- **Why Render**: Easy deployment, automatic SSL, zero-downtime deploys, built-in monitoring
- **Setup**:
  1. Create account at [render.com](https://render.com)
  2. Create new Web Service
  3. Connect GitHub repository
  4. Configure build and start commands

### Background Jobs: Render Background Workers
- For long-running tasks, scheduled jobs, and async processing
- Separate from main API for better scalability

### Scheduled Jobs: Render Cron Jobs
- For periodic tasks (daily reports, cleanup, etc.)
- Configured via Render dashboard

### Edge & Security: Cloudflare
- **DNS**: Domain management
- **Caching**: CDN for static assets
- **WAF**: Web Application Firewall for security
- **DDoS Protection**: Built-in protection

## API Architecture

### Technology Stack (Recommended)

#### Option 1: Node.js/TypeScript (Express/Fastify)
```typescript
// Recommended for rapid development
- Express.js or Fastify
- TypeScript
- Prisma ORM (for PostgreSQL)
- JWT authentication
- Zod for validation
```

#### Option 2: Kotlin (Ktor)
```kotlin
// Recommended for code sharing with Android
- Ktor Server
- Exposed ORM
- JWT authentication
- Kotlinx Serialization
```

#### Option 3: Python (FastAPI)
```python
# Recommended for ML/AI features
- FastAPI
- SQLAlchemy ORM
- Pydantic for validation
- JWT authentication
```

### API Structure

```
/api/v1/
  /auth
    POST   /login          - User login
    POST   /register       - User registration
    POST   /refresh        - Refresh access token
    POST   /logout         - User logout
  
  /users
    GET    /:id            - Get user profile
    PUT    /:id            - Update user profile
    DELETE /:id            - Delete user account
  
  /health
    GET    /               - Health check endpoint
```

### Authentication

#### JWT-Based Authentication
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### Token Refresh Flow
1. Client sends refresh token to `/auth/refresh`
2. Server validates refresh token
3. Server returns new access token
4. Client updates stored tokens

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

## Mobile-Safe Networking

### Retry Strategy
- Exponential backoff for transient failures
- Maximum 3 retries
- Idempotency keys for POST/PUT requests

### Timeouts
- Connection timeout: 10 seconds
- Read timeout: 30 seconds
- Write timeout: 30 seconds

### Idempotency
- Use idempotency keys for non-idempotent operations
- Store keys in database with request results
- Return cached response for duplicate requests

### Error Handling
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "reason": "missing"
    }
  }
}
```

## Security Best Practices

1. **HTTPS Only**: Enforce HTTPS for all endpoints
2. **CORS**: Configure CORS for mobile app domains
3. **Rate Limiting**: Implement rate limiting (e.g., 100 requests/minute per IP)
4. **Input Validation**: Validate all inputs server-side
5. **SQL Injection Prevention**: Use parameterized queries
6. **Password Hashing**: Use bcrypt or Argon2
7. **Token Expiration**: Short-lived access tokens (15-60 min), longer refresh tokens (7-30 days)
8. **Secrets Management**: Use environment variables, never commit secrets

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRY=3600
JWT_REFRESH_TOKEN_EXPIRY=604800

# API
API_PORT=3000
NODE_ENV=production

# Cloudflare (if using)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ZONE_ID=your-zone-id
```

## Deployment Checklist

- [ ] Set up Neon PostgreSQL database
- [ ] Create Render Web Service
- [ ] Configure environment variables
- [ ] Set up Cloudflare DNS and WAF
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Caching layer (Redis) for frequently accessed data

### Vertical Scaling
- Optimize database queries
- Add database indexes
- Use database read replicas

### Caching Strategy
- Cache user profiles (5 minutes TTL)
- Cache public data (longer TTL)
- Invalidate cache on updates

## Monitoring & Observability

### Metrics to Track
- Request rate
- Response times (p50, p95, p99)
- Error rates
- Database query performance
- Memory and CPU usage

### Logging
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request IDs for tracing

### Alerting
- High error rate (> 1%)
- Slow response times (> 1s p95)
- Database connection issues
- High memory usage (> 80%)

## Marketplace-Ready Features

### Payments Integration
- Stripe or PayPal integration
- Webhook handling for payment events
- Subscription management

### Webhooks
- Secure webhook endpoints
- Signature verification
- Retry mechanism for failed webhooks

### Payouts
- Integration with payment processors
- Transaction history
- Balance management

## Example API Implementation (Node.js/Express)

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/v1/auth/login', async (req, res) => {
  // Implementation
});

app.post('/api/v1/auth/register', async (req, res) => {
  // Implementation
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Next Steps

1. Choose your backend technology stack
2. Set up Neon PostgreSQL database
3. Create Render Web Service
4. Implement authentication endpoints
5. Implement user management endpoints
6. Set up Cloudflare
7. Configure monitoring
8. Deploy and test
