# Flash Sale System

A simple yet scalable flash sale system built with Node.js, Express, React, and Redis. This system handles sudden surges in traffic for limited-time product sales while ensuring fairness and preventing overselling.

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

#### Option B: Using Docker
The configuration for redis server is already created inside ```docker-compose.yml```.
To build the redis image on docker just need to run this command
```bash
docker-compose up redis -d
```

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

Postman Collection can be downloaded here to test out the backend functions: https://drive.google.com/file/d/11m-GbWySEVMlqiT7-MKt9H-RGdlsKGMT/view?usp=sharing

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

Architecture Diagram Link: https://drive.google.com/drive/folders/1a8begllLCPCElUj5kI3jSccVGlCN7ij9?usp=sharing

## Testing

Run tests for backend:
```bash
cd backend/
npm test
```

## Demo Configuration

The system automatically creates a sample flash sale for testing:
- **Product**: X
- **Stock**: 100 items
- **Duration**: 1 hour from startup
- **Start**: immediately

This allows immediate testing without manual configuration.

## Load Test
Here's the step-by-step to run the load test:
1. Ensure the script already exists in the project directory, named **load-test.sh**
2. In this script, 2 loopings can be configured as needed. Just change the number on lines 20 and 36 (e.g. ```for i in {1..N}```) where N is the desired number of requests to be tested.
3. On line 24, the ```flashSaleId``` needs to be updated as well to use the current active flash sale record. This value can be obtained through ```/getLatestActiveFlashSale``` endpoint
4. Navigate to **backend/src/server.ts** to update the stock number to comply with the number of tests. Look for ```totalStock``` occurrence and change it from there, then rebuild & re-run the backend service.
5. After that, the load test can be done by inputting the command on the terminal: ```.\load-test.sh```
6. The result would be printed out in **load-test-result.txt** in the same directory
