/**
 * Property API Utility
 * Fetches free property data from HM Land Registry and EPC Open Data.
 */

export interface PropertySummary {
    propertyType: string;
    bedrooms: number | string;
    receptions: number | string;
    tenure: string;
    lastSoldPrice: string;
    lastSoldDate: string;
    titleNumber: string;
    epcRating?: string;
}

import { determinePropertyType } from "./utils";

const EPC_BASE_URL = "https://epc.opendatacommunities.org/api/v1/domestic/search";

/**
 * Fetch property summary from free APIs.
 */
export async function fetchPropertySummary(address: string, postcode: string): Promise<PropertySummary | null> {
    console.log(`[Property API] Fetching data for: ${address}, ${postcode}`);
    try {
        const [hmlrData, epcData, titleNumber, propertyData, planningData] = await Promise.all([
            fetchHMLRData(postcode, address),
            fetchEPCData(postcode, address),
            fetchTitleNumber(postcode, address),
            fetchPropertyDataFromSource(postcode, address),
            fetchPlanningDescriptionData(postcode, address)
        ]);

        console.log(`[PropertyAPI] Results - HMLR: ${hmlrData ? 'Success' : 'No Data'}, EPC: ${epcData ? 'Success' : 'No Data'}, PropertyData: ${propertyData ? 'Success' : 'No Data'}, Planning: ${planningData ? 'Success' : 'No Data'}`);

        if (!hmlrData && !epcData && !propertyData && !planningData) {
            console.log("[PropertyAPI] Both APIs failed. Using address-based intelligent fallback.");
            const detectedType = determinePropertyType(address);

            // Map internal types to display types
            let displayType = "Residential Property";
            if (detectedType === "flat") displayType = "Flat / Apartment";
            else if (detectedType === "maisonette") displayType = "Maisonette";
            else if (detectedType === "commercial") displayType = "Commercial Building";
            else if (detectedType === "house") displayType = "Residential House";

            return {
                propertyType: displayType,
                bedrooms: "Information Unavailable",
                receptions: "Information Unavailable",
                tenure: "Information Unavailable",
                lastSoldPrice: "Market Estimate Unavailable",
                lastSoldDate: "No recent transaction info",
                titleNumber: "Lookup Unavailable",
            };
        }

        const propertyType = propertyData?.propertyType || (epcData?.isBungalow ? "Bungalow" : (epcData?.propertyType || hmlrData?.propertyType || (determinePropertyType(address) === "flat" ? "Apartment" : "Residential House")));

        // Intelligent fallback for bedrooms if no data found
        let bedrooms = propertyData?.bedrooms || epcData?.bedrooms || planningData?.bedrooms;
        if (!bedrooms) {
            if (propertyType.toLowerCase().includes("detached")) bedrooms = "3-5 (Estimated)";
            else if (propertyType.toLowerCase().includes("semi-detached")) bedrooms = "3-4 (Estimated)";
            else if (propertyType.toLowerCase().includes("terraced")) bedrooms = "2-3 (Estimated)";
            else if (propertyType.toLowerCase().includes("apartment") || propertyType.toLowerCase().includes("flat")) bedrooms = "1-2 (Estimated)";
            else bedrooms = "Information Unavailable";
        }

        return {
            propertyType,
            bedrooms,
            receptions: propertyData?.receptions || planningData?.receptions || "Information Unavailable",
            tenure: propertyData?.tenure || hmlrData?.tenure || "Information Unavailable",
            lastSoldPrice: propertyData?.lastSoldPrice ? `£${propertyData.lastSoldPrice.toLocaleString()}` : (hmlrData?.price ? `£${parseInt(hmlrData.price).toLocaleString()}` : "Market Estimate Unavailable"),
            lastSoldDate: propertyData?.lastSoldDate ? formatDate(propertyData.lastSoldDate) : (hmlrData?.date ? formatDate(hmlrData.date) : "No recent transaction info"),
            titleNumber: titleNumber || "Official Record Gated",
            epcRating: epcData?.epcRating || propertyData?.epcRating
        };
    } catch (error) {
        console.error("[PropertyAPI] Error:", error);
        return null;
    }
}

/**
 * Fetch data from HM Land Registry Price Paid Data (SPARQL).
 */
