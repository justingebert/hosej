import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

const redisUrl = env.UPSTASH_REDIS_REST_URL;
const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

export const rateLimitEnabled = Boolean(redisUrl && redisToken);

const redis = rateLimitEnabled ? new Redis({ url: redisUrl!, token: redisToken! }) : null;

function createLimiter(prefix: string, tokens: number, windowSeconds: number) {
    if (!redis) return null;
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
        prefix: `ratelimit:${prefix}`,
    });
}

/** 100 req / 60s — broad middleware protection */
export const generalLimiter = createLimiter("general", 100, 60);

/** 10 req / 60s — auth & device registration */
export const authLimiter = createLimiter("auth", 10, 60);

/** 20 req / 60s — voting endpoints */
export const voteLimiter = createLimiter("vote", 20, 60);

/** 10 req / 60s — image uploads */
export const uploadLimiter = createLimiter("upload", 10, 60);
