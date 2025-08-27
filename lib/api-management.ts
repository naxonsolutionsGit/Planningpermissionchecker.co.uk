import type { NextRequest } from "next/server"

export interface APIKey {
  id: string
  key: string
  name: string
  userId: string
  permissions: string[]
  rateLimit: number
  usageCount: number
  lastUsed: Date
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
}

export interface APIUsage {
  keyId: string
  endpoint: string
  timestamp: Date
  responseTime: number
  statusCode: number
  requestSize: number
  responseSize: number
}

export class APIManager {
  private static instance: APIManager
  private apiKeys: Map<string, APIKey> = new Map()
  private usageLog: APIUsage[] = []
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map()

  static getInstance(): APIManager {
    if (!APIManager.instance) {
      APIManager.instance = new APIManager()
    }
    return APIManager.instance
  }

  // API Key Management
  generateAPIKey(userId: string, name: string, permissions: string[], rateLimit = 1000): APIKey {
    const key = `pk_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`
    const apiKey: APIKey = {
      id: Math.random().toString(36).substr(2, 9),
      key,
      name,
      userId,
      permissions,
      rateLimit,
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
      isActive: true,
    }

    this.apiKeys.set(key, apiKey)
    return apiKey
  }

  validateAPIKey(key: string): APIKey | null {
    const apiKey = this.apiKeys.get(key)
    if (!apiKey || !apiKey.isActive) return null
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
    return apiKey
  }

  // Rate Limiting
  checkRateLimit(apiKey: APIKey): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour window
    const resetTime = Math.ceil(now / windowMs) * windowMs

    const cacheKey = `${apiKey.key}_${Math.floor(now / windowMs)}`
    const current = this.rateLimitCache.get(cacheKey) || { count: 0, resetTime }

    if (current.count >= apiKey.rateLimit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    this.rateLimitCache.set(cacheKey, current)

    return {
      allowed: true,
      remaining: apiKey.rateLimit - current.count,
      resetTime: current.resetTime,
    }
  }

  // Usage Tracking
  logAPIUsage(
    keyId: string,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    requestSize: number,
    responseSize: number,
  ) {
    this.usageLog.push({
      keyId,
      endpoint,
      timestamp: new Date(),
      responseTime,
      statusCode,
      requestSize,
      responseSize,
    })

    // Update API key usage count
    const apiKey = Array.from(this.apiKeys.values()).find((k) => k.id === keyId)
    if (apiKey) {
      apiKey.usageCount++
      apiKey.lastUsed = new Date()
    }
  }

  // Analytics
  getUsageAnalytics(keyId?: string, timeRange?: { start: Date; end: Date }) {
    let filteredUsage = this.usageLog

    if (keyId) {
      filteredUsage = filteredUsage.filter((u) => u.keyId === keyId)
    }

    if (timeRange) {
      filteredUsage = filteredUsage.filter((u) => u.timestamp >= timeRange.start && u.timestamp <= timeRange.end)
    }

    return {
      totalRequests: filteredUsage.length,
      averageResponseTime: filteredUsage.reduce((sum, u) => sum + u.responseTime, 0) / filteredUsage.length || 0,
      errorRate: filteredUsage.filter((u) => u.statusCode >= 400).length / filteredUsage.length || 0,
      topEndpoints: this.getTopEndpoints(filteredUsage),
      requestsOverTime: this.getRequestsOverTime(filteredUsage),
    }
  }

  private getTopEndpoints(usage: APIUsage[]) {
    const endpointCounts = usage.reduce(
      (acc, u) => {
        acc[u.endpoint] = (acc[u.endpoint] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  }

  private getRequestsOverTime(usage: APIUsage[]) {
    const hourlyData = usage.reduce(
      (acc, u) => {
        const hour = new Date(u.timestamp).toISOString().slice(0, 13) + ":00:00.000Z"
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(hourlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count }))
  }

  // Webhook Management
  registerWebhook(userId: string, url: string, events: string[]) {
    // Implementation for webhook registration
    return {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      url,
      events,
      secret: Math.random().toString(36).substr(2, 16),
      isActive: true,
      createdAt: new Date(),
    }
  }
}

// Middleware for API authentication and rate limiting
export async function apiMiddleware(request: NextRequest, endpoint: string) {
  const apiKey = request.headers.get("x-api-key")
  const startTime = Date.now()

  if (!apiKey) {
    return {
      error: "API key required",
      status: 401,
      headers: {},
    }
  }

  const manager = APIManager.getInstance()
  const validKey = manager.validateAPIKey(apiKey)

  if (!validKey) {
    return {
      error: "Invalid API key",
      status: 401,
      headers: {},
    }
  }

  const rateLimit = manager.checkRateLimit(validKey)
  const headers = {
    "X-RateLimit-Limit": validKey.rateLimit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
  }

  if (!rateLimit.allowed) {
    return {
      error: "Rate limit exceeded",
      status: 429,
      headers,
    }
  }

  // Log the API usage
  const responseTime = Date.now() - startTime
  manager.logAPIUsage(validKey.id, endpoint, responseTime, 200, 0, 0)

  return {
    apiKey: validKey,
    headers,
    success: true,
  }
}