async function fetchHMLRData(postcode: string, address: string) {
    const cleanPostcode = formatPostcode(postcode);

    // Improved house number extraction: handles "Flat 1, 12 Baker St" -> "12" or "Flat 1"
    const houseNumberMatch = address.match(/(\d+[a-zA-Z]?)/);
    const houseNumber = houseNumberMatch ? houseNumberMatch[1].toLowerCase() : "";

    const streetNameMatch = address.split(",")[0].replace(/\d+/, "").trim().toLowerCase();

    console.log(`[HMLR] Searching for Postcode: ${cleanPostcode}, House Number: ${houseNumber}`);

    try {
        // Broad search by postcode first, sorted by latest transaction date
        const response = await fetch("https://landregistry.data.gov.uk/data/ppi/transaction-record.json?" + new URLSearchParams({
            "propertyAddress.postcode": cleanPostcode,
            "_pageSize": "200",
            "_sort": "-transactionDate",
        }));

        if (!response.ok) return null;
        const data = await response.json();
        const items = data.result?.items || [];

        if (items.length === 0) return null;

        // Helper to extract value or label from HMLR objects (JSON-LD)
        const getVal = (v: any): string => {
            if (v === null || v === undefined) return "";
            if (Array.isArray(v)) return getVal(v[0]);
            if (typeof v === 'object') {
                if (v._value !== undefined && v._value !== null) return String(v._value);
                if (v.label) return getVal(v.label);
                if (v.prefLabel) return getVal(v.prefLabel);
                return ""; // Don't return the object itself to avoid React crashes
            }
            return String(v);
        };

        // Sort items by date descending to get the latest transaction first
        const sortedItems = [...items].sort((a: any, b: any) => {
            const dateA = new Date(getVal(a.transactionDate)).getTime() || 0;
            const dateB = new Date(getVal(b.transactionDate)).getTime() || 0;
            return dateB - dateA;
        });

        // Robust matching logic on sorted items
        const match = sortedItems.find((item: any) => {
            const addr = item.propertyAddress;
            if (!addr) return false;

            const paon = getVal(addr.paon).toLowerCase();
            const saon = getVal(addr.saon).toLowerCase();
            const street = getVal(addr.street).toLowerCase();

            // Try to match house number/name first
            const houseMatch = houseNumber && (
                paon === houseNumber ||
                saon === houseNumber ||
                paon.includes(houseNumber) ||
                address.toLowerCase().includes(paon)
            );

            // Then check if street name is included
            const simplifiedStreet = streetNameMatch.replace(/\s+/g, "");
            const apiStreet = street.replace(/\s+/g, "");
            const streetMatch = simplifiedStreet && apiStreet.includes(simplifiedStreet);

            return houseMatch && streetMatch;
        }) || sortedItems.find((item: any) => {
            // Looser match if strict fails
            const paon = getVal(item.propertyAddress?.paon).toLowerCase();
            return houseNumber && paon === houseNumber;
        }) || sortedItems[0];

        if (match) {
            console.log(`[HMLR] Match found: ${getVal(match.propertyAddress?.paon)} ${getVal(match.propertyAddress?.street)} (${getVal(match.transactionDate)})`);
        }

        // Map Tenure more accurately
        const rawTenure = getVal(match.estateType);
        let tenure = "Unknown";
        if (rawTenure.toLowerCase().includes("freehold")) tenure = "Freehold";
        else if (rawTenure.toLowerCase().includes("leasehold")) tenure = "Leasehold";
        else tenure = rawTenure || "Information Unavailable";

        return {
            price: getVal(match.pricePaid),
            date: getVal(match.transactionDate),
            propertyType: getVal(match.propertyType) || "Unknown",
            tenure,
        };
    } catch (error) {
        console.error("[HMLR] Error processing data:", error);
        return null;
    }
}

/**
 * Fetch Title Number from HMLR Open Data (Title Number and UPRN dataset)
 */
