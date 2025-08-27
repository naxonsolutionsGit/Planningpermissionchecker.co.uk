import type { GeoJSON } from "geojson"

export interface DataSource {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  rateLimit: number // requests per minute
  reliability: number // 0-1 score
  lastUpdated: Date
  status: "active" | "maintenance" | "error"
}

export interface PlanningConstraint {
  id: string
  type:
    | "conservation_area"
    | "listed_building"
    | "article_4"
    | "national_park"
    | "green_belt"
    | "flood_zone"
    | "tree_preservation"
  name: string
  description: string
  severity: "blocking" | "restrictive" | "advisory"
  confidence: number
  source: string
  lastVerified: Date
  geometry?: GeoJSON.Geometry
  metadata: Record<string, any>
}

export interface PropertyData {
  uprn: string
  address: string
  postcode: string
  localAuthority: string
  coordinates: [number, number]
  propertyType: string
  constraints: PlanningConstraint[]
  planningHistory: PlanningApplication[]
  lastUpdated: Date
}

export interface PlanningApplication {
  reference: string
  description: string
  status: "approved" | "refused" | "pending" | "withdrawn"
  submittedDate: Date
  decisionDate?: Date
  applicationType: string
  developmentType: string
  source: string
}

// Data source configurations
export const DATA_SOURCES: DataSource[] = [
  {
    id: "gov_uk_councils",
    name: "GOV.UK Find Local Council",
    baseUrl: "https://www.gov.uk/api/local-authorities",
    rateLimit: 60,
    reliability: 0.95,
    lastUpdated: new Date(),
    status: "active",
  },
  {
    id: "planning_portal",
    name: "Planning Portal API",
    baseUrl: "https://www.planningportal.co.uk/api/v1",
    rateLimit: 100,
    reliability: 0.9,
    lastUpdated: new Date(),
    status: "active",
  },
  {
    id: "nimbus_maps",
    name: "Nimbus Maps Planning Data",
    baseUrl: "https://api.nimbusmaps.co.uk/v2",
    rateLimit: 200,
    reliability: 0.85,
    lastUpdated: new Date(),
    status: "active",
  },
  {
    id: "landtech",
    name: "LandTech Intelligence",
    baseUrl: "https://api.land.tech/v1",
    rateLimit: 150,
    reliability: 0.88,
    lastUpdated: new Date(),
    status: "active",
  },
  {
    id: "os_data",
    name: "Ordnance Survey Data Hub",
    baseUrl: "https://api.os.uk/features/v1",
    rateLimit: 600,
    reliability: 0.98,
    lastUpdated: new Date(),
    status: "active",
  },
]

// Cache management
class DataCache {
  private cache = new Map<string, { data: any; expires: Date }>()

  set(key: string, data: any, ttlMinutes = 60) {
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000)
    this.cache.set(key, { data, expires })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (cached.expires < new Date()) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear() {
    this.cache.clear()
  }
}

export const dataCache = new DataCache()

// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>()

  canMakeRequest(sourceId: string, limit: number): boolean {
    const now = Date.now()
    const windowStart = now - 60000 // 1 minute window

    if (!this.requests.has(sourceId)) {
      this.requests.set(sourceId, [])
    }

    const sourceRequests = this.requests.get(sourceId)!
    // Remove old requests outside the window
    const recentRequests = sourceRequests.filter((time) => time > windowStart)
    this.requests.set(sourceId, recentRequests)

    return recentRequests.length < limit
  }

  recordRequest(sourceId: string) {
    if (!this.requests.has(sourceId)) {
      this.requests.set(sourceId, [])
    }
    this.requests.get(sourceId)!.push(Date.now())
  }
}

export const rateLimiter = new RateLimiter()

// Advanced data fetcher with fallbacks
export class AdvancedDataIntegration {
  private sources: DataSource[]

  constructor(sources: DataSource[] = DATA_SOURCES) {
    this.sources = sources.sort((a, b) => b.reliability - a.reliability)
  }

