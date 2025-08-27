import type { MockProperty } from "./mock-data"
import type { PlanningCheck } from "@/components/planning-result"

// Rule severity levels
export type RuleSeverity = "blocking" | "restrictive" | "advisory" | "informational"

// Individual planning rule
export interface PlanningRule {
  id: string
  name: string
  description: string
  severity: RuleSeverity
  priority: number // Higher number = higher priority
  evaluate: (property: MockProperty) => RuleResult
}

// Result of evaluating a rule
export interface RuleResult {
  applies: boolean
  status: "pass" | "fail" | "warning"
  message: string
  confidenceImpact: number // Positive or negative impact on confidence
  details?: string
}

// Rules engine evaluation result
export interface RulesEngineResult {
  hasPermittedDevelopmentRights: boolean
  confidence: number
  primaryReasons: string[]
  checks: PlanningCheck[]
  ruleResults: RuleResult[]
}

// Core planning rules
export const planningRules: PlanningRule[] = [
  // BLOCKING RULES (Completely remove PD rights)
  {
    id: "article4-direction",
    name: "Article 4 Direction",
    description: "Article 4 Directions remove specific Permitted Development rights",
    severity: "blocking",
    priority: 100,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.article4Direction,
      status: property.constraints.article4Direction ? "fail" : "pass",
      message: property.constraints.article4Direction
        ? "Article 4 Direction in place - removes some or all Permitted Development rights"
        : "No Article 4 Directions found that would remove Permitted Development rights for this property",
      confidenceImpact: property.constraints.article4Direction ? -2.0 : +1.0,
      details: property.constraints.article4Direction
        ? "Article 4 Directions are made by local planning authorities to remove permitted development rights in specific areas where normal planning controls are needed to protect local amenity or the well-being of the area."
        : undefined,
    }),
  },

  {
    id: "listed-building",
    name: "Listed Building",
    description: "Listed buildings require Listed Building Consent for alterations",
    severity: "blocking",
    priority: 95,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.listedBuilding,
      status: property.constraints.listedBuilding ? "fail" : "pass",
      message: property.constraints.listedBuilding
        ? "Property is listed or within the curtilage of a listed building - Listed Building Consent required"
        : "Property is not listed and not within the curtilage of a listed building",
      confidenceImpact: property.constraints.listedBuilding ? -3.0 : +1.5,
      details: property.constraints.listedBuilding
        ? "Listed buildings are protected by law and any alterations, extensions or demolitions require Listed Building Consent in addition to planning permission."
        : undefined,
    }),
  },

  {
    id: "property-type-flat",
    name: "Property Type - Flat/Maisonette",
    description: "Flats and maisonettes have severely limited Permitted Development rights",
    severity: "blocking",
    priority: 90,
    evaluate: (property: MockProperty): RuleResult => {
      const isFlat = property.propertyType === "flat" || property.propertyType === "maisonette"
      return {
        applies: isFlat,
        status: isFlat ? "fail" : "pass",
        message: isFlat
          ? `Property is a ${property.propertyType} - Permitted Development rights are severely limited for flats and maisonettes`
          : "Standard residential dwelling - full Permitted Development rights typically apply",
        confidenceImpact: isFlat ? -1.0 : +2.0,
        details: isFlat
          ? "Flats and maisonettes have very limited permitted development rights. Most alterations and extensions require planning permission."
          : undefined,
      }
    },
  },

  // RESTRICTIVE RULES (Limit but don't completely remove PD rights)
  {
    id: "conservation-area",
    name: "Conservation Area",
    description: "Conservation areas have additional planning controls",
    severity: "restrictive",
    priority: 80,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.conservationArea,
      status: property.constraints.conservationArea ? "warning" : "pass",
      message: property.constraints.conservationArea
        ? "Property is located within a designated Conservation Area - additional planning restrictions apply"
        : "Property is not located within a designated Conservation Area",
      confidenceImpact: property.constraints.conservationArea ? -1.5 : +0.5,
      details: property.constraints.conservationArea
        ? "Conservation areas have additional planning controls. Some permitted development rights are removed, particularly for roof extensions, cladding, and demolition."
        : undefined,
    }),
  },

  {
    id: "world-heritage-site",
    name: "World Heritage Site",
    description: "World Heritage Sites have the highest level of protection",
    severity: "restrictive",
    priority: 85,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.worldHeritage,
      status: property.constraints.worldHeritage ? "warning" : "pass",
      message: property.constraints.worldHeritage
        ? "Property is within a World Heritage Site - exceptional planning controls apply"
        : "Property is not within a World Heritage Site",
      confidenceImpact: property.constraints.worldHeritage ? -2.5 : +0.5,
      details: property.constraints.worldHeritage
        ? "World Heritage Sites have exceptional planning controls to preserve their outstanding universal value. Most development requires planning permission."
        : undefined,
    }),
  },

  {
    id: "national-park",
    name: "National Park",
    description: "National Parks have enhanced planning controls",
    severity: "restrictive",
    priority: 75,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.nationalPark,
      status: property.constraints.nationalPark ? "warning" : "pass",
      message: property.constraints.nationalPark
        ? "Property is within a National Park - enhanced planning controls apply"
        : "Property is not within a National Park",
      confidenceImpact: property.constraints.nationalPark ? -1.0 : +0.5,
      details: property.constraints.nationalPark
        ? "National Parks have enhanced planning controls to protect landscape character. Some permitted development rights are restricted."
        : undefined,
    }),
  },

  {
    id: "aonb",
    name: "Area of Outstanding Natural Beauty",
    description: "AONBs have landscape protection measures",
    severity: "restrictive",
    priority: 70,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.aonb,
      status: property.constraints.aonb ? "warning" : "pass",
      message: property.constraints.aonb
        ? "Property is within an Area of Outstanding Natural Beauty - landscape protection measures apply"
        : "Property is not within an Area of Outstanding Natural Beauty",
      confidenceImpact: property.constraints.aonb ? -1.0 : +0.5,
      details: property.constraints.aonb
        ? "Areas of Outstanding Natural Beauty have planning policies to conserve and enhance landscape character. Some permitted development may be restricted."
        : undefined,
    }),
  },

  // ADVISORY RULES (May affect specific types of development)
  {
    id: "tree-preservation-order",
    name: "Tree Preservation Order",
    description: "TPOs protect important trees and may affect development",
    severity: "advisory",
    priority: 60,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.tpo,
      status: property.constraints.tpo ? "warning" : "pass",
      message: property.constraints.tpo
        ? "Tree Preservation Order may affect development near protected trees"
        : "No Tree Preservation Orders identified",
      confidenceImpact: property.constraints.tpo ? -0.5 : +0.2,
      details: property.constraints.tpo
        ? "Tree Preservation Orders protect important trees. Development affecting protected trees requires consent from the local planning authority."
        : undefined,
    }),
  },

  {
    id: "flood-zone",
    name: "Flood Risk Zone",
    description: "Flood zones may have development restrictions",
    severity: "advisory",
    priority: 50,
    evaluate: (property: MockProperty): RuleResult => ({
      applies: property.constraints.floodZone,
      status: property.constraints.floodZone ? "warning" : "pass",
      message: property.constraints.floodZone
        ? "Property may be in a flood risk area - additional considerations may apply"
        : "No significant flood risk identified",
      confidenceImpact: property.constraints.floodZone ? -0.5 : +0.2,
      details: property.constraints.floodZone
        ? "Properties in flood risk areas may have restrictions on certain types of development, particularly extensions and outbuildings."
        : undefined,
    }),
  },
]

