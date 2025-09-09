import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface AddressData {
  address: string
  postcode: string
  coordinates: [number, number]
  localAuthority: string
  propertyType?: string
}

export interface GovernmentDesignations {
  conservationArea: boolean
  nationalPark: boolean
  aonb: boolean
  worldHeritage: boolean
  floodZone: boolean
}

export async function geocodeAddress(address: string): Promise<AddressData | null> {
  try {
    const OS_PLACES_API_KEY = process.env.OS_PLACES_API_KEY

    if (!OS_PLACES_API_KEY) {
      console.log("[v0] OS Places API key not configured - using fallback geocoding")
      return fallbackGeocoding(address)
    }

    // OS Places API endpoint
    const apiUrl = "https://api.os.uk/search/places/v1/find"
    const params = new URLSearchParams({
      query: address,
      key: OS_PLACES_API_KEY,
      maxresults: "1",
      output_srs: "EPSG:4326",
    })

    console.log(`[v0] Geocoding address with OS Places API: ${address}`)

    // TODO: Uncomment when API key is available
    // const response = await fetch(`${apiUrl}?${params}`)
    // const data = await response.json()

    // if (data.results && data.results.length > 0) {
    //   const result = data.results[0]
    //   return {
    //     address: result.DPA.ADDRESS,
    //     postcode: result.DPA.POSTCODE,
    //     coordinates: [result.DPA.LNG, result.DPA.LAT],
    //     localAuthority: result.DPA.LOCAL_CUSTODIAN_CODE_DESCRIPTION,
    //     propertyType: determinePropertyType(result.DPA.ADDRESS)
    //   }
    // }

    // Fallback for now
    return fallbackGeocoding(address)
  } catch (error) {
    console.error("OS Places API error:", error)
    return fallbackGeocoding(address)
  }
}

function fallbackGeocoding(address: string): AddressData | null {
  const postcode = extractPostcodeFromAddress(address)
  if (!postcode) return null

  // Basic local authority mapping based on postcode area
  const localAuthority = getLocalAuthorityFromPostcode(postcode)

  // Mock coordinates for major UK cities (replace with real geocoding)
  const coordinates = getMockCoordinatesFromPostcode(postcode)

  return {
    address,
    postcode,
    coordinates,
    localAuthority,
    propertyType: determinePropertyType(address),
  }
}

export async function fetchGovernmentDesignations(coordinates: [number, number]): Promise<GovernmentDesignations> {
  try {
    console.log(`[v0] Fetching government designations for coordinates: ${coordinates}`)

    // Multiple API calls for different designations
    const [conservationArea, nationalPark, aonb, worldHeritage, floodZone] = await Promise.allSettled([
      checkConservationArea(coordinates),
      checkNationalPark(coordinates),
      checkAONB(coordinates),
      checkWorldHeritage(coordinates),
      checkFloodZone(coordinates),
    ])

    return {
      conservationArea: conservationArea.status === "fulfilled" ? conservationArea.value : false,
      nationalPark: nationalPark.status === "fulfilled" ? nationalPark.value : false,
      aonb: aonb.status === "fulfilled" ? aonb.value : false,
      worldHeritage: worldHeritage.status === "fulfilled" ? worldHeritage.value : false,
      floodZone: floodZone.status === "fulfilled" ? floodZone.value : false,
    }
  } catch (error) {
    console.error("Government designations API error:", error)
    return {
      conservationArea: false,
      nationalPark: false,
      aonb: false,
      worldHeritage: false,
      floodZone: false,
    }
  }
}

async function checkConservationArea(coordinates: [number, number]): Promise<boolean> {
  // TODO: Implement Historic England Conservation Areas API
  // const HISTORIC_ENGLAND_API_KEY = process.env.HISTORIC_ENGLAND_API_KEY
  // if (!HISTORIC_ENGLAND_API_KEY) return false

  // Mock implementation - replace with real API call
  console.log(`[v0] Would check Conservation Area API for: ${coordinates}`)
  return false
}

async function checkNationalPark(coordinates: [number, number]): Promise<boolean> {
  // TODO: Implement Natural England API for National Parks
  // const NATURAL_ENGLAND_API_KEY = process.env.NATURAL_ENGLAND_API_KEY
  // if (!NATURAL_ENGLAND_API_KEY) return false

  console.log(`[v0] Would check National Parks API for: ${coordinates}`)
  return false
}

async function checkAONB(coordinates: [number, number]): Promise<boolean> {
  // TODO: Implement Natural England API for AONBs
  console.log(`[v0] Would check AONB API for: ${coordinates}`)
  return false
}

async function checkWorldHeritage(coordinates: [number, number]): Promise<boolean> {
  // TODO: Implement UNESCO World Heritage Sites API
  console.log(`[v0] Would check World Heritage Sites API for: ${coordinates}`)
  return false
}

async function checkFloodZone(coordinates: [number, number]): Promise<boolean> {
  // TODO: Implement Environment Agency Flood Map API
  // const ENVIRONMENT_AGENCY_API_KEY = process.env.ENVIRONMENT_AGENCY_API_KEY
  // if (!ENVIRONMENT_AGENCY_API_KEY) return false

  console.log(`[v0] Would check Flood Zone API for: ${coordinates}`)
  return false
}

export function extractPostcodeFromAddress(address: string): string | null {
  // UK postcode regex pattern
  const postcodeRegex = /([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})/gi
  const match = address.match(postcodeRegex)
  return match ? match[0].toUpperCase() : null
}

export function determinePropertyType(address: string): string {
  const lowerAddress = address.toLowerCase()

  if (lowerAddress.includes("flat") || lowerAddress.includes("apartment")) {
    return "flat"
  }
  if (lowerAddress.includes("maisonette")) {
    return "maisonette"
  }
  if (lowerAddress.includes("office") || lowerAddress.includes("commercial")) {
    return "commercial"
  }

  return "house" // Default to house
}

function getLocalAuthorityFromPostcode(postcode: string): string {
  const area = postcode.substring(0, 2).toUpperCase()

  const mapping: Record<string, string> = {
    SW: "Westminster City Council",
    W1: "Westminster City Council",
    WC: "Camden Council",
    BA: "Bath and North East Somerset Council",
    BN: "Brighton & Hove City Council",
    LA: "South Lakeland District Council",
    CV: "Stratford-on-Avon District Council",
    GL: "Cotswold District Council",
    M1: "Manchester City Council",
    M2: "Manchester City Council",
    B1: "Birmingham City Council",
    LS: "Leeds City Council",
    S1: "Sheffield City Council",
  }

  return mapping[area] || "Local Planning Authority"
}

function getMockCoordinatesFromPostcode(postcode: string): [number, number] {
  const area = postcode.substring(0, 2).toUpperCase()

  const coordinates: Record<string, [number, number]> = {
    SW: [-0.1278, 51.5074], // London SW
    W1: [-0.1419, 51.5152], // London W1
    WC: [-0.1276, 51.5194], // London WC
    BA: [-2.359, 51.3811], // Bath
    BN: [-0.1372, 50.8225], // Brighton
    LA: [-2.908, 54.3781], // Lake District
    CV: [-1.7077, 52.1919], // Stratford-upon-Avon
    GL: [-1.8094, 51.833], // Gloucestershire
    M1: [-2.2426, 53.4808], // Manchester
    M2: [-2.2426, 53.4808], // Manchester
    B1: [-1.8904, 52.4862], // Birmingham
    LS: [-1.5491, 53.8008], // Leeds
    S1: [-1.4701, 53.3811], // Sheffield
  }

  return coordinates[area] || [-0.1278, 51.5074] // Default to London
}
