
import { checkPlanningRights } from "./lib/planning-api";

async function verify() {
    const addresses = [
        "33 Camden Road, Chafford Hundred, Grays RM16 6PY", // Thurrock
        "10 Downing Street, London SW1A 2AA" // Not Thurrock
    ];

    for (const address of addresses) {
        console.log(`\nTesting: ${address}`);
        try {
            const result = await checkPlanningRights(address);
            console.log(`Council: ${result.localAuthority}`);
            result.checks.forEach(check => {
                console.log(`- ${check.type} [${check.status}]: ${check.documentationUrl}`);
            });
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

verify();
