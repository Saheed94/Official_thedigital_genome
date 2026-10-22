/**
 * AWS Lambda handler: POST /webhook
 *
 * Paystack Dashboard ? Settings ? API Keys & Webhooks ? Webhook URL:
 *   https://YOUR_API/webhook
 *
 * Subscribe to (at minimum): charge.success
 *
 * Required environment variables:
 *   PAYSTACK_SECRET_KEY  — same secret used for create-payment (signature verify)
 * Optional:
 *   SUPPORT_EMAIL        — default support@thedigitalgenome.com
 *   SES_FROM_EMAIL       — verified SES sender (e.g. support@thedigitalgenome.com)
 *                          If unset, webhook still succeeds but only logs (no email).
 *
 * Handler: src/webhook.handler
 */

const {
  verifyPaystackSignature,
  getRawBody,
  getPaystackSignature,
} = require("./verifyPaystack");
const { sendPaymentNotification } = require("./email");

exports.handler = async (event) => {
  const method =
    (event.requestContext &&
      event.requestContext.http &&
      event.requestContext.http.method) ||
    event.httpMethod ||
    "";

  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not set");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Webhook not configured" }),
    };
  }

  const rawBody = getRawBody(event);
  const signature = getPaystackSignature(event);

  if (!verifyPaystackSignature(rawBody, signature, secretKey)) {
    console.warn("Invalid Paystack webhook signature");
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid signature" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const eventType = payload.event;
  const data = payload.data || {};

  // Acknowledge quickly for events we ignore
  if (eventType !== "charge.success") {
    console.log("Ignoring Paystack event:", eventType);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: true, ignored: eventType }),
    };
  }

  const metadata = data.metadata || {};
  const details = {
    programme: metadata.programme || "",
    programmeName: metadata.programme_name || metadata.programme || "",
    customerEmail: (data.customer && data.customer.email) || data.email || "",
    amount: data.amount,
    currency: data.currency,
    reference: data.reference,
    status: data.status,
    paidAt: data.paid_at || data.paidAt || "",
    channel: data.channel || "",
  };

  console.log("charge.success", JSON.stringify(details));

  try {
    const emailResult = await sendPaymentNotification(details);
    console.log("notification", emailResult);
  } catch (err) {
    // Paystack will retry on non-2xx; log and still return 200 if payment
    // was valid so we do not loop forever on SES misconfiguration.
    // Ops can recover from CloudWatch logs.
    console.error("Failed to send support email:", err.message || err);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received: true }),
  };
};
