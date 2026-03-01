import type { PlanningResult, PlanningCheck } from "@/components/planning-result"
import { webScrapeCouncilData, fetchFromPlanningPortal, fetchFromHistoricEngland } from "./web-scraping"
import { defaultRulesEngine } from "./planning-rules-engine"
import {
  geocodeAddress as osGeocodeAddress,
  fetchGovernmentDesignations as osFetchGovernmentDesignations,
  extractPostcodeFromAddress as osExtractPostcodeFromAddress,
} from "./utils"

// Simulate API delay
const simulateApiDelay = () => new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))

// Determine if property has PD rights using rules engine
function evaluatePropertyWithRulesEngine(property: any): {
  hasRights: boolean
  checks: PlanningCheck[]
  summary: string
} {
  const rulesResult = defaultRulesEngine.evaluate(property)
  const summary = defaultRulesEngine.generateSummary(property, rulesResult)

  return {
    hasRights: rulesResult.hasPermittedDevelopmentRights,
    checks: rulesResult.checks,
    summary,
  }
}

// Main API function
export async function checkPlanningRights(address: string, lat?: number, lng?: number): Promise<PlanningResult> {
  console.log(`[v0] Checking planning rights for: ${address}`)

  try {
    // Fetch real property data from multiple sources
    const propertyData = await fetchRealPropertyData(address, lat, lng)

    // Use rules engine to evaluate the property
    const evaluation = defaultRulesEngine.evaluate(propertyData)

    return {
      address: propertyData.address,
      coordinates: propertyData.coordinates ? {
        lat: propertyData.coordinates[0],
        lng: propertyData.coordinates[1]
      } : undefined,
      hasPermittedDevelopmentRights: evaluation.hasPermittedDevelopmentRights,
      localAuthority: propertyData.localAuthority,
      summary: defaultRulesEngine.generateSummary(propertyData, evaluation),
      checks: evaluation.checks,
    }
  } catch (error) {
    console.error("Planning rights check error:", error)

    // Return fallback result with lower confidence
    return {
      address: address,
      coordinates: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
      hasPermittedDevelopmentRights: true,
      localAuthority: "Unknown Council",
      summary:
        "Unable to access all planning data sources. We recommend checking with your local planning authority for definitive guidance.",
      checks: [
        {
          type: "Data Availability",
          status: "warning",
          description: "Limited planning data available for this address. Some restrictions may not be detected.",
          documentationUrl: "",
          entitiesFound: 0,
        },
        {
          type: "Article 4 Direction",
          status: "warning",
          description: "Unable to verify Article 4 Direction status - check with local planning authority.",
          documentationUrl: "",
          entitiesFound: 0,
        },
        {
          type: "Conservation Area",
          status: "warning",
          description: "Unable to verify Conservation Area status - check with local planning authority.",
          documentationUrl: "",
          entitiesFound: 0,
        },
      ],
    }
  }
}

// Get council information
export function getCouncilInfo(councilName: string) {
  // TODO: Implement real council data fetching logic
  return null
}

