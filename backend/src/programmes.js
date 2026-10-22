/**
 * Server-side price catalogue.
 * Amounts are in the smallest currency unit (USD cents).
 * Never trust amounts sent from the browser.
 */
const PROGRAMMES = {
  beginner: {
    id: "beginner",
    name: "Beginner Programme",
    duration: "4 weeks",
    amount: 10000, // $100.00
    currency: "USD",
  },
  intermediate: {
    id: "intermediate",
    name: "Intermediate Programme",
    duration: "8 weeks",
    amount: 25000, // $250.00
    currency: "USD",
  },
  advanced: {
    id: "advanced",
    name: "Advanced Programme",
    duration: "6 months",
    amount: 50000, // $500.00
    currency: "USD",
  },
};

function getProgramme(key) {
  if (!key || typeof key !== "string") return null;
  return PROGRAMMES[key.toLowerCase().trim()] || null;
}

module.exports = { PROGRAMMES, getProgramme };
