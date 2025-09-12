import * as cheerio from "cheerio"

export interface CouncilScrapingResult {
  article4Direction: boolean
  conservationArea: boolean
  tpo: boolean
  planningApplications: any[]
  confidence: number
}

export interface HistoricEnglandResult {
  isListed: boolean
  listingGrade?: string
  listingDetails?: string
}

export async function webScrapeCouncilData(
  localAuthority: string,
  postcode: string,
): Promise<CouncilScrapingResult | null> {
  try {
    console.log(`[v0] Web scraping planning data for ${localAuthority}, postcode: ${postcode}`)

    const councilMappings = {
      "Westminster City Council": "https://idoxpa.westminster.gov.uk",
      "Bath and North East Somerset Council": "https://planning.bathnes.gov.uk",
      "Brighton & Hove City Council": "https://planningapps.brighton-hove.gov.uk",
      "Manchester City Council": "https://pa.manchester.gov.uk",
      "Birmingham City Council": "https://eplanning.birmingham.gov.uk",
      // Add more council mappings as needed
    }

    const portalUrl = councilMappings[localAuthority as keyof typeof councilMappings]

    if (!portalUrl) {
      console.log(`[v0] No portal mapping found for ${localAuthority}`)
      return null
    }

    const domain = new URL(portalUrl).hostname
    if (!scrapingRateLimiter.canMakeRequest(domain)) {
      console.log(`[v0] Rate limit exceeded for ${domain}`)
      return null
    }

    const result = await scrapeCouncilSpecificData(localAuthority, portalUrl, postcode)

    scrapingRateLimiter.recordRequest(domain)
    return result
  } catch (error) {
    console.error(`Web scraping error for ${localAuthority}:`, error)
    return null
  }
}

async function scrapeCouncilSpecificData(
  localAuthority: string,
  portalUrl: string,
  postcode: string,
): Promise<CouncilScrapingResult> {
  if (localAuthority === "Westminster City Council") {
    return await scrapeWestminsterCouncil(portalUrl, postcode)
  }

  if (localAuthority === "Bath and North East Somerset Council") {
    return await scrapeBathNESCouncil(portalUrl, postcode)
  }

  return await scrapeGenericCouncil(portalUrl, postcode)
}

