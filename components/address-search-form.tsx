"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin } from "lucide-react"
import { type PlanningResult, PlanningResult as PlanningResultComponent } from "@/components/planning-result"
import { checkPlanningRights } from "@/lib/planning-api"

export function AddressSearchForm() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PlanningResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const planningResult = await checkPlanningRights(address.trim())
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
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 pr-4 py-3 text-base"
              disabled={isLoading}
            />
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