async function fetchTitleNumber(postcode: string, address: string) {
    const cleanPostcode = formatPostcode(postcode);

    try {
        // This is a specialized lookup. HMLR provides a Title Number & UPRN dataset.
        // For this implementation, we search the PPI data again as some records contain the Title Number
        // or we use a simulated lookup if the specific open API is not directly reachable without a key.
        const response = await fetch("https://landregistry.data.gov.uk/data/ppi/transaction-record.json?" + new URLSearchParams({
            "propertyAddress.postcode": cleanPostcode,
            "_pageSize": "100",
        }));

        if (!response.ok) return null;
        const data = await response.json();
        const items = data.result?.items || [];

        // Try to find a match that includes a title number reference
        // In many HMLR JSON-LD responses, the title number is linked via hasTransaction -> hasPricePaidTransaction
        const match = items.find((item: any) => {
            const paon = String(item.propertyAddress?.paon || "").toLowerCase();
            return address.toLowerCase().includes(paon);
        }) || items[0];

        if (match && match.titleNumber) {
            return match.titleNumber;
        }

        // Return null to signify that a free lookup is not possible for Title Number
        // The UI will then show the "Official Record Gated" message
        return null;
    } catch (error) {
        console.error("[HMLR] Error fetching Title Number:", error);
        return null;
    }
}

/**
 * Fetch data from EPC Open Data.
 */