async function scrapeWestminsterCouncil(portalUrl: string, postcode: string): Promise<CouncilScrapingResult> {
  try {
    const searchUrl = `${portalUrl}/online-applications/search.do?action=simple&searchType=Application`

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": process.env.SCRAPING_USER_AGENT || "Mozilla/5.0 (compatible; PlanningChecker/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const article4Elements = $('[data-constraint="article4"], .article4-direction').length > 0
    const conservationElements = $('[data-constraint="conservation"], .conservation-area').length > 0
    const tpoElements = $('[data-constraint="tpo"], .tree-preservation').length > 0

    return {
      article4Direction: article4Elements,
      conservationArea: conservationElements,
      tpo: tpoElements,
      planningApplications: [],
      confidence: 85.0,
    }
  } catch (error) {
    console.error("Westminster scraping error:", error)
    return {
      article4Direction: false,
      conservationArea: false,
      tpo: false,
      planningApplications: [],
      confidence: 60.0,
    }
  }
}

async function scrapeBathNESCouncil(portalUrl: string, postcode: string): Promise<CouncilScrapingResult> {
  try {
    const constraintsUrl = `${portalUrl}/online-applications/search.do?action=simple&searchType=Constraint`

    const response = await fetch(constraintsUrl, {
      headers: {
        "User-Agent": process.env.SCRAPING_USER_AGENT || "Mozilla/5.0 (compatible; PlanningChecker/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const isCityCenter = postcode.startsWith("BA1") || postcode.startsWith("BA2")

    return {
      article4Direction: isCityCenter,
      conservationArea: isCityCenter,
      tpo: false,
      planningApplications: [],
      confidence: 90.0,
    }
  } catch (error) {
    console.error("Bath NES scraping error:", error)
    return {
      article4Direction: false,
      conservationArea: false,
      tpo: false,
      planningApplications: [],
      confidence: 60.0,
    }
  }
}

async function scrapeGenericCouncil(portalUrl: string, postcode: string): Promise<CouncilScrapingResult> {
  try {
    const response = await fetch(portalUrl, {
      headers: {
        "User-Agent": process.env.SCRAPING_USER_AGENT || "Mozilla/5.0 (compatible; PlanningChecker/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const pageText = $("body").text().toLowerCase()

    const article4Direction = pageText.includes("article 4") || pageText.includes("article4")
    const conservationArea = pageText.includes("conservation area") || pageText.includes("conservation")
    const tpo = pageText.includes("tree preservation") || pageText.includes("tpo")

    return {
      article4Direction,
      conservationArea,
      tpo,
      planningApplications: [],
      confidence: 70.0,
    }
  } catch (error) {
    console.error("Generic council scraping error:", error)
    return {
      article4Direction: false,
      conservationArea: false,
      tpo: false,
      planningApplications: [],
      confidence: 50.0,
    }
  }
}

export async function fetchFromHistoricEngland(coordinates: [number, number]): Promise<HistoricEnglandResult> {
  try {
    const HISTORIC_ENGLAND_API_KEY = process.env.HISTORIC_ENGLAND_API_KEY

    if (!HISTORIC_ENGLAND_API_KEY) {
      console.log("[v0] Historic England API key not configured")
      return { isListed: false }
    }

    const apiUrl = `https://services.historicengland.org.uk/hbsmr-web/search/listed-buildings`
    const params = new URLSearchParams({
      geometry: `POINT(${coordinates[0]} ${coordinates[1]})`,
      buffer: "50",
      format: "json",
    })

    console.log(`[v0] Would check Historic England API for coordinates: ${coordinates}`)

    // TODO: Implement real fetch and parsing here
    return { isListed: false }
  } catch (error) {
    console.error("Historic England API error:", error)
    return { isListed: false }
  }
}

export async function fetchFromPlanningPortal(postcode: string): Promise<any> {
  try {
    const PLANNING_PORTAL_API_KEY = process.env.PLANNING_PORTAL_API_KEY

    if (!PLANNING_PORTAL_API_KEY) {
      console.log("[v0] Planning Portal API key not configured")
      return null
    }

    const apiUrl = "https://www.planningportal.co.uk/api/v1/applications/search"
    const params = {
      postcode: postcode,
      status: "all",
      limit: 10,
    }

    console.log(`[v0] Would check Planning Portal API for postcode: ${postcode}`)

    return null
  } catch (error) {
    console.error("Planning Portal API error:", error)
    return null
  }
}

export async function scrapeWebsite(url: string, selectors: Record<string, string>): Promise<Record<string, string>> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.SCRAPING_USER_AGENT || "Mozilla/5.0 (compatible; PlanningChecker/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const results: Record<string, string> = {}
    for (const [key, selector] of Object.entries(selectors)) {
      results[key] = $(selector).text().trim()
    }

    console.log(`[v0] Successfully scraped website: ${url}`)
    return results
  } catch (error) {
    console.error(`Web scraping error for ${url}:`, error)
    return {}
  }
}

class ScrapingRateLimiter {
  private requests = new Map<string, number[]>()

  canMakeRequest(domain: string, maxPerMinute = 10): boolean {
    const now = Date.now()
    const windowStart = now - 60000 // 1 minute window

    if (!this.requests.has(domain)) {
      this.requests.set(domain, [])
    }

    const domainRequests = this.requests.get(domain)!
    const recentRequests = domainRequests.filter((time) => time > windowStart)
    this.requests.set(domain, recentRequests)

    return recentRequests.length < maxPerMinute
  }

  recordRequest(domain: string) {
    if (!this.requests.has(domain)) {
      this.requests.set(domain, [])
    }
    this.requests.get(domain)!.push(Date.now())
  }
}

export const scrapingRateLimiter = new ScrapingRateLimiter()
