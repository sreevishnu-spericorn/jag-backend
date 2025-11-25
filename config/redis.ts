import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redis.on("connect", () => console.log("🚀 Redis Connected"));
redis.on("error", (err: any) => console.error("❌ Redis Error", err));

export default redis;
