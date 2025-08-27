export interface MockProperty {
  address: string
  postcode: string
  localAuthority: string
  propertyType: "house" | "flat" | "maisonette" | "commercial"
  constraints: {
    article4Direction: boolean
    conservationArea: boolean
    listedBuilding: boolean
    nationalPark: boolean
    aonb: boolean
    worldHeritage: boolean
    tpo: boolean // Tree Preservation Order
    floodZone: boolean
  }
  notes?: string
}

// Mock property database with various scenarios
export const mockProperties: MockProperty[] = [
  {
    address: "123 High Street, Westminster, London",
    postcode: "SW1A 1AA",
    localAuthority: "Westminster City Council",
    propertyType: "house",
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
  },
  {
    address: "45 Georgian Square, Bath",
    postcode: "BA1 2AB",
    localAuthority: "Bath and North East Somerset Council",
    propertyType: "house",
    constraints: {
      article4Direction: true,
      conservationArea: true,
      listedBuilding: false,
      nationalPark: false,
      aonb: false,
      worldHeritage: true,
      tpo: false,
      floodZone: false,
    },
    notes: "Located in Bath World Heritage Site with strict Article 4 Direction",
  },
  {
    address: "Flat 2B, Victoria Mansions, Brighton",
    postcode: "BN1 3CD",
    localAuthority: "Brighton & Hove City Council",
    propertyType: "flat",
    constraints: {
      article4Direction: false,
      conservationArea: true,
      listedBuilding: false,
      nationalPark: false,
      aonb: false,
      worldHeritage: false,
      tpo: false,
      floodZone: false,
    },
    notes: "Flat in conservation area - limited PD rights",
  },
  {
    address: "Cottage Lane, Windermere, Cumbria",
    postcode: "LA23 1EF",
    localAuthority: "South Lakeland District Council",
    propertyType: "house",
    constraints: {
      article4Direction: true,
      conservationArea: false,
      listedBuilding: false,
      nationalPark: true,
      aonb: false,
      worldHeritage: false,
      tpo: true,
      floodZone: false,
    },
    notes: "Located in Lake District National Park with Article 4 Direction",
  },
  {
    address: "15 Mill Street, Stratford-upon-Avon",
    postcode: "CV37 6GH",
    localAuthority: "Stratford-on-Avon District Council",
    propertyType: "house",
    constraints: {
      article4Direction: false,
      conservationArea: true,
      listedBuilding: true,
      nationalPark: false,
      aonb: false,
      worldHeritage: false,
      tpo: false,
      floodZone: false,
    },
    notes: "Grade II listed building in conservation area",
  },
  {
    address: "Oak Tree House, Cotswolds Village",
    postcode: "GL54 2IJ",
    localAuthority: "Cotswold District Council",
    propertyType: "house",
    constraints: {
      article4Direction: true,
      conservationArea: true,
      listedBuilding: false,
      nationalPark: false,
      aonb: true,
      worldHeritage: false,
      tpo: true,
      floodZone: false,
    },
    notes: "AONB with Article 4 Direction and TPO",
  },
]

// Mock council data
export const mockCouncils = {
  "Westminster City Council": {
    website: "https://www.westminster.gov.uk",
    planningPortal: "https://idoxpa.westminster.gov.uk",
    article4Coverage: "Limited to specific conservation areas",
  },
  "Bath and North East Somerset Council": {
    website: "https://www.bathnes.gov.uk",
    planningPortal: "https://planning.bathnes.gov.uk",
    article4Coverage: "Extensive coverage due to World Heritage Site status",
  },
  "Brighton & Hove City Council": {
    website: "https://www.brighton-hove.gov.uk",
    planningPortal: "https://planningapps.brighton-hove.gov.uk",
    article4Coverage: "Selected conservation areas and seafront",
  },
  "South Lakeland District Council": {
    website: "https://www.southlakeland.gov.uk",
    planningPortal: "https://applications.southlakeland.gov.uk",
    article4Coverage: "National Park areas with landscape sensitivity",
  },
  "Stratford-on-Avon District Council": {
    website: "https://www.stratford.gov.uk",
    planningPortal: "https://apps.stratford.gov.uk",
    article4Coverage: "Historic town center and conservation areas",
  },
  "Cotswold District Council": {
    website: "https://www.cotswold.gov.uk",
    planningPortal: "https://publicaccess.cotswold.gov.uk",
    article4Coverage: "AONB villages and market towns",
  },
}

// Address matching function
export function findPropertyByAddress(searchAddress: string): MockProperty | null {
  const normalizedSearch = searchAddress.toLowerCase().trim()

  // Try exact match first
  let match = mockProperties.find(
    (prop) =>
      prop.address.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(prop.address.toLowerCase()),
  )

  // If no match, try postcode
  if (!match) {
    match = mockProperties.find((prop) => normalizedSearch.includes(prop.postcode.toLowerCase()))
  }

  // If still no match, try partial address matching
  if (!match) {
    const searchWords = normalizedSearch.split(/[\s,]+/)
    match = mockProperties.find((prop) => {
      const propWords = prop.address.toLowerCase().split(/[\s,]+/)
      return searchWords.some((word) => propWords.some((propWord) => propWord.includes(word) && word.length > 2))
    })
  }

  return match || null
}

// Generate realistic confidence scores based on data quality
export function calculateConfidence(property: MockProperty): number {
  let confidence = 95.0 // Base confidence

  // Reduce confidence for complex scenarios
  if (property.constraints.article4Direction) confidence -= 2.0
  if (property.constraints.conservationArea) confidence -= 1.5
  if (property.constraints.listedBuilding) confidence -= 3.0
  if (property.constraints.nationalPark) confidence -= 1.0
  if (property.constraints.worldHeritage) confidence -= 2.5

  // Increase confidence for clear cases
  const hasAnyConstraints = Object.values(property.constraints).some((constraint) => constraint)
  if (!hasAnyConstraints) confidence += 4.8

  // Property type affects confidence
  if (property.propertyType === "flat" || property.propertyType === "maisonette") {
    confidence -= 1.0
  }

  return Math.min(99.8, Math.max(85.0, confidence))
}
