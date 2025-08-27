import type { GeoJSON } from "geojson"
import type { PlanningConstraint } from "./advanced-data-sources"

export interface MapLayer {
  id: string
  name: string
  type: "constraint" | "boundary" | "property"
  visible: boolean
  color: string
  opacity: number
  data: GeoJSON.FeatureCollection
}

export interface MapConstraintFeature extends GeoJSON.Feature {
  properties: {
    id: string
    name: string
    type: string
    severity: "blocking" | "restrictive" | "advisory"
    description: string
    authority: string
    lastUpdated: string
  }
}

// Generate mock GeoJSON data for different constraint types
export function generateConstraintGeometry(
  center: [number, number],
  type: PlanningConstraint["type"],
): GeoJSON.Geometry {
  const [lng, lat] = center
  const offset = 0.002 // Roughly 200m

  switch (type) {
    case "conservation_area":
      // Large polygon for conservation area
      return {
        type: "Polygon",
        coordinates: [
          [
            [lng - offset * 2, lat - offset],
            [lng + offset * 2, lat - offset],
            [lng + offset * 2, lat + offset],
            [lng - offset * 2, lat + offset],
            [lng - offset * 2, lat - offset],
          ],
        ],
      }

    case "article_4":
      // Smaller polygon for Article 4 direction
      return {
        type: "Polygon",
        coordinates: [
          [
            [lng - offset, lat - offset * 0.5],
            [lng + offset, lat - offset * 0.5],
            [lng + offset, lat + offset * 0.5],
            [lng - offset, lat + offset * 0.5],
            [lng - offset, lat - offset * 0.5],
          ],
        ],
      }

    case "listed_building":
      // Point for listed building
      return {
        type: "Point",
        coordinates: [lng + offset * 0.3, lat + offset * 0.2],
      }

    case "flood_zone":
      // Irregular polygon for flood zone
      return {
        type: "Polygon",
        coordinates: [
          [
            [lng - offset * 1.5, lat - offset * 0.8],
            [lng + offset * 1.8, lat - offset * 0.6],
            [lng + offset * 1.5, lat + offset * 0.9],
            [lng - offset * 1.2, lat + offset * 0.7],
            [lng - offset * 1.5, lat - offset * 0.8],
          ],
        ],
      }

    default:
      return {
        type: "Point",
        coordinates: center,
      }
  }
}

export function createMapLayers(constraints: PlanningConstraint[], center: [number, number]): MapLayer[] {
  const layers: MapLayer[] = []

  // Group constraints by type
  const constraintsByType = constraints.reduce(
    (acc, constraint) => {
      if (!acc[constraint.type]) {
        acc[constraint.type] = []
      }
      acc[constraint.type].push(constraint)
      return acc
    },
    {} as Record<string, PlanningConstraint[]>,
  )

  // Create layer for each constraint type
  Object.entries(constraintsByType).forEach(([type, typeConstraints]) => {
    const features: MapConstraintFeature[] = typeConstraints.map((constraint) => ({
      type: "Feature",
      geometry: constraint.geometry || generateConstraintGeometry(center, constraint.type as any),
      properties: {
        id: constraint.id,
        name: constraint.name,
        type: constraint.type,
        severity: constraint.severity,
        description: constraint.description,
        authority: constraint.source,
        lastUpdated: constraint.lastVerified.toISOString(),
      },
    }))

    layers.push({
      id: type,
      name: getLayerName(type),
      type: "constraint",
      visible: true,
      color: getConstraintColor(type),
      opacity: 0.6,
      data: {
        type: "FeatureCollection",
        features,
      },
    })
  })

  return layers
}

function getLayerName(type: string): string {
  const names: Record<string, string> = {
    conservation_area: "Conservation Areas",
    article_4: "Article 4 Directions",
    listed_building: "Listed Buildings",
    national_park: "National Parks",
    green_belt: "Green Belt",
    flood_zone: "Flood Zones",
    tree_preservation: "Tree Preservation Orders",
  }
  return names[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

function getConstraintColor(type: string): string {
  const colors: Record<string, string> = {
    conservation_area: "#8b5cf6", // Purple
    article_4: "#dc2626", // Red
    listed_building: "#059669", // Green
    national_park: "#f59e0b", // Amber
    green_belt: "#10b981", // Emerald
    flood_zone: "#3b82f6", // Blue
    tree_preservation: "#84cc16", // Lime
  }
  return colors[type] || "#6b7280"
}
