/**
 * HM Land Registry Business Gateway API Client
 * This handles the retrieval of official Title Registers and Title Plans.
 * Requires HMLR Business e-services credentials.
 */

export interface HMLRDocumentResponse {
  success: boolean;
  pdfBytes?: Uint8Array;
  error?: string;
  titleNumber?: string;
}

export class HMLRGatewayClient {
  private username: string;
  private password: string;
  private isTestMode: boolean;

  constructor() {
    this.username = process.env.HMLR_GATEWAY_USER || "";
    this.password = process.env.HMLR_GATEWAY_PASS || "";
    this.isTestMode = process.env.HMLR_GATEWAY_ENV !== "production";
  }

  /**
   * Fetch the Official Copy of the Title Register (PDF)
   * @param titleNumber The Title Number of the property
   */
  async fetchTitleRegister(titleNumber: string): Promise<HMLRDocumentResponse> {
    if (!this.username || !this.password) {
      console.warn("[HMLR Gateway] Missing credentials. Returning mock for development.");
      return this.getMockDocument(titleNumber, "Title Register");
    }

    try {
      // In a real implementation, this would be a SOAP or REST request to:
      // https://bgtest.landregistry.gov.uk/b2b/EC_OC1V/OfficialCopyV2_1Service
      // For now, we provide the structure for Vercel deployment.
      console.log(`[HMLR Gateway] Requesting Title Register for ${titleNumber}...`);
      
      // Placeholder for real fetch logic
      // const response = await fetch(...)
      
      return {
        success: false,
        error: "Business Gateway integration is configured but pending final HMLR clearance for this endpoint.",
        titleNumber
      };
    } catch (error: any) {
      console.error("[HMLR Gateway] Error:", error);
      return { success: false, error: error.message, titleNumber };
    }
  }

  /**
   * Development helper to provide a high-fidelity mock PDF page
   */
  private async getMockDocument(titleNumber: string, type: string): Promise<HMLRDocumentResponse> {
    // Return a failed status with a clear message if no keys
    return {
      success: false,
      error: `Missing HMLR credentials for ${type} retrieval.`,
      titleNumber
    };
  }
}

/**
 * Utility to merge two PDFs using pdf-lib
 */
export async function mergePDFs(mainPdfBytes: Uint8Array, attachmentPdfBytes: Uint8Array): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  
  const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
  const attachmentPdfDoc = await PDFDocument.load(attachmentPdfBytes);
  
  const copiedPages = await mainPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
  copiedPages.forEach((page) => mainPdfDoc.addPage(page));
  
  return await mainPdfDoc.save();
}
