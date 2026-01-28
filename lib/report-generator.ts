import type { PropertyData, PlanningConstraint } from "./advanced-data-sources"

export interface ReportSection {
  id: string
  title: string
  content: string
  type: "text" | "table" | "chart" | "map" | "summary"
  data?: any
  priority: number
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  format: "executive" | "detailed" | "technical" | "legal"
  pages: number
}

export interface ReportOptions {
  template: string
  includeMap: boolean
  includeCharts: boolean
  includeHistory: boolean
  includeLegalDisclaimer: boolean
  branding: boolean
  confidential: boolean
  customTitle?: string
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "executive",
    name: "Executive Summary",
    description: "Concise overview for decision makers",
    sections: ["summary", "key_findings", "recommendations", "legal"],
    format: "executive",
    pages: 2,
  },
  {
    id: "detailed",
    name: "Detailed Analysis",
    description: "Comprehensive planning assessment",
    sections: ["summary", "property_details", "constraints", "map", "history", "analysis", "recommendations", "legal"],
    format: "detailed",
    pages: 8,
  },
  {
    id: "technical",
    name: "Technical Report",
    description: "In-depth technical analysis for professionals",
    sections: [
      "summary",
      "methodology",
      "property_details",
      "constraints",
      "map",
      "history",
      "data_sources",
      "confidence",
      "analysis",
      "recommendations",
      "appendices",
      "legal",
    ],
    format: "technical",
    pages: 15,
  },
  {
    id: "legal",
    name: "Legal Compliance Report",
    description: "Focused on legal and compliance aspects",
    sections: ["summary", "legal_status", "constraints", "compliance", "recommendations", "legal"],
    format: "legal",
    pages: 6,
  },
]

export class ReportGenerator {
  private propertyData: PropertyData
  private options: ReportOptions

  constructor(propertyData: PropertyData, options: ReportOptions) {
    this.propertyData = propertyData
    this.options = options
  }

  generateReport(): ReportSection[] {
    const template = REPORT_TEMPLATES.find((t) => t.id === this.options.template)
    if (!template) throw new Error("Invalid template")

    const sections: ReportSection[] = []

    template.sections.forEach((sectionId, index) => {
      const section = this.generateSection(sectionId, index + 1)
      if (section) sections.push(section)
    })

    return sections
  }

  private generateSection(sectionId: string, priority: number): ReportSection | null {
    switch (sectionId) {
      case "summary":
        return this.generateSummarySection(priority)
      case "property_details":
        return this.generatePropertyDetailsSection(priority)
      case "constraints":
        return this.generateConstraintsSection(priority)
      case "map":
        return this.options.includeMap ? this.generateMapSection(priority) : null
      case "history":
        return this.options.includeHistory ? this.generateHistorySection(priority) : null
      case "analysis":
        return this.generateAnalysisSection(priority)
      case "recommendations":
        return this.generateRecommendationsSection(priority)
      case "legal":
        return this.options.includeLegalDisclaimer ? this.generateLegalSection(priority) : null
      case "methodology":
        return this.generateMethodologySection(priority)
      case "data_sources":
        return this.generateDataSourcesSection(priority)
      case "confidence":
        return this.generateConfidenceSection(priority)
      case "legal_status":
        return this.generateLegalStatusSection(priority)
      case "compliance":
        return this.generateComplianceSection(priority)
      case "appendices":
        return this.generateAppendicesSection(priority)
      default:
        return null
    }
  }

  private generateSummarySection(priority: number): ReportSection {
    const blockingConstraints = this.propertyData.constraints.filter((c) => c.severity === "blocking")
    const restrictiveConstraints = this.propertyData.constraints.filter((c) => c.severity === "restrictive")

    const status =
      blockingConstraints.length > 0 ? "BLOCKED" : restrictiveConstraints.length > 0 ? "RESTRICTED" : "PERMITTED"

    const confidence = this.calculateOverallConfidence()

    return {
      id: "summary",
      title: "Executive Summary",
      type: "summary",
      priority,
      content: `
**Property:** ${this.propertyData.address}
**UPRN:** ${this.propertyData.uprn}
**Local Authority:** ${this.propertyData.localAuthority}

**PERMITTED DEVELOPMENT STATUS: ${status}**

**Key Findings:**
- ${this.propertyData.passedChecks !== undefined && this.propertyData.totalChecks !== undefined ? `Checks Passed: ${this.propertyData.passedChecks}/${this.propertyData.totalChecks}` : `${this.propertyData.constraints.length} planning constraints identified`}
- ${blockingConstraints.length} blocking issues found
- ${restrictiveConstraints.length} restrictive conditions apply
- Overall confidence rating: ${confidence}%

**Summary:**
${this.generateStatusSummary(status, blockingConstraints, restrictiveConstraints)}
      `,
      data: {
        status,
        confidence,
        constraints: this.propertyData.constraints.length,
        blocking: blockingConstraints.length,
        restrictive: restrictiveConstraints.length,
      },
    }
  }

