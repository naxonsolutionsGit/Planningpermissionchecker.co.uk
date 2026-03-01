
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

        const isThurrockUrl = result.checks.some(c => c.documentationUrl === "https://www.thurrock.gov.uk/work-that-needs-planning-permission/planning-constraints-map-information");

        if (isThurrockUrl) {
            console.log("\n✅ SUCCESS: Thurrock Council documentation links are correctly overridden.");
        } else {
            console.log("\n❌ FAILURE: Thurrock Council documentation links were not found.");
        }
    } catch (err) {
        console.error("Test error:", err);
    }
}

testThurrockLinks();