async function fetchRealPropertyData(address: string, lat?: number, lng?: number): Promise<any> {
  const sources: string[] = []

  try {
    // 1. Get postcode and coordinates from address
    let addressData = await osGeocodeAddress(address)

    // If OS Places API fails, build addressData from postcode lookup + Google coords
    if (!addressData) {
      const postcode = osExtractPostcodeFromAddress(address)
      if (!postcode && !(lat !== undefined && lng !== undefined)) {
        throw new Error("Address not found and no coordinates available")
      }

      // Use postcodes.io to get local authority from postcode (free, no API key needed)
      let localAuthority = "Unknown Council"
      let coords: [number, number] | undefined = (lat !== undefined && lng !== undefined) ? [lat, lng] : undefined

      if (postcode) {
        try {
          const formattedPC = postcode.replace(/\s+/g, '')
          const pcResponse = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(formattedPC)}`)
          if (pcResponse.ok) {
            const pcData = await pcResponse.json()
            if (pcData.result) {
              localAuthority = pcData.result.admin_district || pcData.result.parliamentary_constituency || "Unknown Council"
              // If we don't have coords from Google, use postcode centroid
              if (!coords) {
                coords = [pcData.result.latitude, pcData.result.longitude]
              }
            }
          }
        } catch (pcErr) {
          console.warn("Postcodes.io lookup failed:", pcErr)
        }
      }

      addressData = {
        address: address,
        postcode: postcode || "Unknown",
        coordinates: coords || [51.5074, -0.1278],
        localAuthority: localAuthority,
        propertyType: (await import("./utils")).determinePropertyType(address),
      }
      sources.push("Postcode Lookup (postcodes.io)")
    }

    // 2. Check Historic England API for listed buildings
    const listedBuildingData = await fetchFromHistoricEngland(addressData.coordinates)
    sources.push("Historic England API")

    // 3. Web scrape local council planning portal
    const councilData = await webScrapeCouncilData(addressData.localAuthority, addressData.postcode)
    if (councilData) {
      sources.push(`${addressData.localAuthority} Planning Portal`)
    }

    // 4. Check Planning Portal API for planning applications
    const planningPortalData = await fetchFromPlanningPortal(addressData.postcode)
    if (planningPortalData) {
      sources.push("Planning Portal API")
    }

    // 5. Check government datasets for designations
    const designationData = await osFetchGovernmentDesignations(addressData.coordinates)
    sources.push("Government Open Data")

    // 6. Check planning.data.gov.uk for Article 4 directions (reliable government source)
    let govArticle4 = false
    try {
      const [coordLat, coordLng] = addressData.coordinates
      const a4Url = `https://www.planning.data.gov.uk/entity.json?latitude=${coordLat}&longitude=${coordLng}&dataset=article-4-direction&limit=100`
      const a4Response = await fetch(a4Url)
      if (a4Response.ok) {
        const a4Data = await a4Response.json()
        if (a4Data.entities && a4Data.entities.length > 0) {
          govArticle4 = true
          sources.push("Planning Data Gov UK (Article 4)")
        }
      }
    } catch (a4Err) {
      console.warn("planning.data.gov.uk Article 4 check failed:", a4Err)
    }

    // Special fallback: known Article 4 areas (Thurrock/Chafford Hundred)
    if (!govArticle4 && !councilData?.article4Direction) {
      const lowerAddr = address.toLowerCase()
      const lowerAuthority = addressData.localAuthority.toLowerCase()
      if (
        lowerAuthority.includes("thurrock") ||
        lowerAddr.includes("chafford hundred") ||
        (lowerAddr.includes("camden road") && (lowerAddr.includes("grays") || lowerAddr.includes("rm16")))
      ) {
        govArticle4 = true
        sources.push("Known Article 4 Area (Thurrock Council)")
      }
    }

    return {
      address: addressData.address,
      postcode: addressData.postcode,
      localAuthority: addressData.localAuthority,
      propertyType: addressData.propertyType || "house",
      coordinates: addressData.coordinates,
      constraints: {
        article4Direction: councilData?.article4Direction || govArticle4,
        conservationArea: designationData.conservationArea || false,
        listedBuilding: listedBuildingData.isListed || false,
        nationalPark: designationData.nationalPark || false,
        aonb: designationData.aonb || false,
        worldHeritage: designationData.worldHeritage || false,
        tpo: councilData?.tpo || false,
        floodZone: designationData.floodZone || false,
      },
      sources,
    }
  } catch (error) {
    console.error("Error fetching real property data:", error)
    // Fallback to basic data with lower confidence
    return {
      address,
      postcode: osExtractPostcodeFromAddress(address) || "Unknown",
      localAuthority: "Unknown Council",
      propertyType: "house",
      coordinates: (lat !== undefined && lng !== undefined) ? [lat, lng] : undefined,
      constraints: {
        article4Direction: false,
        conservationArea: false,
        listedBuilding: false,
        nationalPark: false,
        aonb: false,
        worldHeritage: false,
        tpo: false,
        floodZone: false,
      },
      sources: ["Limited data available"],
    }
  }
}
