import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isInConservationArea } from "./conservation-area-api"

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
    if (!OS_PLACES_API_KEY) throw new Error("OS Places API key not configured")

    const apiUrl = "https://api.os.uk/search/places/v1/find"
    const params = new URLSearchParams({
      query: address,
      key: OS_PLACES_API_KEY,
      maxresults: "1",
      output_srs: "EPSG:4326",
    })

    const response = await fetch(`${apiUrl}?${params}`)
    const data = await response.json()
    console.log("OS API response for", address, ":", JSON.stringify(data, null, 2))

    if (data.results && data.results.length > 0) {
      const result = data.results[0].DPA
      return {
        address: result.ADDRESS,
        postcode: result.POSTCODE,
        coordinates: [parseFloat(result.LATITUDE), parseFloat(result.LONGITUDE)],
        localAuthority: result.LOCAL_CUSTODIAN_CODE_DESCRIPTION,
        propertyType: determinePropertyType(result.ADDRESS)
      }
    }

    return null
  } catch (error) {
    console.error("OS Places API error:", error)
    return null
  }
}

export async function fetchGovernmentDesignations(coordinates: [number, number]): Promise<GovernmentDesignations> {
  try {
    const [conservationArea] = await Promise.all([
      checkConservationArea(coordinates),
      // Add other real API calls here for nationalPark, aonb, etc.
    ])

    return {
      conservationArea,
      nationalPark: false, // TODO: Replace with real API
      aonb: false,         // TODO: Replace with real API
      worldHeritage: false,// TODO: Replace with real API
      floodZone: false,    // TODO: Replace with real API
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
  const [lat, lon] = coordinates
  return await isInConservationArea(lat, lon)
}

export function extractPostcodeFromAddress(address: string): string | null {
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
  return "house"
}
