const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'dumb'
];

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // messages per window (increased for better UX)

const messageTimestamps = new Map<string, number[]>();

export function filterProfanity(text: string): string {
  let filtered = text;

  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
  }

  return filtered;
}

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
  windowMs: number;
} {
  const now = Date.now();
  const timestamps = messageTimestamps.get(userId) || [];

  const recentTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    const oldest = Math.min(...recentTimestamps);
    const resetMs = Math.max(0, RATE_LIMIT_WINDOW - (now - oldest));
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW,
    };
  }

  recentTimestamps.push(now);
  messageTimestamps.set(userId, recentTimestamps);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - recentTimestamps.length,
    resetMs: 0,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW,
  };
}

export function generateChatTitle(firstMessage: string): string {
  const truncated = firstMessage.substring(0, 50);
  return truncated.length < firstMessage.length ? `${truncated}...` : truncated;
}
