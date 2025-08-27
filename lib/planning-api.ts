import type { PlanningResult, PlanningCheck } from "@/components/planning-result"
import { findPropertyByAddress, mockCouncils, type MockProperty } from "./mock-data"
import { defaultRulesEngine } from "./planning-rules-engine"

// Simulate API delay
const simulateApiDelay = () => new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))

// Determine if property has PD rights using rules engine
function evaluatePropertyWithRulesEngine(property: MockProperty): {
  hasRights: boolean
  confidence: number
  checks: PlanningCheck[]
  summary: string
} {
  const rulesResult = defaultRulesEngine.evaluate(property)
  const summary = defaultRulesEngine.generateSummary(property, rulesResult)

  return {
    hasRights: rulesResult.hasPermittedDevelopmentRights,
    confidence: rulesResult.confidence,
    checks: rulesResult.checks,
    summary,
  }
}

// Main API function
export async function checkPlanningRights(address: string): Promise<PlanningResult> {
  await simulateApiDelay()

  const property = findPropertyByAddress(address)

  if (!property) {
    // Return a default "no restrictions found" result for unknown addresses
    return {
      address: address,
      hasPermittedDevelopmentRights: true,
      confidence: 85.0, // Lower confidence for unknown properties
      localAuthority: "Unknown Council",
      summary:
        "No specific planning restrictions identified for this address. However, this result has lower confidence due to limited data availability. We recommend checking with your local planning authority.",
      checks: [
        {
          type: "Article 4 Direction",
          status: "pass",
          description: "No Article 4 Directions found in our database for this location.",
        },
        {
          type: "Conservation Area",
          status: "pass",
          description: "No Conservation Area designation found in our records.",
        },
        {
          type: "Listed Building",
          status: "pass",
          description: "No Listed Building status found in our database.",
        },
        {
          type: "Property Type - Flat/Maisonette",
          status: "pass",
          description: "Assumed to be standard residential dwelling based on address format.",
        },
        {
          type: "National Park",
          status: "pass",
          description: "No National Park designation found.",
        },
        {
          type: "Area of Outstanding Natural Beauty",
          status: "pass",
          description: "No AONB designation found.",
        },
        {
          type: "Tree Preservation Order",
          status: "warning",
          description: "Limited local data available - TPOs may exist. Check with local planning authority.",
        },
      ],
    }
  }

  const evaluation = evaluatePropertyWithRulesEngine(property)

  return {
    address: property.address,
    hasPermittedDevelopmentRights: evaluation.hasRights,
    confidence: evaluation.confidence,
    localAuthority: property.localAuthority,
    summary: evaluation.summary,
    checks: evaluation.checks,
  }
}

// Get council information
export function getCouncilInfo(councilName: string) {
  return mockCouncils[councilName as keyof typeof mockCouncils] || null
}
