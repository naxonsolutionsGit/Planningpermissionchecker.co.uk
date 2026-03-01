
import { checkPlanningRights } from "./lib/planning-api";

async function testThurrockLinks() {
    const thurrockAddress = "33 Camden Road, Chafford Hundred, Grays RM16 6PY";
    console.log(`Testing address: ${thurrockAddress}`);

    try {
        const result = await checkPlanningRights(thurrockAddress, 51.48, 0.3);
        console.log(`Local Authority: ${result.localAuthority}`);
        console.log(`Score: ${result.score}/6`);

        console.log("\nChecks found:");
        result.checks.forEach((check, i) => {
            console.log(`${i + 1}. ${check.type} [${check.status}]: ${check.documentationUrl}`);
        });

        const allThurrockUrls = result.checks.every(c => c.documentationUrl === "https://www.thurrock.gov.uk/work-that-needs-planning-permission/planning-constraints-map-information");
        const hasChecks = result.checks.length > 0;

        if (allThurrockUrls && hasChecks) {
            console.log("\n✅ SUCCESS: All Thurrock Council documentation links are correctly overridden.");
        } else {
            console.log("\n❌ FAILURE: Some or all Thurrock Council documentation links were not found or not overridden.");
            if (!hasChecks) console.log("Note: No checks were returned for this address.");
        }
    } catch (err) {
        console.error("Test error:", err);
    }
}

testThurrockLinks();
