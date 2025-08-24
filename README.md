# Flash Sale System

A high-performance, scalable flash sale system built with Node.js, Express, React, and Redis. This system handles sudden surges in traffic for limited-time product sales while ensuring fairness and preventing overselling.

## Features

### Core Functionality
- **Configurable Flash Sale Periods**: Set start and end times for sales
- **Limited Stock Management**: Prevent overselling with atomic stock operations
- **One Item Per User**: Enforce purchase limits per user
- **Real-time Status Updates**: Live countdown timers and stock updates
- **User Purchase Tracking**: Check if users have already purchased

### Performance & Scalability
- **Redis for High Performance**: Atomic operations prevent race conditions
- **Rate Limiting**: Protect against spam and abuse
- **Concurrent Request Handling**: Built for high-traffic scenarios
- **Error Resilience**: Graceful error handling and recovery

### API Endpoints
- `GET /api/flashsale/status/:id` - Check flash sale status
- `POST /api/flashsale/purchase` - Attempt to purchase an item
- `GET /api/flashsale/user/:userId/purchase/:flashSaleId` - Check user purchase status

## Tech Stack

### Backend
- **Node.js** v18.20.2
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Redis** - High-performance data store
- **Rate Limiting** - Request throttling
- **CORS** - Cross-origin support

### Frontend
- **React.js** with TypeScript
- **Axios** - API communication
- **CSS3** - Responsive design
- **Real-time Updates** - Live status polling

## Project Structure

```
flash-sale-project/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── flashsale.controller.ts
│   │   ├── middleware/
│   │   │   └── error.middleware.ts
│   │   ├── models/
│   │   │   └── types.ts
│   │   ├── routes/
│   │   │   └── flashsale.routes.ts
│   │   ├── services/
│   │   │   ├── flashsale.service.ts
│   │   │   └── redis.service.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

## Prerequisites

- **Node.js** v18.20.2 or higher
- **Redis** server (local or remote)
- **npm** or **yarn** package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm run install:all
```

### 2. Setup Redis

#### Option A: Local Redis Installation
```bash
# Windows (using Chocolatey)
choco install redis-64

# macOS (using Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server
```

#### Option B: Redis Cloud (Recommended for Production)
Sign up for a free Redis Cloud account at https://redis.com/try-free/

### 3. Environment Configuration

Create `.env` files for configuration:

**Backend (.env in backend/ folder):**
```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env in frontend/ folder):**
```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Running the Application

### Development Mode

Start both servers in development mode:

```bash
# Terminal 1: Start Redis (if running locally)
redis-server

# Terminal 2: Start Backend
npm run dev:backend

# Terminal 3: Start Frontend
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Production Mode

```bash
# Build both applications
npm run build:backend
npm run build:frontend

# Start backend
npm run start:backend

# Serve frontend (requires serve package)
npm install -g serve
npm run start:frontend
```

## API Usage Examples

### Check Flash Sale Status
```bash
curl http://localhost:3001/api/flashsale/status/sample-sale-1
```

### Attempt Purchase
```bash
curl -X POST http://localhost:3001/api/flashsale/purchase \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "flashSaleId": "sample-sale-1"}'
```

### Check User Purchase Status
```bash
curl http://localhost:3001/api/flashsale/user/user123/purchase/sample-sale-1
```

## System Architecture

### High-Level Flow

1. **Flash Sale Creation**: Admin creates a flash sale with start/end times and stock
2. **Status Monitoring**: Frontend polls backend for real-time status updates
3. **Purchase Request**: User clicks "Buy Now" triggering atomic purchase operation
4. **Stock Management**: Redis atomic operations ensure no overselling
5. **User Tracking**: System prevents duplicate purchases per user

### Concurrency Control

- **Atomic Stock Decrement**: Uses Redis Lua scripts for thread-safe operations
- **User Purchase Tracking**: Redis sets prevent duplicate purchases
- **Rate Limiting**: Express middleware limits requests per IP
- **Error Handling**: Comprehensive error recovery and user feedback

### Scalability Considerations

- **Redis Clustering**: Can be scaled horizontally for larger loads
- **Load Balancing**: Multiple backend instances can share Redis state
- **CDN Integration**: Static assets served via CDN
- **Database Scaling**: Can add PostgreSQL/MongoDB for persistent data

## Testing

Run tests for backend:
```bash
npm run test:backend
```

Run tests for frontend:
```bash
npm run test:frontend
```

## Common Issues & Solutions

### Redis Connection Error
- Ensure Redis server is running
- Check Redis URL in environment variables
- Verify network connectivity

### CORS Issues
- Ensure frontend URL is configured in backend CORS settings
- Check that API calls use correct base URL

### High Load Performance
- Consider Redis clustering for > 10,000 concurrent users
- Implement proper load balancing
- Use Redis persistence for data durability

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Demo Configuration

The system automatically creates a sample flash sale for testing:
- **Product**: X
- **Stock**: 100 items
- **Duration**: 1 hour from startup
- **Start**: 1 minute after server startup

This allows immediate testing without manual configuration.