  async fetchPropertyData(address: string): Promise<PropertyData | null> {
    const cacheKey = `property:${address.toLowerCase()}`
    const cached = dataCache.get(cacheKey)
    if (cached) return cached

    // Try multiple sources in order of reliability
    for (const source of this.sources) {
      if (source.status !== "active") continue
      if (!rateLimiter.canMakeRequest(source.id, source.rateLimit)) continue

      try {
        const data = await this.fetchFromSource(source, address)
        if (data) {
          rateLimiter.recordRequest(source.id)
          dataCache.set(cacheKey, data, 30) // Cache for 30 minutes
          return data
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
        continue
      }
    }

    return null
  }

  private async fetchFromSource(source: DataSource, address: string): Promise<PropertyData | null> {
    // Mock implementation - in real app, this would make actual API calls
    console.log(`[v0] Fetching from ${source.name} for address: ${address}`)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

    // Return enhanced mock data based on source
    return this.generateEnhancedMockData(address, source)
  }

  private generateEnhancedMockData(address: string, source: DataSource): PropertyData {
    const mockConstraints: PlanningConstraint[] = []

    // Generate realistic constraints based on address
    if (address.toLowerCase().includes("bath")) {
      mockConstraints.push({
        id: "ca_bath_001",
        type: "conservation_area",
        name: "Bath City Centre Conservation Area",
        description: "Historic city centre with strict design controls",
        severity: "restrictive",
        confidence: 0.95,
        source: source.name,
        lastVerified: new Date(),
        metadata: {
          designation_date: "1987-03-15",
          authority: "Bath and North East Somerset Council",
        },
      })
    }

    if (address.toLowerCase().includes("london")) {
      mockConstraints.push({
        id: "a4_london_001",
        type: "article_4",
        name: "Article 4 Direction - Single Dwelling Houses",
        description: "Removes permitted development rights for extensions",
        severity: "blocking",
        confidence: 0.88,
        source: source.name,
        lastVerified: new Date(),
        metadata: {
          direction_date: "2019-05-30",
          authority: "Greater London Authority",
        },
      })
    }

    return {
      uprn: `${Math.floor(Math.random() * 1000000000)}`,
      address,
      postcode: this.extractPostcode(address) || "SW1A 1AA",
      localAuthority: this.getLocalAuthority(address),
      coordinates: [51.5074, -0.1278], // Default to London
      propertyType: "residential",
      constraints: mockConstraints,
      planningHistory: this.generatePlanningHistory(),
      lastUpdated: new Date(),
    }
  }

  private extractPostcode(address: string): string | null {
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/gi
    const match = address.match(postcodeRegex)
    return match ? match[0] : null
  }

  private getLocalAuthority(address: string): string {
    if (address.toLowerCase().includes("bath")) return "Bath and North East Somerset Council"
    if (address.toLowerCase().includes("london")) return "Greater London Authority"
    if (address.toLowerCase().includes("manchester")) return "Manchester City Council"
    return "Local Planning Authority"
  }

  private generatePlanningHistory(): PlanningApplication[] {
    return [
      {
        reference: `${new Date().getFullYear()}/0${Math.floor(Math.random() * 9999)}`,
        description: "Single storey rear extension",
        status: "approved",
        submittedDate: new Date(2023, 5, 15),
        decisionDate: new Date(2023, 7, 20),
        applicationType: "householder",
        developmentType: "extension",
        source: "Planning Portal",
      },
    ]
  }

  async getDataSourceStatus(): Promise<DataSource[]> {
    return this.sources.map((source) => ({
      ...source,
      status: Math.random() > 0.1 ? "active" : ("maintenance" as const),
    }))
  }

  async validateAddress(address: string): Promise<boolean> {
    // Enhanced address validation using multiple sources
    const cacheKey = `validate:${address.toLowerCase()}`
    const cached = dataCache.get(cacheKey)
    if (cached !== null) return cached

    // Mock validation - in real app, use OS Places API or similar
    const isValid = address.length > 10 && /\d/.test(address)
    dataCache.set(cacheKey, isValid, 60)

    return isValid
  }
}

export const advancedDataIntegration = new AdvancedDataIntegration()
