/**
 * Server-side price catalogue.
 * Amounts are in the smallest currency unit (kobo for NGN).
 * Never trust amounts sent from the browser.
 *
 * TEMP (testing): NGN while Paystack USD is not enabled for this merchant.
 * Intended USD list prices were $100 / $250 / $500.
 * Test conversion used here: ?1,500 per $1 (adjust before go-live).
 */
const PROGRAMMES = {
  beginner: {
    id: "beginner",
    name: "Beginner Programme",
    duration: "4 weeks",
    amount: 15000000, // ?150,000.00
    currency: "NGN",
  },
  intermediate: {
    id: "intermediate",
    name: "Intermediate Programme",
    duration: "8 weeks",
    amount: 37500000, // ?375,000.00
    currency: "NGN",
  },
  advanced: {
    id: "advanced",
    name: "Advanced Programme",
    duration: "6 months",
    amount: 75000000, // ?750,000.00
    currency: "NGN",
  },
};

function getProgramme(key) {
  if (!key || typeof key !== "string") return null;
  return PROGRAMMES[key.toLowerCase().trim()] || null;
}

module.exports = { PROGRAMMES, getProgramme };
