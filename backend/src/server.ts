import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { flashSaleRoutes, redisService } from './routes/flashsale.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { FlashSaleService } from './services/flashsale.service';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/flashsale', flashSaleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize sample flash sale data
async function initializeSampleData() {
  try {
    await redisService.connect();
    
    const flashSaleService = new FlashSaleService(redisService);
    
    // Display server timezone information
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = -new Date().getTimezoneOffset() / 60;
    const timezoneString = timezoneOffset >= 0 ? `UTC+${timezoneOffset}` : `UTC${timezoneOffset}`;
    console.log(`using timezone: ${localTimezone} (${timezoneString})`);
    
    // Check if sample data already exists
    const existingFlashSale = await redisService.get('flashsale:sample-sale-1');
    
    if (!existingFlashSale) {
      // Create a sample flash sale that starts 1 minute from now (using local timezone)
      const now = new Date();
      
      // Use local machine timezone - no timezone conversion needed
      const startTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now in local time
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now in local time

      await flashSaleService.createFlashSale({
        productName: 'LIMITED EDITION ITEM',
        totalStock: 100,
        startTime,
        endTime,
        maxPurchasePerUser: 1
      });
      
      // Get local timezone information
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneOffset = -new Date().getTimezoneOffset() / 60; // Convert minutes to hours
      const timezoneString = timezoneOffset >= 0 ? `UTC+${timezoneOffset}` : `UTC${timezoneOffset}`;
      console.log('Sample flash sale created successfully');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await redisService.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`running on port ${PORT}`);
  initializeSampleData();
});

export default app;