// Rules engine class
export class PlanningRulesEngine {
  private rules: PlanningRule[]

  constructor(rules: PlanningRule[] = planningRules) {
    this.rules = rules.sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
  }

  // Evaluate all rules for a property
  evaluate(property: MockProperty): RulesEngineResult {
    const ruleResults: RuleResult[] = []
    const primaryReasons: string[] = []
    let baseConfidence = 95.0
    let hasPermittedDevelopmentRights = true

    // Evaluate each rule
    for (const rule of this.rules) {
      const result = rule.evaluate(property)
      ruleResults.push(result)

      // Apply confidence impact
      baseConfidence += result.confidenceImpact

      // Check for blocking conditions
      if (result.applies && rule.severity === "blocking" && result.status === "fail") {
        hasPermittedDevelopmentRights = false
        primaryReasons.push(rule.name)
      }
    }

    // Generate planning checks from rule results
    const checks: PlanningCheck[] = ruleResults
      .filter((result) => result.applies || result.status === "pass")
      .map((result, index) => ({
        type: this.rules[index].name,
        status: result.status,
        description: result.message,
      }))

    // Ensure confidence is within reasonable bounds
    const confidence = Math.min(99.8, Math.max(75.0, baseConfidence))

    // If no blocking rules but restrictive rules apply, add context
    if (hasPermittedDevelopmentRights) {
      const restrictiveRules = ruleResults.filter(
        (result, index) => result.applies && this.rules[index].severity === "restrictive",
      )
      if (restrictiveRules.length > 0) {
        primaryReasons.push("Some restrictions may apply")
      }
    }

    return {
      hasPermittedDevelopmentRights,
      confidence,
      primaryReasons,
      checks,
      ruleResults,
    }
  }

  // Get detailed explanation for the decision
  generateSummary(property: MockProperty, result: RulesEngineResult): string {
    if (result.hasPermittedDevelopmentRights) {
      const restrictiveRules = result.ruleResults.filter(
        (ruleResult, index) => ruleResult.applies && this.rules[index].severity === "restrictive",
      )

      if (restrictiveRules.length === 0) {
        return "This property retains full Permitted Development rights. No significant restrictions found that would prevent standard residential development under PD rights."
      }

      const restrictions = restrictiveRules.map((_, index) => this.rules[index].name.toLowerCase())
      return `This property retains Permitted Development rights, though ${restrictions.join(" and ")} may apply additional considerations to certain types of development. Standard residential PD rights are generally available.`
    } else {
      const blockingReasons = result.primaryReasons.join(", ")
      const additionalContext = property.notes
        ? ` ${property.notes}`
        : " Consult your local planning authority before proceeding with any development."

      return `Planning permission will likely be required due to ${blockingReasons}.${additionalContext}`
    }
  }

  // Add a new rule to the engine
  addRule(rule: PlanningRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }

  // Get rules by severity
  getRulesBySeverity(severity: RuleSeverity): PlanningRule[] {
    return this.rules.filter((rule) => rule.severity === severity)
  }
}

// Default rules engine instance
export const defaultRulesEngine = new PlanningRulesEngine()
