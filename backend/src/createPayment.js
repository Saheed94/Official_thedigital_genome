/**
 * AWS Lambda handler: POST /create-payment
 *
 * Required environment variables:
 *   PAYSTACK_SECRET_KEY  — sk_test_… or sk_live_… (never expose to the browser)
 *   PAY_SUCCESS_URL      — e.g. https://pay.thedigitalgenome.com/success.html
 *                          (or your temporary CloudFront URL + /success.html)
 * Optional:
 *   ALLOWED_ORIGIN       — comma-separated origins, e.g.
 *                          https://pay.thedigitalgenome.com,http://localhost:8080
 *                          Default: *
 *
 * Request JSON body:
 *   { "programme": "beginner"|"intermediate"|"advanced", "email": "user@example.com" }
 *
 * Success response:
 *   { "authorization_url": "https://checkout.paystack.com/…", "reference": "…" }
 */

const { getProgramme } = require("./programmes");
const { initializeTransaction } = require("./paystack");
const {
  jsonResponse,
  parseBody,
  requestOrigin,
  isValidEmail,
  corsHeaders,
} = require("./http");

exports.handler = async (event) => {
  const origin = requestOrigin(event);
  const method =
    (event.requestContext &&
      event.requestContext.http &&
      event.requestContext.http.method) ||
    event.httpMethod ||
    "";

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(origin),
      body: "",
    };
  }

  if (method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, origin);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const successUrl = process.env.PAY_SUCCESS_URL;

  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not set");
    return jsonResponse(500, { error: "Payment service is not configured" }, origin);
  }

  if (!successUrl) {
    console.error("PAY_SUCCESS_URL is not set");
    return jsonResponse(500, { error: "Payment service is not configured" }, origin);
  }

  const body = parseBody(event);
  if (body === null) {
    return jsonResponse(400, { error: "Invalid JSON body" }, origin);
  }

  const programmeKey = body.programme;
  const email = typeof body.email === "string" ? body.email.trim() : "";

  const programme = getProgramme(programmeKey);
  if (!programme) {
    return jsonResponse(
      400,
      { error: "Unknown programme. Use beginner, intermediate, or advanced." },
      origin
    );
  }

  if (!isValidEmail(email)) {
    return jsonResponse(400, { error: "A valid email is required" }, origin);
  }

  try {
    const data = await initializeTransaction({
      secretKey,
      email,
      amount: programme.amount,
      currency: programme.currency,
      callbackUrl: successUrl,
      metadata: {
        programme: programme.id,
        programme_name: programme.name,
        duration: programme.duration,
        custom_fields: [
          {
            display_name: "Programme",
            variable_name: "programme",
            value: programme.name,
          },
        ],
      },
    });

    return jsonResponse(
      200,
      {
        authorization_url: data.authorization_url,
        reference: data.reference,
        access_code: data.access_code,
      },
      origin
    );
  } catch (err) {
    console.error("create-payment failed", err.message, err.paystack || "");
    return jsonResponse(
      err.statusCode || 502,
      { error: err.message || "Could not start payment" },
      origin
    );
  }
};
