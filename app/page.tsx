"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddressSearchForm } from "@/components/address-search-form"
import { Header } from "@/components/header"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("search")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto mb-8 h-12 bg-muted/50">
            <TabsTrigger value="search" className="text-sm font-medium">
              Property Search
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm font-medium">
              PD Rights Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-6 py-8">
                <div className="space-y-4">
                  <Badge variant="secondary" className="mb-4">
                    Permitted Development Rights Checker
                  </Badge>
                  <h1 className="w-full max-w-full text-2xl sm:text-3xl md:text-5xl font-bold text-foreground leading-tight text-center break-words px-2">
                    PlanningCheckers.co.uk
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Get a reliable, near-instant answer to: "Do full Permitted Development rights still apply to this
                    property?" Enter any UK property address and receive a clear result with confidence.
                  </p>
                </div>
              </div>

              <AddressSearchForm />

              <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
                <h2 className="text-2xl font-semibold text-card-foreground mb-6 text-center">What We Check For</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    ["Article 4 Direction", "Conservation Areas", "Listed Buildings"],
                    ["National Parks & AONBs", "Flats & Maisonettes", "Change of Use History"],
                    ["Local Planning Restrictions", "Tree Preservation Orders", "Flood Zones & Green Belt"],
                  ].map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-4">
                      {column.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <LegalDisclaimer confidence={99.8} variant="compact" />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {/* Results will be handled by AddressSearchForm component */}
            <div className="text-center py-12">
              <p className="text-muted-foreground">Search results will appear here after checking a property.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
