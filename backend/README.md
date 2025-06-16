# Holded Analysis Backend API

Backend API for the Holded Analysis Platform - A comprehensive ERP integration system that replicates Holded.com functionality.

## 🚀 Features

- **8 Core ERP Modules**: Invoicing, Accounting, Projects, Inventory, HR, CRM, POS, System
- **RESTful API**: Complete REST API with 80+ endpoints
- **Authentication**: JWT-based auth with 2FA support
- **Security**: Helmet, CORS, rate limiting, input validation
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for performance optimization
- **Real-time**: WebSocket support for live updates
- **Monitoring**: Prometheus metrics, Sentry error tracking
- **Documentation**: Swagger/OpenAPI documentation

## 📋 Prerequisites

- Node.js >= 20.0.0
- MongoDB >= 7.0
- Redis >= 7.0
- npm or pnpm

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd holded-analysis/backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/holded-analysis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d

# External APIs
HOLDED_API_KEY=your-holded-api-key
HOLDED_API_URL=https://api.holded.com/api/

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

5. Run database migrations:
```bash
pnpm run db:migrate
```

6. Seed initial data:
```bash
pnpm run db:seed
```

## 🏃‍♂️ Running the Application

### Development
```bash
pnpm run dev
```

### Production
```bash
pnpm start
```

### Docker
```bash
pnpm run docker:build
pnpm run docker:run
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
```
http://localhost:3000/api-docs
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Coverage
```bash
pnpm run test:coverage
```

### E2E Tests
```bash
pnpm run test:e2e
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   ├── docs/            # API documentation
│   ├── monitoring/      # Metrics and logging
│   └── server.js        # Application entry point
├── tests/               # Test files
├── scripts/             # Utility scripts
└── package.json
```

## 🔒 Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **2FA**: Two-factor authentication support
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based CSRF prevention
- **SQL Injection**: Parameterized queries with Mongoose
- **Headers Security**: Helmet.js configuration

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Modules
- `GET /api/v1/modules` - List all modules
- `GET /api/v1/modules/:id` - Get module details
- `PUT /api/v1/modules/:id/settings` - Update module settings

### Invoicing
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices/:id` - Get invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `POST /api/v1/invoices/:id/send` - Send invoice
- `POST /api/v1/invoices/:id/payment` - Record payment

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `POST /api/v1/projects/:id/tasks` - Add task

### And many more...

## 🚀 Deployment

### Environment Setup
1. Set production environment variables
2. Enable SSL/TLS certificates
3. Configure reverse proxy (Nginx/Apache)
4. Set up process manager (PM2)

### Health Check
```bash
curl http://localhost:3000/health
```

## 📈 Monitoring

- **Metrics**: Prometheus endpoint at `/metrics`
- **Logs**: Winston with daily rotation
- **Errors**: Sentry integration
- **APM**: OpenTelemetry support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@holded-analysis.com or open an issue.