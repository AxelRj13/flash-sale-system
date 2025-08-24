import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || '6379';
    const redisUrl = `redis://${redisHost}:${redisPort}`;
    
    this.client = createClient({
      url: redisUrl
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hGet(key, field) || null;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  // Atomic operations for stock management
  async decrementStock(key: string): Promise<number | null> {
    const script = `
      local current = redis.call('GET', KEYS[1])
      if current and tonumber(current) > 0 then
        return redis.call('DECR', KEYS[1])
      else
        return nil
      end
    `;
    return await this.client.eval(script, {
      keys: [key]
    }) as number | null;
  }

  // Atomic purchase operation to prevent race conditions
  async atomicPurchaseAttempt(stockKey: string, userPurchaseKey: string, purchaseId: string): Promise<{ success: boolean; newStock?: number; reason?: string }> {
    const script = `
      -- Check if user already purchased
      local existingPurchase = redis.call('GET', KEYS[2])
      if existingPurchase then
        return {0, -1, 'already_purchased'}
      end
      
      -- Check and decrement stock atomically
      local currentStock = redis.call('GET', KEYS[1])
      if not currentStock or tonumber(currentStock) <= 0 then
        return {0, -1, 'sold_out'}
      end
      
      -- Atomically decrement stock and mark user purchase
      local newStock = redis.call('DECR', KEYS[1])
      redis.call('SET', KEYS[2], KEYS[3])
      
      return {1, newStock, 'success'}
    `;
    
    const result = await this.client.eval(script, {
      keys: [stockKey, userPurchaseKey, purchaseId]
    }) as [number, number, string];
    
    const [success, newStock, reason] = result;
    
    if (success === 1) {
      return { success: true, newStock };
    } else {
      return { success: false, reason };
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }
}