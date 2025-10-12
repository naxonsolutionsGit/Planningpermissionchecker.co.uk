"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { type PlanningResult, PlanningResult as PlanningResultComponent, type PlanningCheck } from "@/components/planning-result"

interface GooglePlacesService {
  getPlacePredictions: (request: any, callback: (predictions: any[], status: any) => void) => void
}

interface GoogleGeocoder {
  geocode: (request: any, callback: (results: any[], status: any) => void) => void
}

interface GooglePlacesPrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

// Define the entity interface based on the API response
interface PlanningEntity {
  "entry-date": string
  "start-date": string
  "end-date": string
  entity: number
  name: string
  dataset: string
  typology: string
  reference: string
  prefix: string
  "organisation-entity": string
  geometry: string
  point: string
  "dataset-name": string
  notes?: string
  description?: string
  "document-url"?: string
  "documentation-url"?: string
  documentation_url?: string
  document_url?: string
  "designation-date"?: string
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => GooglePlacesService
          PlacesServiceStatus: {
            OK: string
          }
        }
        Geocoder: new () => GoogleGeocoder
        GeocoderStatus: {
          OK: string
        }
      }
    }
  }
}

export function AddressSearchForm() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PlanningResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<GooglePlacesPrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const autocompleteService = useRef<GooglePlacesService | null>(null)

  useEffect(() => {
    const loadGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService()
        setIsGoogleLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCce5rVfDe4w_lFaQPjjxpDrw0IiHqlkuA&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          setIsGoogleLoaded(true)
        }
      }
      script.onerror = () => {
        console.log("Failed to load Google Maps API")
        setIsGoogleLoaded(false)
      }
      document.head.appendChild(script)
    }

    loadGooglePlaces()
  }, [])

  const handleAddressChange = (value: string) => {
    setAddress(value)

    if (value.length > 2 && isGoogleLoaded && autocompleteService.current) {
      const request = {
        input: value,
        componentRestrictions: { country: "uk" },
        types: ["address"],
      }

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5))
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: GooglePlacesPrediction) => {
    setAddress(suggestion.description)
    setShowSuggestions(false)
  }

  const extractEntityInfo = (entity: PlanningEntity, datasetName: string) => {
    let description = `${datasetName} restriction applies at this address.`
    let documentationUrl = ""
    let designationDate = ""
    let reference = ""
    let name = ""

    // Add specific information from the entity
    if (entity.name) {
      name = entity.name
      description += ` Name: ${entity.name}.`
    }
    
    if (entity.reference) {
      reference = entity.reference
      description += ` Reference: ${entity.reference}.`
    }
    
    if (entity.description) {
      description += ` ${entity.description}`
    } else if (entity.notes) {
      description += ` ${entity.notes}`
    }

    // Extract designation date if available
    if (entity["designation-date"]) {
      designationDate = entity["designation-date"]
      description += ` Designated on: ${new Date(designationDate).toLocaleDateString()}.`
    } else if (entity["start-date"] && entity["start-date"] !== "") {
      designationDate = entity["start-date"]
      description += ` Started on: ${new Date(designationDate).toLocaleDateString()}.`
    }

    // Extract documentation URL from various possible fields
    if (entity.documentation_url) {
      documentationUrl = entity.documentation_url
    } else if (entity["documentation-url"]) {
      documentationUrl = entity["documentation-url"]
    } else if (entity["document-url"]) {
      documentationUrl = entity["document-url"]
    } else if (entity.document_url) {
      documentationUrl = entity.document_url
    }

    return {
      description,
      documentationUrl,
      designationDate,
      reference,
      name
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setIsLoading(true)
    setResult(null)
    setError(null)
    setShowSuggestions(false)

    try {
      let latitude: number
      let longitude: number
      let localAuthority = "Unknown Local Authority"

      // Try to extract postcode first (most reliable method)
      const postcodeMatch = address.trim().match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i)
      
      if (postcodeMatch) {
        // Use postcodes.io for geocoding (most reliable for UK addresses)
        const postcode = postcodeMatch[0].replace(' ', '')
        const geocodeUrl = `https://api.postcodes.io/postcodes/${postcode}`
        const geocodeResponse = await fetch(geocodeUrl)
        const geocodeData = await geocodeResponse.json()

        if (geocodeData.result) {
          latitude = geocodeData.result.latitude
          longitude = geocodeData.result.longitude
          localAuthority = geocodeData.result.admin_district || geocodeData.result.primary_care_trust || "Unknown Local Authority"
        } else {
          throw new Error("Could not find coordinates for this postcode. Please check it's valid.")
        }
      } else if (window.google?.maps?.Geocoder) {
        // Fallback to Google Geocoding if no postcode but Google is available
        try {
          const geocoder = new window.google.maps.Geocoder()
          const geocodeResult = await new Promise<any>((resolve, reject) => {
            geocoder.geocode({ address: address.trim(), region: 'uk' }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                resolve(results[0])
              } else {
                reject(new Error('Google Geocoding failed. Please include a postcode.'))
              }
            })
          })

          const location = geocodeResult.geometry.location
          latitude = location.lat()
          longitude = location.lng()

          // Try to extract local authority from address components
          const localityComponent = geocodeResult.address_components.find(
            (component: any) => 
              component.types.includes('locality') || 
              component.types.includes('postal_town') ||
              component.types.includes('administrative_area_level_2')
          )
          if (localityComponent) {
            localAuthority = localityComponent.long_name
          }
        } catch (geocodeError) {
          throw new Error("Please include a UK postcode for accurate results (e.g., 'EH2 2EQ')")
        }
      } else {
        throw new Error("Please include a UK postcode (e.g., 'EH2 2EQ')")
      }

      const datasets = [
        { name: "Article 4 Direction", key: "article-4-direction" },
        { name: "Conservation Area", key: "conservation-area" },
        { name: "Listed Building", key: "listed-building" },
        { name: "National Park", key: "national-park" },
        { name: "Area of Outstanding Natural Beauty", key: "area-of-outstanding-natural-beauty" },
        { name: "Tree Preservation Order", key: "tree-preservation-order" },
        { name: "World Heritage Site", key: "world-heritage-site" },
      ]

      let checks: PlanningCheck[] = []
      let successfulApiCalls = 0

      for (const ds of datasets) {
        try {
          // Use geographic search with point coordinates
          const url = `https://www.planning.data.gov.uk/entity.json?latitude=${latitude}&longitude=${longitude}&dataset=${ds.key}&limit=10`

          const res = await fetch(url)
          if (!res.ok) throw new Error(`API returned ${res.status}`)
          
          const data = await res.json()
          successfulApiCalls++

          if (data.entities && data.entities.length > 0) {
            const entities: PlanningEntity[] = data.entities
            
            // Process all entities to get comprehensive information
            const entityInfos = entities.map(entity => extractEntityInfo(entity, ds.name))
            
            // Combine information from all entities
            let combinedDescription = `${ds.name} restriction applies at this address. `
            let documentationUrls: string[] = []
            let designationDates: string[] = []
            let references: string[] = []
            let names: string[] = []

            entityInfos.forEach(info => {
              if (info.documentationUrl && !documentationUrls.includes(info.documentationUrl)) {
                documentationUrls.push(info.documentationUrl)
              }
              if (info.designationDate && !designationDates.includes(info.designationDate)) {
                designationDates.push(info.designationDate)
              }
              if (info.reference && !references.includes(info.reference)) {
                references.push(info.reference)
              }
              if (info.name && !names.includes(info.name)) {
                names.push(info.name)
              }
            })

            // Build comprehensive description
            if (names.length > 0) {
              combinedDescription += `Affected areas: ${names.join(', ')}. `
            }
            
            if (references.length > 0) {
              combinedDescription += `References: ${references.join(', ')}. `
            }
            
            if (designationDates.length > 0) {
              const formattedDates = designationDates.map(date => new Date(date).toLocaleDateString())
              combinedDescription += `Designation dates: ${formattedDates.join(', ')}. `
            }

            // Add entity count information
            combinedDescription += `Found ${entities.length} related ${ds.name.toLowerCase()} ${entities.length === 1 ? 'record' : 'records'}.`

            // Use the first documentation URL or combine if needed
            const primaryDocumentationUrl = documentationUrls.length > 0 ? documentationUrls[0] : ""

            checks.push({
              type: ds.name,
              status: "fail",
              description: combinedDescription,
              documentationUrl: primaryDocumentationUrl,
              entitiesFound: entities.length,
              allEntities: entities // Store all entities for detailed display
            })
          } else {
            checks.push({
              type: ds.name,
              status: "pass",
              description: `No ${ds.name} restriction detected.`,
              documentationUrl: "",
              entitiesFound: 0
            })
          }
        } catch (err) {
          console.error(`Error checking ${ds.name}:`, err)
          checks.push({
            type: ds.name,
            status: "warning",
            description: `Unable to confirm ${ds.name}. Please check with your local authority.`,
            documentationUrl: "",
            entitiesFound: 0
          })
        }
      }

      // Extra check for flats/maisonettes
      if (/flat|apartment|maisonette/i.test(address)) {
        checks.push({
          type: "Property Type",
          status: "fail",
          description: "Flat or maisonette detected — limited PD rights.",
          documentationUrl: "",
          entitiesFound: 0
        })
      }

      // Check if address might be in a commercial area
      if (/hotel|shop|store|office|business|commercial|retail|industrial|warehouse/i.test(address.toLowerCase())) {
        checks.push({
          type: "Property Use",
          status: "fail",
          description: "Commercial property detected — different PD rules apply.",
          documentationUrl: "",
          entitiesFound: 0
        })
      }

      // Decide overall status
      const hasRestrictions = checks.some((c) => c.status === "fail")
      const hasWarnings = checks.some((c) => c.status === "warning")

      // Calculate confidence based on successful API calls
      const confidence = Math.round((successfulApiCalls / datasets.length) * 100)

      // Build final result
      const planningResult: PlanningResult = {
        address: address.trim(),
        coordinates: { lat: latitude, lng: longitude },
        hasPermittedDevelopmentRights: !hasRestrictions,
        confidence: confidence,
        localAuthority: localAuthority,
        checks,
        summary: hasRestrictions
          ? "One or more planning restrictions were detected. You may need full planning permission."
          : hasWarnings
          ? "No restrictions detected, but some checks were inconclusive. Permitted Development Rights likely apply."
          : "No restrictions detected. Permitted Development Rights likely still apply.",
      }

      setResult(planningResult)
    } catch (err) {
      console.error("Planning check error:", err)
      setError(err instanceof Error ? err.message : "Failed to check planning rights. Please ensure you include a valid UK postcode (e.g., 'EH2 2EQ')")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSearch = () => {
    setResult(null)
    setError(null)
    setAddress("")
  }

  if (result) {
    return (
      <div className="space-y-6">
        <PlanningResultComponent result={result} />
        <div className="text-center">
          <Button onClick={handleNewSearch} variant="outline" className="px-8 bg-transparent">
            Check Another Property
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter full UK address with postcode (e.g., 1 Princes Street, Edinburgh EH2 2EQ)"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4 py-3 text-base"
              disabled={isLoading}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id}
                    className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full py-3 text-base font-semibold" disabled={isLoading || !address.trim()}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Checking Planning Rights...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Check Permitted Development Rights
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent } from "@/components/ui/card"
// import { Search, MapPin } from "lucide-react"
// import { type PlanningResult, PlanningResult as PlanningResultComponent, type PlanningCheck } from "@/components/planning-result"

// interface GooglePlacesService {
//   getPlacePredictions: (request: any, callback: (predictions: any[], status: any) => void) => void
// }

// interface GoogleGeocoder {
//   geocode: (request: any, callback: (results: any[], status: any) => void) => void
// }

// interface GooglePlacesPrediction {
//   description: string
//   place_id: string
//   structured_formatting: {
//     main_text: string
//     secondary_text: string
//   }
// }

// declare global {
//   interface Window {
//     google: {
//       maps: {
//         places: {
//           AutocompleteService: new () => GooglePlacesService
//           PlacesServiceStatus: {
//             OK: string
//           }
//         }
//         Geocoder: new () => GoogleGeocoder
//         GeocoderStatus: {
//           OK: string
//         }
//       }
//     }
//   }
// }

// export function AddressSearchForm() {
//   const [address, setAddress] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [result, setResult] = useState<PlanningResult | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [suggestions, setSuggestions] = useState<GooglePlacesPrediction[]>([])
//   const [showSuggestions, setShowSuggestions] = useState(false)
//   const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
//   const autocompleteService = useRef<GooglePlacesService | null>(null)

//   useEffect(() => {
//     const loadGooglePlaces = () => {
//       if (window.google && window.google.maps && window.google.maps.places) {
//         autocompleteService.current = new window.google.maps.places.AutocompleteService()
//         setIsGoogleLoaded(true)
//         return
//       }

//       const script = document.createElement("script")
//       script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCce5rVfDe4w_lFaQPjjxpDrw0IiHqlkuA&libraries=places`
//       script.async = true
//       script.defer = true
//       script.onload = () => {
//         if (window.google && window.google.maps && window.google.maps.places) {
//           autocompleteService.current = new window.google.maps.places.AutocompleteService()
//           setIsGoogleLoaded(true)
//         }
//       }
//       script.onerror = () => {
//         console.log("Failed to load Google Maps API")
//         setIsGoogleLoaded(false)
//       }
//       document.head.appendChild(script)
//     }

//     loadGooglePlaces()
//   }, [])

//   const handleAddressChange = (value: string) => {
//     setAddress(value)

//     if (value.length > 2 && isGoogleLoaded && autocompleteService.current) {
//       const request = {
//         input: value,
//         componentRestrictions: { country: "uk" },
//         types: ["address"],
//       }

//       autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
//         if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
//           setSuggestions(predictions.slice(0, 5))
//           setShowSuggestions(true)
//         } else {
//           setSuggestions([])
//           setShowSuggestions(false)
//         }
//       })
//     } else {
//       setSuggestions([])
//       setShowSuggestions(false)
//     }
//   }

//   const handleSuggestionClick = (suggestion: GooglePlacesPrediction) => {
//     setAddress(suggestion.description)
//     setShowSuggestions(false)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!address.trim()) return

//     setIsLoading(true)
//     setResult(null)
//     setError(null)
//     setShowSuggestions(false)

//     try {
//       let latitude: number
//       let longitude: number
//       let localAuthority = "Unknown Local Authority"

//       // Try to extract postcode first (most reliable method)
//       const postcodeMatch = address.trim().match(/[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i)
      
//       if (postcodeMatch) {
//         // Use postcodes.io for geocoding (most reliable for UK addresses)
//         const postcode = postcodeMatch[0].replace(' ', '')
//         const geocodeUrl = `https://api.postcodes.io/postcodes/${postcode}`
//         const geocodeResponse = await fetch(geocodeUrl)
//         const geocodeData = await geocodeResponse.json()

//         if (geocodeData.result) {
//           latitude = geocodeData.result.latitude
//           longitude = geocodeData.result.longitude
//           localAuthority = geocodeData.result.admin_district || geocodeData.result.primary_care_trust || "Unknown Local Authority"
//         } else {
//           throw new Error("Could not find coordinates for this postcode. Please check it's valid.")
//         }
//       } else if (window.google?.maps?.Geocoder) {
//         // Fallback to Google Geocoding if no postcode but Google is available
//         try {
//           const geocoder = new window.google.maps.Geocoder()
//           const geocodeResult = await new Promise<any>((resolve, reject) => {
//             geocoder.geocode({ address: address.trim(), region: 'uk' }, (results, status) => {
//               if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
//                 resolve(results[0])
//               } else {
//                 reject(new Error('Google Geocoding failed. Please include a postcode.'))
//               }
//             })
//           })

//           const location = geocodeResult.geometry.location
//           latitude = location.lat()
//           longitude = location.lng()

//           // Try to extract local authority from address components
//           const localityComponent = geocodeResult.address_components.find(
//             (component: any) => 
//               component.types.includes('locality') || 
//               component.types.includes('postal_town') ||
//               component.types.includes('administrative_area_level_2')
//           )
//           if (localityComponent) {
//             localAuthority = localityComponent.long_name
//           }
//         } catch (geocodeError) {
//           throw new Error("Please include a UK postcode for accurate results (e.g., 'EH2 2EQ')")
//         }
//       } else {
//         throw new Error("Please include a UK postcode (e.g., 'EH2 2EQ')")
//       }

//       const datasets = [
//         { name: "Article 4 Direction", key: "article-4-direction" },
//         { name: "Conservation Area", key: "conservation-area" },
//         { name: "Listed Building", key: "listed-building" },
//         { name: "National Park", key: "national-park" },
//         { name: "Area of Outstanding Natural Beauty", key: "area-of-outstanding-natural-beauty" },
//         { name: "Tree Preservation Order", key: "tree-preservation-order" },
//         { name: "World Heritage Site", key: "world-heritage-site" },
//       ]

//       let checks: PlanningCheck[] = []
//       let successfulApiCalls = 0

//       for (const ds of datasets) {
//         try {
//           // Use geographic search with point coordinates
//           const url = `https://www.planning.data.gov.uk/entity.json?latitude=${latitude}&longitude=${longitude}&dataset=${ds.key}&limit=5`

//           const res = await fetch(url)
//           if (!res.ok) throw new Error(`API returned ${res.status}`)
          
//           const data = await res.json()
//           successfulApiCalls++

//           if (data.entities && data.entities.length > 0) {
//             const entities = data.entities
//             let description = `${ds.name} restriction applies at this address.`
//             let documentationUrl = ""
            
//             // Get details from the first entity
//             const entity = entities[0]
            
//             if (entity.description) {
//               description += ` ${entity.description}`
//             } else if (entity.notes) {
//               description += ` ${entity.notes}`
//             } else if (entity.name) {
//               description += ` ${entity.name}.`
//             }
            
//             // Extract documentation URL
//             if (entity.documentation_url) {
//               documentationUrl = entity.documentation_url
//             } else if (entity["documentation-url"]) {
//               documentationUrl = entity["documentation-url"]
//             } else if (entity["document-url"]) {
//               documentationUrl = entity["document-url"]
//             } else if (entity.document_url) {
//               documentationUrl = entity.document_url
//             }

//             checks.push({
//               type: ds.name,
//               status: "fail",
//               description: description,
//               documentationUrl: documentationUrl,
//               entitiesFound: entities.length
//             })
//           } else {
//             checks.push({
//               type: ds.name,
//               status: "pass",
//               description: `No ${ds.name} restriction detected.`,
//               documentationUrl: ""
//             })
//           }
//         } catch (err) {
//           console.error(`Error checking ${ds.name}:`, err)
//           checks.push({
//             type: ds.name,
//             status: "warning",
//             description: `Unable to confirm ${ds.name}. Please check with your local authority.`,
//             documentationUrl: ""
//           })
//         }
//       }

//       // Extra check for flats/maisonettes
//       if (/flat|apartment|maisonette/i.test(address)) {
//         checks.push({
//           type: "Property Type",
//           status: "fail",
//           description: "Flat or maisonette detected — limited PD rights.",
//           documentationUrl: ""
//         })
//       }

//       // Check if address might be in a commercial area
//       if (/hotel|shop|store|office|business|commercial|retail|industrial|warehouse/i.test(address.toLowerCase())) {
//         checks.push({
//           type: "Property Use",
//           status: "fail",
//           description: "Commercial property detected — different PD rules apply.",
//           documentationUrl: ""
//         })
//       }

//       // Decide overall status
//       const hasRestrictions = checks.some((c) => c.status === "fail")
//       const hasWarnings = checks.some((c) => c.status === "warning")

//       // Calculate confidence based on successful API calls
//       const confidence = Math.round((successfulApiCalls / datasets.length) * 100)

//       // Build final result
//       const planningResult: PlanningResult = {
//         address: address.trim(),
//         coordinates: { lat: latitude, lng: longitude },
//         hasPermittedDevelopmentRights: !hasRestrictions,
//         confidence: confidence,
//         localAuthority: localAuthority,
//         checks,
//         summary: hasRestrictions
//           ? "One or more planning restrictions were detected. You may need full planning permission."
//           : hasWarnings
//           ? "No restrictions detected, but some checks were inconclusive. Permitted Development Rights likely apply."
//           : "No restrictions detected. Permitted Development Rights likely still apply.",
//       }

//       setResult(planningResult)
//     } catch (err) {
//       console.error("Planning check error:", err)
//       setError(err instanceof Error ? err.message : "Failed to check planning rights. Please ensure you include a valid UK postcode (e.g., 'EH2 2EQ')")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleNewSearch = () => {
//     setResult(null)
//     setError(null)
//     setAddress("")
//   }

//   if (result) {
//     return (
//       <div className="space-y-6">
//         <PlanningResultComponent result={result} />
//         <div className="text-center">
//           <Button onClick={handleNewSearch} variant="outline" className="px-8 bg-transparent">
//             Check Another Property
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <Card className="w-full max-w-2xl mx-auto">
//       <CardContent className="p-6">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
//             <Input
//               type="text"
//               placeholder="Enter full UK address with postcode (e.g., 1 Princes Street, Edinburgh EH2 2EQ)"
//               value={address}
//               onChange={(e) => handleAddressChange(e.target.value)}
//               onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
//               onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
//               className="pl-10 pr-4 py-3 text-base"
//               disabled={isLoading}
//             />

//             {showSuggestions && suggestions.length > 0 && (
//               <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
//                 {suggestions.map((suggestion, index) => (
//                   <div
//                     key={suggestion.place_id}
//                     className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
//                     onClick={() => handleSuggestionClick(suggestion)}
//                   >
//                     <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
//                     <div className="text-xs text-muted-foreground">
//                       {suggestion.structured_formatting.secondary_text}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

//           <Button type="submit" className="w-full py-3 text-base font-semibold" disabled={isLoading || !address.trim()}>
//             {isLoading ? (
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
//                 Checking Planning Rights...
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Search className="w-5 h-5" />
//                 Check Permitted Development Rights
//               </div>
//             )}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }
// "use client"

// import type React from "react"
// import { useState, useEffect, useRef } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent } from "@/components/ui/card"
// import { Search, MapPin } from "lucide-react"
// import { type PlanningResult, PlanningResult as PlanningResultComponent,PlanningCheck } from "@/components/planning-result"

// interface GooglePlacesService {
//   getPlacePredictions: (request: any, callback: (predictions: any[], status: any) => void) => void
// }

// interface GooglePlacesPrediction {
//   description: string
//   place_id: string
//   structured_formatting: {
//     main_text: string
//     secondary_text: string
//   }
// }

// declare global {
//   interface Window {
//     google: {
//       maps: {
//         places: {
//           AutocompleteService: new () => GooglePlacesService
//           PlacesServiceStatus: {
//             OK: string
//           }
//         }
//       }
//     }
//   }
// }

// export function AddressSearchForm() {
//   const [address, setAddress] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [result, setResult] = useState<PlanningResult | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [suggestions, setSuggestions] = useState<GooglePlacesPrediction[]>([])
//   const [showSuggestions, setShowSuggestions] = useState(false)
//   const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
//   const autocompleteService = useRef<GooglePlacesService | null>(null)

//   useEffect(() => {
//     const loadGooglePlaces = () => {
//       if (window.google && window.google.maps && window.google.maps.places) {
//         autocompleteService.current = new window.google.maps.places.AutocompleteService()
//         setIsGoogleLoaded(true)
//         return
//       }

//       const script = document.createElement("script")
//       script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCce5rVfDe4w_lFaQPjjxpDrw0IiHqlkuA&libraries=places` // <-- Inserted your API key here
//       script.async = true
//       script.defer = true
//       script.onload = () => {
//         if (window.google && window.google.maps && window.google.maps.places) {
//           autocompleteService.current = new window.google.maps.places.AutocompleteService()
//           setIsGoogleLoaded(true)
//         }
//       }
//       document.head.appendChild(script)
//     }

//     loadGooglePlaces()
//   }, [])

//   const handleAddressChange = (value: string) => {
//     setAddress(value)

//     if (value.length > 2 && isGoogleLoaded && autocompleteService.current) {
//       const request = {
//         input: value,
//         componentRestrictions: { country: "uk" },
//         types: ["address"],
//       }

//       autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
//         if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
//           setSuggestions(predictions.slice(0, 5))
//           setShowSuggestions(true)
//         } else {
//           setSuggestions([])
//           setShowSuggestions(false)
//         }
//       })
//     } else {
//       setSuggestions([])
//       setShowSuggestions(false)
//     }
//   }

//   const handleSuggestionClick = (suggestion: GooglePlacesPrediction) => {
//     setAddress(suggestion.description)
//     setShowSuggestions(false)
//   }

// //   const handleSubmit = async (e: React.FormEvent) => {
// //   e.preventDefault()
// //   if (!address.trim()) return

// //   setIsLoading(true)
// //   setResult(null)
// //   setError(null)
// //   setShowSuggestions(false)

// //   try {
// //     const datasets = [
// //       { name: "Article 4 Direction", key: "article-4-direction" },
// //       { name: "Conservation Area", key: "conservation-area" },
// //       { name: "Listed Building", key: "listed-building" },
// //       { name: "National Park", key: "national-park" },
// //       { name: "Area of Outstanding Natural Beauty", key: "area-of-outstanding-natural-beauty" },
// //     ]

// //     let checks: PlanningCheck[] = []

// //     for (const ds of datasets) {
// //       try {
// //         const url = `https://www.planning.data.gov.uk/entity.json?q=${encodeURIComponent(
// //           address.trim()
// //         )}&dataset=${ds.key}&limit=1`

// //         const res = await fetch(url)
// //         const data = await res.json()

// //         if (data.entities && data.entities.length > 0) {
// //           checks.push({
// //             type: ds.name,
// //             status: "fail",
// //             description: `${ds.name} restriction applies at this address.`,
// //           })
// //         } else {
// //           checks.push({
// //             type: ds.name,
// //             status: "pass",
// //             description: `No ${ds.name} restriction detected.`,
// //           })
// //         }
// //       } catch (err) {
// //         checks.push({
// //           type: ds.name,
// //           status: "warning",
// //           description: `Unable to confirm ${ds.name}. Please check with your local authority.`,
// //         })
// //       }
// //     }

// //     // Extra check for flats/maisonettes
// //     if (/flat|apartment|maisonette/i.test(address)) {
// //       checks.push({
// //         type: "Property Type",
// //         status: "fail",
// //         description: "Flat or maisonette detected — limited PD rights.",
// //       })
// //     }

// //     // Decide overall status
// //     const hasRestrictions = checks.some((c) => c.status === "fail")

// //     // Build final result
// //     const planningResult: PlanningResult = {
// //       address: address.trim(),
// //       hasPermittedDevelopmentRights: !hasRestrictions,
// //       confidence: 99, // Example fixed number — you can adjust logic later
// //       localAuthority: "Unknown Local Authority", // You can enhance by looking up via API
// //       checks,
// //       summary: hasRestrictions
// //         ? "One or more planning restrictions were detected. You may need full planning permission."
// //         : "No restrictions detected. Permitted Development Rights likely still apply.",
// //     }

// //     setResult(planningResult)
// //   } catch (err) {
// //     setError("Failed to check planning rights. Please try again.")
// //     console.error("Planning check error:", err)
// //   } finally {
// //     setIsLoading(false)
// //   }
// // }

//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault()
//   //   if (!address.trim()) return

//   //   setIsLoading(true)
//   //   setResult(null)
//   //   setError(null)
//   //   setShowSuggestions(false)

//   //   try {
//   //     const response = await fetch("/api/check-planning-rights", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({ address: address.trim() }),
//   //     })

//   //     if (!response.ok) {
//   //       throw new Error("Failed to check planning rights")
//   //     }

//   //     const planningResult = await response.json()
//   //     setResult(planningResult)
//   //   } catch (err) {
//   //     setError("Failed to check planning rights. Please try again.")
//   //     console.error("Planning check error:", err)
//   //   } finally {
//   //     setIsLoading(false)
//   //   }
//   // }
// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault()
//   if (!address.trim()) return

//   setIsLoading(true)
//   setResult(null)
//   setError(null)
//   setShowSuggestions(false)

//   try {
//     const datasets = [
//       { name: "Article 4 Direction", key: "article-4-direction" },
//       { name: "Conservation Area", key: "conservation-area" },
//       { name: "Listed Building", key: "listed-building" },
//       { name: "National Park", key: "national-park" },
//       { name: "Area of Outstanding Natural Beauty", key: "area-of-outstanding-natural-beauty" },
//     ]

//     let checks: PlanningCheck[] = []

//     for (const ds of datasets) {
//       try {
//         const url = `https://www.planning.data.gov.uk/entity.json?q=${encodeURIComponent(
//           address.trim()
//         )}&dataset=${ds.key}&limit=1`

//         const res = await fetch(url)
//         const data = await res.json()

//         if (data.entities && data.entities.length > 0) {
//           const entity = data.entities[0]
//           let description = `${ds.name} restriction applies at this address.`
//           let documentationUrl = ""
          
//           // Add specific description from the entity if available
//           if (entity.description) {
//             description += ` ${entity.description}`
//           } else if (entity.notes) {
//             description += ` ${entity.notes}`
//           } else if (entity.name) {
//             description += ` ${entity.name}.`
//           }
          
//           // Extract documentation URL from various possible fields
//           if (entity.documentation_url) {
//             documentationUrl = entity.documentation_url
//           } else if (entity["documentation-url"]) {
//             documentationUrl = entity["documentation-url"]
//           } else if (entity["document-url"]) {
//             documentationUrl = entity["document-url"]
//           } else if (entity.document_url) {
//             documentationUrl = entity.document_url
//           }

//           checks.push({
//             type: ds.name,
//             status: "fail",
//             description: description,
//             documentationUrl: documentationUrl
//           })
//         } else {
//           checks.push({
//             type: ds.name,
//             status: "pass",
//             description: `No ${ds.name} restriction detected.`,
//             documentationUrl: ""
//           })
//         }
//       } catch (err) {
//         checks.push({
//           type: ds.name,
//           status: "warning",
//           description: `Unable to confirm ${ds.name}. Please check with your local authority.`,
//           documentationUrl: ""
//         })
//       }
//     }

//     // Extra check for flats/maisonettes
//     if (/flat|apartment|maisonette/i.test(address)) {
//       checks.push({
//         type: "Property Type",
//         status: "fail",
//         description: "Flat or maisonette detected — limited PD rights.",
//         documentationUrl: ""
//       })
//     }

//     // Decide overall status
//     const hasRestrictions = checks.some((c) => c.status === "fail")

//     // Build final result
//     const planningResult: PlanningResult = {
//       address: address.trim(),
//       hasPermittedDevelopmentRights: !hasRestrictions,
//       confidence: 99, // Example fixed number — you can adjust logic later
//       localAuthority: "Unknown Local Authority", // You can enhance by looking up via API
//       checks,
//       summary: hasRestrictions
//         ? "One or more planning restrictions were detected. You may need full planning permission."
//         : "No restrictions detected. Permitted Development Rights likely still apply.",
//     }

//     setResult(planningResult)
//   } catch (err) {
//     setError("Failed to check planning rights. Please try again.")
//     console.error("Planning check error:", err)
//   } finally {
//     setIsLoading(false)
//   }
// }
//   const handleNewSearch = () => {
//     setResult(null)
//     setError(null)
//     setAddress("")
//   }

//   if (result) {
//     return (
//       <div className="space-y-6">
//         <PlanningResultComponent result={result} />
//         <div className="text-center">
//           <Button onClick={handleNewSearch} variant="outline" className="px-8 bg-transparent">
//             Check Another Property
//           </Button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <Card className="w-full max-w-2xl mx-auto">
//       <CardContent className="p-6">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
//             <Input
//               type="text"
//               placeholder="Enter full UK property address (e.g., 123 High Street, London, SW1A 1AA)"
//               value={address}
//               onChange={(e) => handleAddressChange(e.target.value)}
//               onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
//               onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
//               className="pl-10 pr-4 py-3 text-base"
//               disabled={isLoading}
//             />

//             {showSuggestions && suggestions.length > 0 && (
//               <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
//                 {suggestions.map((suggestion, index) => (
//                   <div
//                     key={suggestion.place_id}
//                     className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
//                     onClick={() => handleSuggestionClick(suggestion)}
//                   >
//                     <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
//                     <div className="text-xs text-muted-foreground">
//                       {suggestion.structured_formatting.secondary_text}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

//           <Button type="submit" className="w-full py-3 text-base font-semibold" disabled={isLoading || !address.trim()}>
//             {isLoading ? (
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
//                 Checking Planning Rights...
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Search className="w-5 h-5" />
//                 Check Permitted Development Rights
//               </div>
//             )}
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   )
// }
