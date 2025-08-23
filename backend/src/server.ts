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
    
    // Check if sample data already exists
    const existingFlashSale = await redisService.get('flashsale:sample-sale-1');
    
    if (!existingFlashSale) {
      // Create a sample flash sale that starts 1 minute from now
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      
      await flashSaleService.createFlashSale({
        productName: 'Limited Edition Gaming Headset',
        totalStock: 100,
        startTime,
        endTime,
        maxPurchasePerUser: 1
      });
      
      console.log('Sample flash sale created successfully');
      console.log(`Sale starts at: ${startTime.toISOString()}`);
      console.log(`Sale ends at: ${endTime.toISOString()}`);
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Schedule a cron job to update flash sale statuses every minute
cron.schedule('* * * * *', async () => {
  // This would update statuses in a real implementation
  // For now, status is calculated on-demand
});

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
  console.log(`🚀 Flash Sale Server running on port ${PORT}`);
  initializeSampleData();
});

export default app;