  private generatePropertyDetailsSection(priority: number): ReportSection {
    return {
      id: "property_details",
      title: "Property Details",
      type: "table",
      priority,
      content: "Comprehensive property information and location details",
      data: {
        rows: [
          ["Address", this.propertyData.address],
          ["UPRN", this.propertyData.uprn],
          ["Postcode", this.propertyData.postcode],
          ["Property Type", this.propertyData.propertyType],
          ["Local Authority", this.propertyData.localAuthority],
          ["Coordinates", `${this.propertyData.coordinates[1]}, ${this.propertyData.coordinates[0]}`],
          ["Last Updated", this.propertyData.lastUpdated.toLocaleDateString()],
        ],
      },
    }
  }

  private generateConstraintsSection(priority: number): ReportSection {
    const constraintData = this.propertyData.constraints.map((constraint) => [
      constraint.name,
      constraint.type.replace(/_/g, " "),
      constraint.severity,
      `${Math.round(constraint.confidence * 100)}%`,
      constraint.source,
    ])

    return {
      id: "constraints",
      title: "Planning Constraints Analysis",
      type: "table",
      priority,
      content: `Detailed analysis of ${this.propertyData.constraints.length} planning constraints affecting this property.`,
      data: {
        headers: ["Constraint", "Type", "Severity", "Confidence", "Source"],
        rows: constraintData,
      },
    }
  }

  private generateAnalysisSection(priority: number): ReportSection {
    const analysis = this.generateDetailedAnalysis()
    return {
      id: "analysis",
      title: "Detailed Planning Analysis",
      type: "text",
      priority,
      content: analysis,
    }
  }

  private generateRecommendationsSection(priority: number): ReportSection {
    const recommendations = this.generateRecommendations()
    return {
      id: "recommendations",
      title: "Professional Recommendations",
      type: "text",
      priority,
      content: recommendations,
    }
  }

  private generateLegalSection(priority: number): ReportSection {
    return {
      id: "legal",
      title: "Legal Disclaimer",
      type: "text",
      priority,
      content: `
**IMPORTANT LEGAL NOTICE**

This report is provided for informational purposes only and should not be considered as legal advice. The information contained herein is based on publicly available data sources and may not reflect the most current planning regulations or site-specific conditions.

**Limitations:**
- Data accuracy depends on source reliability and update frequency
- Planning regulations may change without notice
- Site-specific conditions may affect permitted development rights
- Professional planning advice should be sought for specific applications

**Liability:**
PlanningCheckers.co.uk accepts no liability for decisions made based on this report. Users should verify all information with relevant local planning authorities before proceeding with any development.

**Data Sources:**
This report incorporates data from multiple authoritative sources including local planning authorities, government databases, and professional planning data providers.

Report generated on: ${new Date().toLocaleDateString()}
Confidence rating: ${this.calculateOverallConfidence()}%
      `,
    }
  }

  private generateMapSection(priority: number): ReportSection {
    return {
      id: "map",
      title: "Interactive Constraint Map",
      type: "map",
      priority,
      content: "Visual representation of planning constraints affecting the property location.",
      data: {
        center: this.propertyData.coordinates,
        constraints: this.propertyData.constraints,
      },
    }
  }

  private generateHistorySection(priority: number): ReportSection {
    const historyData = this.propertyData.planningHistory.map((app) => [
      app.reference,
      app.description,
      app.status,
      app.submittedDate.toLocaleDateString(),
      app.decisionDate?.toLocaleDateString() || "Pending",
    ])

    return {
      id: "history",
      title: "Planning Application History",
      type: "table",
      priority,
      content: `Historical planning applications for this property (${this.propertyData.planningHistory.length} found).`,
      data: {
        headers: ["Reference", "Description", "Status", "Submitted", "Decision"],
        rows: historyData,
      },
    }
  }

  private generateMethodologySection(priority: number): ReportSection {
    return {
      id: "methodology",
      title: "Assessment Methodology",
      type: "text",
      priority,
      content: `
**Data Collection:**
This assessment utilizes multiple authoritative data sources including government databases, local planning authority records, and professional planning intelligence platforms.

**Analysis Framework:**
1. Property identification and validation
2. Constraint identification from multiple sources
3. Severity assessment based on planning regulations
4. Confidence calculation using data quality metrics
5. Professional interpretation and recommendations

**Quality Assurance:**
- Multi-source data verification
- Automated consistency checks
- Regular data source monitoring
- Professional review processes

**Confidence Scoring:**
Confidence ratings are calculated based on data source reliability, recency, and consistency across multiple sources.
      `,
    }
  }

