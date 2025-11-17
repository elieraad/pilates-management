import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "redis";

const redis = getRedisClient();

function getRedisClient() {
  if (process.env.NODE_ENV === "production") {
    return Redis.fromEnv();
  }
  // fallback to local Redis client for dev
  const client = createClient({
    url: process.env.KV_URL!,
  });
  client.connect();
  return client;
}

// Rate limit based on IP address
export async function rateLimit(
  request: NextRequest,
  options: { limit: number; window: number; identifier?: string }
) {
  const ip = request.ip || "anonymous";
  const identifier = options.identifier || ip;
  const key = `rate-limit:${identifier}`;

  // Get current count
  const count = await redis.incr(key);

  // Set expiration on first request
  if (count === 1) {
    await redis.expire(key, options.window);
  }

  // Check if over limit
  if (count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429 }
    );
  }

  return null; // No rate limit hit
}
