import type { GeoJSON } from "geojson"
import { isInConservationArea } from "./conservation-area-api"

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
  totalChecks?: number
  passedChecks?: number
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
    baseUrl: "https://api.os.uk/search/places/v1",
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

// Advanced data fetcher with real API calls
export class AdvancedDataIntegration {
  private sources: DataSource[]

  constructor(sources: DataSource[] = DATA_SOURCES) {
    this.sources = sources.sort((a, b) => b.reliability - a.reliability)
  }

  async fetchPropertyData(address: string): Promise<PropertyData | null> {
    const cacheKey = `property:${address.toLowerCase()}`
    const cached = dataCache.get(cacheKey)
    if (cached) return cached

    for (const source of this.sources) {
      if (source.status !== "active") continue
      if (!rateLimiter.canMakeRequest(source.id, source.rateLimit)) continue

      try {
        const data = await this.fetchFromSource(source, address)
        if (data) {
          rateLimiter.recordRequest(source.id)
          dataCache.set(cacheKey, data, 30)
          return data
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
        continue
      }
    }

    return null
  }

  // --- Real API calls for OS Data and Planning Portal ---
  private async fetchFromSource(source: DataSource, address: string): Promise<PropertyData | null> {
    if (source.id === "os_data") {
      // Ordnance Survey Places API
      const apiKey = process.env.OS_PLACES_API_KEY
      if (!apiKey) throw new Error("Missing OS_PLACES_API_KEY")
      const url = `${source.baseUrl}/find?query=${encodeURIComponent(address)}&key=${apiKey}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("OS API error")
      const data = await res.json()
      if (!data.results || data.results.length === 0) return null

      const result = data.results[0].DPA
      const lat = parseFloat(result.LAT || result.LATITUDE)
      const lon = parseFloat(result.LNG || result.LONGITUDE)

      // --- Conservation Area Real-Time Check ---
      let constraints: PlanningConstraint[] = []
      const inConservation = await isInConservationArea(lat, lon)
      if (inConservation) {
        constraints.push({
          id: "conservation_area",
          type: "conservation_area",
          name: "Conservation Area",
          description: "This property is within a designated conservation area.",
          severity: "restrictive",
          confidence: 0.99,
          source: "ArcGIS Conservation Areas",
          lastVerified: new Date(),
          geometry: undefined,
          metadata: {},
        })
      }

      return {
        uprn: result.UPRN || "",
        address: result.ADDRESS || address,
        postcode: result.POSTCODE || "",
        localAuthority: result.LOCAL_CUSTODIAN_CODE_DESCRIPTION || "",
        coordinates: [lat, lon],
        propertyType: result.BLPU_STATE || "unknown",
        constraints,
        planningHistory: [],
        lastUpdated: new Date(),
      }
    }

    if (source.id === "planning_portal") {
      // Example: Planning Portal API (replace with real endpoint and params)
      const url = `${source.baseUrl}/applications?address=${encodeURIComponent(address)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Planning Portal API error")
      const data = await res.json()
      // Map data to PlanningApplication[]
      const planningHistory = (data.applications || []).map((app: any) => ({
        reference: app.reference,
        description: app.description,
        status: app.status,
        submittedDate: new Date(app.submittedDate),
        decisionDate: app.decisionDate ? new Date(app.decisionDate) : undefined,
        applicationType: app.applicationType,
        developmentType: app.developmentType,
        source: "Planning Portal",
      }))
      // You may want to merge this with OS data for full PropertyData
      return {
        uprn: "",
        address,
        postcode: "",
        localAuthority: "",
        coordinates: [0, 0],
        propertyType: "",
        constraints: [],
        planningHistory,
        lastUpdated: new Date(),
      }
    }

    // Add more real API integrations for other sources here...

    // Fallback: return null if no real integration
    return null
  }

  async getDataSourceStatus(): Promise<DataSource[]> {
    return this.sources.map((source) => ({
      ...source,
      status: Math.random() > 0.1 ? "active" : ("maintenance" as const),
    }))
  }

  async validateAddress(address: string): Promise<boolean> {
    const cacheKey = `validate:${address.toLowerCase()}`
    const cached = dataCache.get(cacheKey)
    if (cached !== null) return cached

    // Example: Use OS Places API for validation
    const apiKey = process.env.OS_PLACES_API_KEY
    if (!apiKey) return false
    const url = `https://api.os.uk/search/places/v1/find?query=${encodeURIComponent(address)}&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return false
    const data = await res.json()
    const isValid = data.results && data.results.length > 0
    dataCache.set(cacheKey, isValid, 60)
    return isValid
  }
}

export const advancedDataIntegration = new AdvancedDataIntegration()
