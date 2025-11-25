import redis from "../../config/redis.ts";

/**
 * Safely retrieves a value from Redis cache.
 */
export const safeRedisGet = async (key: string) => {
    try {
       return await redis.get(key);
    } catch (err) {
       console.warn("⚠ Redis GET failed:", err);
       return null;
    }
 };
 
 /**
  * Safely sets a value in Redis cache with an expiration time.
  */
 export const safeRedisSet = async (key: string, value: any, expireSec = 60) => {
    try {
       // Serialize the value before storing
       await redis.set(key, JSON.stringify(value), "EX", expireSec);
    } catch (err) {
       console.warn("⚠ Redis SET failed:", err);
    }
 };
 
 /**
  * Safely deletes all keys matching a pattern in Redis (used for cache invalidation).
  */
 export const safeRedisDelPattern = async (pattern: string) => {
    try {
       const keys = await redis.keys(pattern);
       if (keys.length) {
          await redis.del(...keys);
          console.log(`♻ Redis keys cleared for pattern: ${pattern}`);
       }
    } catch (err) {
       console.warn("⚠ Redis DEL failed:", err);
    }
 };