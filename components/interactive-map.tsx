"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Map, Layers, ZoomIn, ZoomOut, RotateCcw, Info, MapPin } from "lucide-react"
import type { PropertyData } from "@/lib/advanced-data-sources"
import { createMapLayers, type MapLayer, type MapConstraintFeature } from "@/lib/map-data"

interface InteractiveMapProps {
  propertyData: PropertyData
  onConstraintClick?: (constraint: any) => void
}

export function InteractiveMap({ propertyData, onConstraintClick }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [layers, setLayers] = useState<MapLayer[]>([])
  const [selectedConstraint, setSelectedConstraint] = useState<any>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(propertyData.coordinates)
  const [zoomLevel, setZoomLevel] = useState(16)

  useEffect(() => {
    const mapLayers = createMapLayers(propertyData.constraints, propertyData.coordinates)
    setLayers(mapLayers)
  }, [propertyData])

  const toggleLayerVisibility = (layerId: string) => {
    setLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)))
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 20))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 10))
  }

  const resetView = () => {
    setMapCenter(propertyData.coordinates)
    setZoomLevel(16)
  }

  const handleConstraintClick = (feature: MapConstraintFeature) => {
    setSelectedConstraint(feature.properties)
    onConstraintClick?.(feature.properties)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "blocking":
        return "bg-red-100 text-red-800 border-red-200"
      case "restrictive":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "advisory":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Interactive Constraint Map
          </CardTitle>
          <p className="text-sm text-muted-foreground">Explore planning constraints around {propertyData.address}</p>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-4 gap-4">
            {/* Map Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Map Layers
                </h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />
                        <span className="text-sm font-medium">{layer.name}</span>
                      </div>
                      <Switch checked={layer.visible} onCheckedChange={() => toggleLayerVisibility(layer.id)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Map Controls</h4>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    Zoom Out
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetView}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset View
                  </Button>
                </div>
              </div>
            </div>

            {/* Map Display */}
            <div className="lg:col-span-3">
              <div
                ref={mapRef}
                className="relative w-full h-96 bg-muted rounded-lg border overflow-hidden"
                style={{
                  backgroundImage: `url('/uk-property-planning.png')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Property Marker */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                >
                  <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>

                {/* Constraint Overlays */}
                {layers
                  .filter((layer) => layer.visible)
                  .map((layer) => (
                    <div key={layer.id}>
                      {layer.data.features.map((feature, index) => (
                        <div
                          key={`${layer.id}-${index}`}
                          className="absolute border-2 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            borderColor: layer.color,
                            backgroundColor: `${layer.color}20`,
                            left: `${20 + index * 15}%`,
                            top: `${20 + index * 10}%`,
                            width: feature.geometry.type === "Point" ? "20px" : "25%",
                            height: feature.geometry.type === "Point" ? "20px" : "20%",
                            borderRadius: feature.geometry.type === "Point" ? "50%" : "4px",
                          }}
                          onClick={() => handleConstraintClick(feature as MapConstraintFeature)}
                        />
                      ))}
                    </div>
                  ))}

                {/* Map Info */}
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded border">
                  <div className="text-xs text-muted-foreground">
                    Zoom: {zoomLevel} | Constraints: {layers.length}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 p-3 bg-muted/50 rounded border">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Map Legend
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span>Property Location</span>
                  </div>
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 border-2"
                        style={{
                          borderColor: layer.color,
                          backgroundColor: `${layer.color}40`,
                        }}
                      />
                      <span>{layer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Constraint Details */}
          {selectedConstraint && (
            <div className="mt-4 p-4 border rounded-lg bg-card">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold">{selectedConstraint.name}</h4>
                <Badge className={getSeverityColor(selectedConstraint.severity)}>{selectedConstraint.severity}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{selectedConstraint.description}</p>
              <div className="text-xs text-muted-foreground">
                Authority: {selectedConstraint.authority} • Last Updated:{" "}
                {new Date(selectedConstraint.lastUpdated).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