  private generateDataSourcesSection(priority: number): ReportSection {
    const sources = Array.from(new Set(this.propertyData.constraints.map((c) => c.source)))
    return {
      id: "data_sources",
      title: "Data Sources",
      type: "text",
      priority,
      content: `
**Primary Data Sources:**
${sources.map((source) => `- ${source}`).join("\n")}

**Data Currency:**
All data sources are monitored for updates and the report reflects the most recent available information as of the generation date.

**Source Reliability:**
Each data source is assigned a reliability rating based on accuracy, update frequency, and official status.
      `,
    }
  }

  private generateConfidenceSection(priority: number): ReportSection {
    const confidence = this.calculateOverallConfidence()
    return {
      id: "confidence",
      title: "Confidence Assessment",
      type: "text",
      priority,
      content: `
**Overall Confidence Rating: ${confidence}%**

This rating reflects the reliability and consistency of the data used in this assessment.

**Factors Affecting Confidence:**
- Data source reliability and official status
- Recency of data updates
- Consistency across multiple sources
- Completeness of available information

**Confidence Breakdown:**
${this.propertyData.constraints.map((c) => `- ${c.name}: ${Math.round(c.confidence * 100)}%`).join("\n")}
      `,
    }
  }

  private generateLegalStatusSection(priority: number): ReportSection {
    const blockingConstraints = this.propertyData.constraints.filter((c) => c.severity === "blocking")
    const status =
      blockingConstraints.length > 0 ? "BLOCKED" : this.propertyData.constraints.length > 0 ? "RESTRICTED" : "PERMITTED"

    return {
      id: "legal_status",
      title: "Legal Planning Status",
      type: "text",
      priority,
      content: `
**CURRENT LEGAL STATUS: ${status}**

${this.generateLegalStatusExplanation(status, blockingConstraints)}

**Regulatory Framework:**
This assessment is based on current UK planning legislation including the Town and Country Planning Act 1990, the General Permitted Development Order 2015, and relevant local planning policies.
      `,
    }
  }

  private generateComplianceSection(priority: number): ReportSection {
    return {
      id: "compliance",
      title: "Compliance Requirements",
      type: "text",
      priority,
      content: `
**Compliance Obligations:**
Based on the identified constraints, the following compliance requirements apply:

${this.generateComplianceRequirements()}

**Next Steps:**
1. Verify findings with local planning authority
2. Obtain professional planning advice if proceeding
3. Consider pre-application discussions for complex cases
4. Ensure compliance with building regulations
      `,
    }
  }

  private generateAppendicesSection(priority: number): ReportSection {
    return {
      id: "appendices",
      title: "Appendices",
      type: "text",
      priority,
      content: `
**Appendix A: Technical Specifications**
- Data collection methodology
- Quality assurance procedures
- Confidence calculation algorithms

**Appendix B: Regulatory References**
- Relevant planning legislation
- Local planning policy references
- Government guidance documents

**Appendix C: Contact Information**
- Local planning authority contacts
- Professional planning consultants
- Additional resources and guidance
      `,
    }
  }

  private calculateOverallConfidence(): number {
    if (this.propertyData.constraints.length === 0) return 95
    const avgConfidence =
      this.propertyData.constraints.reduce((sum, c) => sum + c.confidence, 0) / this.propertyData.constraints.length
    return Math.round(avgConfidence * 100)
  }

  private generateStatusSummary(
    status: string,
    blockingConstraints: PlanningConstraint[],
    restrictiveConstraints: PlanningConstraint[],
  ): string {
    switch (status) {
      case "BLOCKED":
        return `Permitted Development rights have been removed or restricted by ${blockingConstraints.length} blocking constraint(s). Planning permission will be required for most development. Key blocking issues: ${blockingConstraints.map((c) => c.name).join(", ")}.`
      case "RESTRICTED":
        return `Permitted Development rights apply with restrictions. ${restrictiveConstraints.length} constraint(s) may limit the scope of permitted development. Professional advice recommended before proceeding.`
      case "PERMITTED":
        return "Full Permitted Development rights appear to apply to this property. Standard permitted development rules and limitations will apply as set out in the General Permitted Development Order."
      default:
        return "Status could not be determined from available data."
    }
  }

