import Redis from "ioredis"

export const redixClient = new Redis(process.env.REDIS_URL as string);