async function fetchEPCData(postcode: string, address: string) {
    const apiKey = process.env.NEXT_PUBLIC_EPC_API_KEY;
    if (!apiKey) {
        console.warn("EPC API Key missing. Skipping EPC data.");
        return null;
    }

    const cleanPostcode = formatPostcode(postcode);
    const houseNumberMatch = address.match(/(\d+[a-zA-Z]?)/);
    const houseNumber = houseNumberMatch ? houseNumberMatch[1].toLowerCase() : "";
    const streetNameMatch = address.split(",")[0].replace(/\d+/, "").trim().toLowerCase();

    console.log(`[EPC] Searching for Postcode: ${cleanPostcode}, House Number: ${houseNumber}, Street: ${streetNameMatch}`);

    try {
        const response = await fetch(`${EPC_BASE_URL}?postcode=${cleanPostcode}&size=100`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Basic ${apiKey}`,
            },
        });

        if (!response.ok) return null;
        const data = await response.json();
        const rows = data.rows || [];

        if (rows.length === 0) return null;

        // Better address matching for EPC
        const houseIdentifier = houseNumber || address.split(",")[0].toLowerCase().trim();

        const record = rows.find((r: any) => {
            const epcAddr = String(r["address"] || "").toLowerCase();
            const epcAddr1 = String(r["address1"] || "").toLowerCase();
            const epcAddr2 = String(r["address2"] || "").toLowerCase();
            const epcAddr3 = String(r["address3"] || "").toLowerCase();

            // Check if house number AND street name are present
            const hasHouse = epcAddr.includes(houseIdentifier) || epcAddr1.includes(houseIdentifier);
            const hasStreet = epcAddr.includes(streetNameMatch) || epcAddr1.includes(streetNameMatch);

            return hasHouse && hasStreet;
        }) || rows.find((r: any) => {
            // Fallback to just house number
            const epcAddr = String(r["address"] || "").toLowerCase();
            return houseNumber && epcAddr.includes(houseNumber);
        }) || rows[0];

        console.log(`[EPC] Match found: ${record["address"]}`);

        const rawType = record["property-type"] || "";
        const builtForm = record["built-form"] || "";
        const epcRating = record["current-energy-rating"] || "";
        const isBungalow = rawType.toLowerCase().includes("bungalow") || builtForm.toLowerCase().includes("bungalow");

        // Map EPC house types to user requested terms
        let displayType = rawType;
        if (isBungalow) displayType = "Bungalow";
        else if (rawType.toLowerCase().includes("house")) {
            if (builtForm.toLowerCase().includes("detached") && !builtForm.toLowerCase().includes("semi")) displayType = "Detached House";
            else if (builtForm.toLowerCase().includes("semi-detached")) displayType = "Semi-Detached House";
            else if (builtForm.toLowerCase().includes("terraced")) displayType = "Terraced House";
        }

        // Bedrooms calculation: EPC has number-habitable-rooms which includes living rooms
        // Usually, bedrooms = total rooms - (1 living room + 1 kitchen [not counted usually])
        // If habitable-rooms is 4, it's typically 3 bedrooms + 1 lounge.
        const habitableRooms = parseInt(record["number-habitable-rooms"] || "0");
        let estimatedBedrooms = habitableRooms > 1 ? (habitableRooms - 1).toString() : habitableRooms.toString();
        if (habitableRooms === 0) estimatedBedrooms = "Unavailable";

        // Bathrooms calculation: Estimate based on floor area or habitable rooms
        let estimatedBathrooms = "1";
        if (habitableRooms > 5) estimatedBathrooms = "2";
        if (habitableRooms > 8) estimatedBathrooms = "3";
        const floorArea = parseFloat(record["total-floor-area"] || "0");
        if (floorArea > 150) estimatedBathrooms = "3";
        else if (floorArea > 100 && estimatedBathrooms === "1") estimatedBathrooms = "2";

        return {
            propertyType: displayType,
            isBungalow,
            bedrooms: estimatedBedrooms,
            bathrooms: estimatedBathrooms,
            epcRating,
        };
    } catch {
        return null;
    }
}

/**
 * Ensures UK postcodes are formatted with a space before the last 3 characters.
 * Example: W1D1AN -> W1D 1AN
 */
function formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
    if (cleaned.length < 5) return cleaned; // Too short to be a full postcode
    // UK incode is always the last 3 characters
    const outcode = cleaned.slice(0, -3);
    const incode = cleaned.slice(-3);
    return `${outcode} ${incode}`;
}

function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}
/**
 * Fetch detailed property data from PropertyData.co.uk API
 */
async function fetchPropertyDataFromSource(postcode: string, address: string) {
    const apiKey = process.env.PROPERTYDATA_API_KEY;
    if (!apiKey) {
        console.warn("PropertyData API Key missing. Skipping detailed data lookup.");
        return null;
    }

    try {
        // PropertyData.co.uk "property/data" endpoint
        const url = `https://api.propertydata.co.uk/property/data?key=${apiKey}&postcode=${encodeURIComponent(postcode)}&address=${encodeURIComponent(address)}`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== "success") return null;

        const p = data.property;
        return {
            propertyType: p.type || p.style ? `${p.style || ''} ${p.type || ''}`.trim() : null,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            receptions: p.receptions,
            tenure: p.tenure,
            lastSoldPrice: p.last_sale_price,
            lastSoldDate: p.last_sale_date,
            epcRating: p.epc_current_energy_rating
        };
    } catch (error) {
        console.error("[PropertyData] Error:", error);
        return null;
    }
}

/**
 * Fetch planning history and extract room counts from descriptions as a key-less fallback
 */
async function fetchPlanningDescriptionData(postcode: string, address: string) {
    try {
        const pcode = postcode.replace(/\s+/g, "");
        const url = `https://www.planit.org.uk/api/applics/json?pcode=${pcode}&krad=0.2&limit=50`;

        const response = await fetch(url, {
            headers: { "Accept": "application/json", "User-Agent": "PlanningChecker/1.0" }
        });

        if (!response.ok) return null;
        const data = await response.json();
        const records = data.records || [];

        if (records.length === 0) return null;

        const streetNumberMatch = address.match(/(\d+[a-zA-Z]?)/);
        const streetNumber = streetNumberMatch ? streetNumberMatch[1].toLowerCase() : "";

        // Filter for applications likely related to this specific address
        const relevantRecords = records.filter((r: any) => {
            const appAddr = (r.address || "").toLowerCase();
            return streetNumber && appAddr.includes(streetNumber);
        });

        if (relevantRecords.length === 0) return null;

        let extracted = { bedrooms: null as any, bathrooms: null as any, receptions: null as any };

        // Process descriptions to find patterns
        relevantRecords.forEach((r: any) => {
            const desc = (r.description || "").toLowerCase();

            // Regex patterns for beds, baths, receptions
            const bedMatch = desc.match(/(\d+)\s*(?:bed|bedroom)/i);
            const bathMatch = desc.match(/(\d+)\s*(?:bath|bathroom)/i);
            const recepMatch = desc.match(/(\d+)\s*(?:recep|reception)/i);

            if (bedMatch && !extracted.bedrooms) extracted.bedrooms = bedMatch[1];
            if (bathMatch && !extracted.bathrooms) extracted.bathrooms = bathMatch[1];
            if (recepMatch && !extracted.receptions) extracted.receptions = recepMatch[1];
        });

        if (!extracted.bedrooms && !extracted.bathrooms && !extracted.receptions) return null;

        return extracted;
    } catch (error) {
        console.error("[PlanningParsing] Error:", error);
        return null;
    }
}
