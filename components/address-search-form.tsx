"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { type PlanningResult, PlanningResult as PlanningResultComponent } from "@/components/planning-result"

interface GooglePlacesService {
  getPlacePredictions: (request: any, callback: (predictions: any[], status: any) => void) => void
}

interface GooglePlacesPrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCce5rVfDe4w_lFaQPjjxpDrw0IiHqlkuA&libraries=places` // <-- Inserted your API key here
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService()
          setIsGoogleLoaded(true)
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setIsLoading(true)
    setResult(null)
    setError(null)
    setShowSuggestions(false)

    try {
      const response = await fetch("/api/check-planning-rights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: address.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to check planning rights")
      }

      const planningResult = await response.json()
      setResult(planningResult)
    } catch (err) {
      setError("Failed to check planning rights. Please try again.")
      console.error("Planning check error:", err)
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
              placeholder="Enter full UK property address (e.g., 123 High Street, London, SW1A 1AA)"
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
