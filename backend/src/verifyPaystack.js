const crypto = require("crypto");

/**
 * Paystack signs the raw request body with HMAC SHA512 using the secret key.
 * Header name: x-paystack-signature
 */
function verifyPaystackSignature(rawBody, signature, secretKey) {
  if (!secretKey || !signature || rawBody == null) return false;

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody, "utf8")
    .digest("hex");

  const expected = Buffer.from(hash, "utf8");
  const received = Buffer.from(String(signature), "utf8");

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

function getRawBody(event) {
  if (!event || event.body == null) return "";
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, "base64").toString("utf8");
  }
  return typeof event.body === "string" ? event.body : JSON.stringify(event.body);
}

function getPaystackSignature(event) {
  const headers = event.headers || {};
  return (
    headers["x-paystack-signature"] ||
    headers["X-Paystack-Signature"] ||
    ""
  );
}

module.exports = {
  verifyPaystackSignature,
  getRawBody,
  getPaystackSignature,
};
