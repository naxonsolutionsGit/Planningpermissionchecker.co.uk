"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Mail, Printer, Share2, Settings, CheckCircle, AlertCircle } from "lucide-react"
import type { PropertyData } from "@/lib/advanced-data-sources"
import { ReportGenerator, REPORT_TEMPLATES, type ReportOptions, type ReportSection } from "@/lib/report-generator"

interface ReportGeneratorUIProps {
  propertyData: PropertyData
}

export function ReportGeneratorUI({ propertyData }: ReportGeneratorUIProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("detailed")
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    template: "detailed",
    includeMap: true,
    includeCharts: true,
    includeHistory: true,
    includeLegalDisclaimer: true,
    branding: true,
    confidential: false,
  })
  const [generatedReport, setGeneratedReport] = useState<ReportSection[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [customTitle, setCustomTitle] = useState("")

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const generator = new ReportGenerator(propertyData, {
        ...reportOptions,
        template: selectedTemplate,
        customTitle: customTitle || undefined,
      })
      const sections = generator.generateReport()
      setGeneratedReport(sections)
    } catch (error) {
      console.error("Report generation failed:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleOptionChange = (key: keyof ReportOptions, value: any) => {
    setReportOptions((prev) => ({ ...prev, [key]: value }))
  }

  const selectedTemplateData = REPORT_TEMPLATES.find((t) => t.id === selectedTemplate)
  const estimatedPages = selectedTemplateData?.pages || 0

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Report Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">Generate comprehensive planning reports for professional use</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Report Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select report template" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateData && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedTemplateData.format}</Badge>
                <span>~{estimatedPages} pages</span>
                <span>{selectedTemplateData.sections.length} sections</span>
              </div>
            )}
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="customTitle">Custom Report Title (Optional)</Label>
            <Input
              id="customTitle"
              placeholder="e.g., Planning Assessment for Development Proposal"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Report Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeMap" className="text-sm">
                  Include Interactive Map
                </Label>
                <Switch
                  id="includeMap"
                  checked={reportOptions.includeMap}
                  onCheckedChange={(checked) => handleOptionChange("includeMap", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeCharts" className="text-sm">
                  Include Charts & Visualizations
                </Label>
                <Switch
                  id="includeCharts"
                  checked={reportOptions.includeCharts}
                  onCheckedChange={(checked) => handleOptionChange("includeCharts", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeHistory" className="text-sm">
                  Include Planning History
                </Label>
                <Switch
                  id="includeHistory"
                  checked={reportOptions.includeHistory}
                  onCheckedChange={(checked) => handleOptionChange("includeHistory", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeLegal" className="text-sm">
                  Include Legal Disclaimer
                </Label>
                <Switch
                  id="includeLegal"
                  checked={reportOptions.includeLegalDisclaimer}
                  onCheckedChange={(checked) => handleOptionChange("includeLegalDisclaimer", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="branding" className="text-sm">
                  Include Company Branding
                </Label>
                <Switch
                  id="branding"
                  checked={reportOptions.branding}
                  onCheckedChange={(checked) => handleOptionChange("branding", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="confidential" className="text-sm">
                  Mark as Confidential
                </Label>
                <Switch
                  id="confidential"
                  checked={reportOptions.confidential}
                  onCheckedChange={(checked) => handleOptionChange("confidential", checked)}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerateReport} disabled={generating} className="w-full" size="lg">
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Professional Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Report Preview */}
      {generatedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#25423D]" />
                Report Generated Successfully
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Report Header */}
              <div className="border-b pb-4">
                <h1 className="text-2xl font-black mb-2">
                  {customTitle || `Planning Assessment Report - ${propertyData.address}`}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Generated: {new Date().toLocaleDateString()}</span>
                  <span>Pages: ~{estimatedPages}</span>
                  <span>Sections: {generatedReport.length}</span>
                  {reportOptions.confidential && <Badge variant="destructive">CONFIDENTIAL</Badge>}
                </div>
              </div>

              {/* Report Sections */}
              <div className="space-y-6">
                {generatedReport.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {section.type === "summary" && <AlertCircle className="h-4 w-4" />}
                      {section.type === "table" && <FileText className="h-4 w-4" />}
                      {section.type === "map" && <Settings className="h-4 w-4" />}
                      {section.type === "text" && <FileText className="h-4 w-4" />}
                      {section.title}
                    </h3>

                    {section.type === "table" && section.data ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border">
                          {section.data.headers && (
                            <thead>
                              <tr className="bg-muted">
                                {section.data.headers.map((header: string, index: number) => (
                                  <th key={index} className="border border-border p-2 text-left font-semibold">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {section.data.rows?.map((row: string[], rowIndex: number) => (
                              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="border border-border p-2">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : section.type === "summary" && section.data ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold">{section.data.constraints}</div>
                            <div className="text-sm text-muted-foreground">Total Constraints</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold text-red-600">{section.data.blocking}</div>
                            <div className="text-sm text-muted-foreground">Blocking</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold text-yellow-600">{section.data.restrictive}</div>
                            <div className="text-sm text-muted-foreground">Restrictive</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded">
                            <div className="text-2xl font-bold text-[#25423D]">{section.data.confidence}%</div>
                            <div className="text-sm text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm">{section.content}</pre>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm">{section.content}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Report Footer */}
              <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                <p>
                  This report was generated by PlanningCheckers.co.uk Advanced Planning Intelligence Platform
                  <br />
                  Report ID: PC-{Date.now()} | Generated: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
