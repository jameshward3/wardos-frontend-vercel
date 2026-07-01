const windowState = new Map<string, { count: number; startedAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = windowState.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    windowState.set(key, { count: 1, startedAt: now });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }

  current.count += 1;
  windowState.set(key, current);
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
  };
}
