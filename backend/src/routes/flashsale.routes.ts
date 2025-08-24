import { Router } from 'express';
import { FlashSaleController } from '../controllers/flashsale.controller';
import { FlashSaleService } from '../services/flashsale.service';
import { RedisService } from '../services/redis.service';
import rateLimit from 'express-rate-limit';

// Create rate limiter for purchase attempts
const purchaseRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 purchase attempts per minute (more restrictive for flash sales)
  message: 'Too many purchase attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Add user-based rate limiting key
  keyGenerator: (req) => {
    const userId = req.body?.userId || 'anonymous';
    return `${req.ip}-${userId}`;
  }
});

// Additional rate limiting for general API access
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per 15 minutes
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const redisService = new RedisService();
const flashSaleService = new FlashSaleService(redisService);
const flashSaleController = new FlashSaleController(flashSaleService);

const router = Router();

// Routes
router.get('/status/:id', generalRateLimit, flashSaleController.getFlashSaleStatus);
router.post('/purchase', purchaseRateLimit, flashSaleController.attemptPurchase);
router.get('/user/:userId/purchase/:flashSaleId', generalRateLimit, flashSaleController.getUserPurchaseStatus);
router.get('/all', generalRateLimit, flashSaleController.getAllFlashSales);
router.post('/delete', generalRateLimit, flashSaleController.deleteFlashSale);
router.post('/deleteExpiredFlashSale', generalRateLimit, flashSaleController.deleteExpiredFlashSale);
router.get('/getLatestActiveFlashSale', generalRateLimit, flashSaleController.getLatestActiveFlashSale);

export { router as flashSaleRoutes, redisService };
