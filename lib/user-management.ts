export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  subscription: SubscriptionTier
  createdAt: Date
  lastLogin: Date
  preferences: UserPreferences
  usage: UsageStats
}

export interface SubscriptionTier {
  id: string
  name: string
  price: number
  features: string[]
  limits: {
    searchesPerMonth: number
    reportsPerMonth: number
    apiCallsPerMonth: number
    teamMembers: number
  }
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  notifications: {
    email: boolean
    planningUpdates: boolean
    marketInsights: boolean
  }
  defaultReportTemplate: string
  savedSearches: SavedSearch[]
  favoriteProperties: string[]
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: Record<string, any>
  createdAt: Date
  lastRun: Date
  alertsEnabled: boolean
}

export interface UsageStats {
  searchesThisMonth: number
  reportsGenerated: number
  apiCallsThisMonth: number
  lastSearchDate: Date
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["5 searches/month", "Basic reports", "Email support"],
    limits: {
      searchesPerMonth: 5,
      reportsPerMonth: 2,
      apiCallsPerMonth: 0,
      teamMembers: 1,
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 49,
    features: ["100 searches/month", "Professional reports", "API access", "Priority support"],
    limits: {
      searchesPerMonth: 100,
      reportsPerMonth: 50,
      apiCallsPerMonth: 1000,
      teamMembers: 3,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    features: ["Unlimited searches", "Custom reports", "Full API access", "Dedicated support"],
    limits: {
      searchesPerMonth: -1, // unlimited
      reportsPerMonth: -1,
      apiCallsPerMonth: 10000,
      teamMembers: 10,
    },
  },
]

export class UserManager {
  private static instance: UserManager
  private users: Map<string, User> = new Map()

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager()
    }
    return UserManager.instance
  }

  createUser(email: string, name: string): User {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      subscription: subscriptionTiers[0], // Start with free tier
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: "system",
        notifications: {
          email: true,
          planningUpdates: true,
          marketInsights: false,
        },
        defaultReportTemplate: "executive",
        savedSearches: [],
        favoriteProperties: [],
      },
      usage: {
        searchesThisMonth: 0,
        reportsGenerated: 0,
        apiCallsThisMonth: 0,
        lastSearchDate: new Date(),
      },
    }

    this.users.set(user.id, user)
    return user
  }

  getUser(id: string): User | null {
    return this.users.get(id) || null
  }

  updateSubscription(userId: string, tierId: string): boolean {
    const user = this.users.get(userId)
    const tier = subscriptionTiers.find((t) => t.id === tierId)

    if (user && tier) {
      user.subscription = tier
      return true
    }
    return false
  }

  canPerformAction(userId: string, action: "search" | "report" | "api"): boolean {
    const user = this.users.get(userId)
    if (!user) return false

    const limits = user.subscription.limits

    switch (action) {
      case "search":
        return limits.searchesPerMonth === -1 || user.usage.searchesThisMonth < limits.searchesPerMonth
      case "report":
        return limits.reportsPerMonth === -1 || user.usage.reportsGenerated < limits.reportsPerMonth
      case "api":
        return limits.apiCallsPerMonth === -1 || user.usage.apiCallsThisMonth < limits.apiCallsPerMonth
      default:
        return false
    }
  }

  incrementUsage(userId: string, action: "search" | "report" | "api") {
    const user = this.users.get(userId)
    if (!user) return

    switch (action) {
      case "search":
        user.usage.searchesThisMonth++
        user.usage.lastSearchDate = new Date()
        break
      case "report":
        user.usage.reportsGenerated++
        break
      case "api":
        user.usage.apiCallsThisMonth++
        break
    }
  }

  saveSearch(userId: string, name: string, query: string, filters: Record<string, any>): SavedSearch {
    const user = this.users.get(userId)
    if (!user) throw new Error("User not found")

    const savedSearch: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      query,
      filters,
      createdAt: new Date(),
      lastRun: new Date(),
      alertsEnabled: false,
    }

    user.preferences.savedSearches.push(savedSearch)
    return savedSearch
  }

  addFavoriteProperty(userId: string, propertyId: string) {
    const user = this.users.get(userId)
    if (user && !user.preferences.favoriteProperties.includes(propertyId)) {
      user.preferences.favoriteProperties.push(propertyId)
    }
  }
}
