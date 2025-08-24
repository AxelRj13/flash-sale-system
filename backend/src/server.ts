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
    
    // Delete all existing flash sales before creating a new one
    try {
      const existingFlashSales = await flashSaleService.getAllFlashSales();
      if (existingFlashSales.length > 0) {
        console.log(`Deleting ${existingFlashSales.length} existing flash sales...`);
        for (const flashSale of existingFlashSales) {
          await flashSaleService.deleteFlashSale(flashSale.id);
          console.log(`Deleted flash sale: ${flashSale.id} (${flashSale.productName})`);
        }
        console.log('All existing flash sales deleted successfully');
      }
    } catch (deleteError) {
      console.error('Error deleting existing flash sales:', deleteError);
    }
    
    // Create new flash sale
    const now = new Date();
    
    // Use local machine timezone - no timezone conversion needed
    const startTime = new Date(now.getTime());
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);

    const newFlashSale = await flashSaleService.createFlashSale({
      productName: 'LIMITED EDITION ITEM',
      totalStock: 50,
      startTime,
      endTime,
      maxPurchasePerUser: 1 // currently, changing this value won't affect anything. One user only allowed to purchase 1 product
    });
    
    console.log(`New flash sale created successfully: ${newFlashSale.id} (${newFlashSale.productName})`);
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
