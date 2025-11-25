import redis from "../../config/redis.ts";

export const safeRedisGet = async (key: string) => {
    try {
       return await redis.get(key);
    } catch (err) {
       console.warn("⚠ Redis GET failed:", err);
       return null;
    }
 };
 
 export const safeRedisSet = async (key: string, value: any, expireSec = 60) => {
    try {
       await redis.set(key, JSON.stringify(value), "EX", expireSec);
    } catch (err) {
       console.warn("⚠ Redis SET failed:", err);
    }
 };
 
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