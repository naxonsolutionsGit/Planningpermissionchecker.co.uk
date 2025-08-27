"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Clock, Database } from "lucide-react"
import { advancedDataIntegration, type PropertyData } from "@/lib/advanced-data-sources"
import { DataSourceMonitor } from "./data-source-monitor"

interface EnhancedAddressSearchProps {
  onResult: (data: PropertyData) => void
}

export function EnhancedAddressSearch({ onResult }: EnhancedAddressSearchProps) {
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Validate address first
      const isValid = await advancedDataIntegration.validateAddress(address)
      if (!isValid) {
        setError("Please enter a valid UK address with postcode")
        return
      }

      // Fetch comprehensive property data
      const propertyData = await advancedDataIntegration.fetchPropertyData(address)

      if (propertyData) {
        onResult(propertyData)
        setSearchHistory((prev) => [address, ...prev.slice(0, 4)]) // Keep last 5 searches
        setAddress("")
      } else {
        setError("Unable to find planning data for this address. Please try a different address.")
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.")
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (historicalAddress: string) => {
    setAddress(historicalAddress)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <Database className="h-6 w-6 text-primary" />
            Advanced Planning Intelligence Search
          </CardTitle>
          <p className="text-muted-foreground">
            Enter a UK property address to access comprehensive planning data from multiple authoritative sources
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter full UK address with postcode (e.g., 10 Downing Street, London SW1A 2AA)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !address.trim()} className="h-12 px-6 font-semibold">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((hist, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => handleHistoryClick(hist)}
                    >
                      {hist.length > 40 ? `${hist.substring(0, 40)}...` : hist}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <DataSourceMonitor />
    </div>
  )
}