  private generateDetailedAnalysis(): string {
    const analysis = []

    analysis.push("**Planning Context:**")
    analysis.push(
      `This property is located within the ${this.propertyData.localAuthority} planning authority area. The assessment has identified ${this.propertyData.constraints.length} relevant planning constraints that may affect permitted development rights.`,
    )

    if (this.propertyData.constraints.length > 0) {
      analysis.push("\n**Constraint Analysis:**")
      this.propertyData.constraints.forEach((constraint) => {
        analysis.push(
          `- **${constraint.name}**: ${constraint.description} (${constraint.severity} - ${Math.round(constraint.confidence * 100)}% confidence)`,
        )
      })
    }

    analysis.push("\n**Risk Assessment:**")
    const blockingCount = this.propertyData.constraints.filter((c) => c.severity === "blocking").length
    const restrictiveCount = this.propertyData.constraints.filter((c) => c.severity === "restrictive").length

    if (blockingCount > 0) {
      analysis.push(
        `HIGH RISK: ${blockingCount} blocking constraint(s) identified. Planning permission likely required for most development.`,
      )
    } else if (restrictiveCount > 0) {
      analysis.push(`MEDIUM RISK: ${restrictiveCount} restrictive constraint(s) may limit permitted development scope.`)
    } else {
      analysis.push("LOW RISK: No significant constraints identified that would prevent permitted development.")
    }

    return analysis.join("\n")
  }

  private generateRecommendations(): string {
    const recommendations = []
    const blockingConstraints = this.propertyData.constraints.filter((c) => c.severity === "blocking")
    const restrictiveConstraints = this.propertyData.constraints.filter((c) => c.severity === "restrictive")

    recommendations.push("**Professional Recommendations:**")

    if (blockingConstraints.length > 0) {
      recommendations.push(
        "1. **Seek Planning Permission**: Blocking constraints identified. Full planning application likely required.",
      )
      recommendations.push(
        "2. **Professional Consultation**: Engage a qualified planning consultant to assess options and prepare applications.",
      )
      recommendations.push(
        "3. **Pre-Application Advice**: Consider formal pre-application discussions with the local planning authority.",
      )
    } else if (restrictiveConstraints.length > 0) {
      recommendations.push(
        "1. **Detailed Assessment**: Restrictive constraints may limit development scope. Detailed assessment recommended.",
      )
      recommendations.push(
        "2. **Authority Consultation**: Discuss proposals with local planning authority before proceeding.",
      )
      recommendations.push("3. **Design Considerations**: Ensure proposals comply with identified restrictions.")
    } else {
      recommendations.push("1. **Permitted Development**: Standard permitted development rules appear to apply.")
      recommendations.push(
        "2. **Compliance Check**: Ensure proposals comply with permitted development size and design limits.",
      )
      recommendations.push("3. **Building Regulations**: Separate building regulations approval may be required.")
    }

    recommendations.push("\n**Next Steps:**")
    recommendations.push("- Verify findings with local planning authority")
    recommendations.push("- Obtain detailed site survey if proceeding")
    recommendations.push("- Consider neighbor consultation")
    recommendations.push("- Ensure compliance with building regulations")

    return recommendations.join("\n")
  }

  private generateLegalStatusExplanation(status: string, blockingConstraints: PlanningConstraint[]): string {
    switch (status) {
      case "BLOCKED":
        return `Permitted Development rights have been removed or significantly restricted. The following constraints prevent or severely limit permitted development: ${blockingConstraints.map((c) => c.name).join(", ")}. Planning permission will be required for most development proposals.`
      case "RESTRICTED":
        return "Permitted Development rights apply but with specific restrictions or limitations. Careful consideration of constraint requirements is necessary before proceeding with any development."
      case "PERMITTED":
        return "Full Permitted Development rights appear to apply, subject to standard permitted development rules and limitations as set out in the General Permitted Development Order 2015."
      default:
        return "Legal status could not be definitively determined from available data sources."
    }
  }

  private generateComplianceRequirements(): string {
    const requirements: string[] = []
    const constraintTypes = new Set(this.propertyData.constraints.map((c) => c.type))

    constraintTypes.forEach((type) => {
      switch (type) {
        case "conservation_area":
          requirements.push("- Conservation Area Consent may be required for certain works")
          requirements.push("- Design must preserve or enhance the character of the conservation area")
          break
        case "listed_building":
          requirements.push("- Listed Building Consent required for alterations")
          requirements.push("- Works must preserve the special architectural or historic interest")
          break
        case "article_4":
          requirements.push("- Planning permission required for works normally permitted under PD rights")
          requirements.push("- Compliance with specific Article 4 Direction requirements")
          break
        case "national_park":
          requirements.push("- Enhanced design and environmental considerations apply")
          requirements.push("- Stricter size and appearance limitations")
          break
      }
    })

    return requirements.length > 0 ? requirements.join("\n") : "No specific compliance requirements identified."
  }
}
