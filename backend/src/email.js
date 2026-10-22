const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

/**
 * Sends a plain-text notification via Amazon SES.
 *
 * Env:
 *   SUPPORT_EMAIL  — destination (default support@thedigitalgenome.com)
 *   SES_FROM_EMAIL — verified SES identity (required to send)
 *   AWS_REGION     — set automatically on Lambda
 */
async function sendPaymentNotification(details) {
  const to = process.env.SUPPORT_EMAIL || "support@thedigitalgenome.com";
  const from = process.env.SES_FROM_EMAIL;

  if (!from) {
    console.warn(
      "SES_FROM_EMAIL is not set — skipping email. Payment still recorded in logs."
    );
    return { sent: false, reason: "SES_FROM_EMAIL not configured" };
  }

  const amountMajor =
    details.amount != null
      ? (Number(details.amount) / 100).toFixed(2)
      : "unknown";

  const subject = `[TDG Payment] ${details.programmeName || details.programme || "Programme"} — ${details.currency || "USD"} ${amountMajor}`;

  const lines = [
    "A training payment was confirmed via Paystack.",
    "",
    `Programme:     ${details.programmeName || details.programme || "—"}`,
    `Customer:      ${details.customerEmail || "—"}`,
    `Amount:        ${details.currency || "USD"} ${amountMajor}`,
    `Reference:     ${details.reference || "—"}`,
    `Status:        ${details.status || "—"}`,
    `Paid at:       ${details.paidAt || "—"}`,
    `Channel:       ${details.channel || "—"}`,
    "",
    "Next steps: send Zoom / cohort access to the customer email above.",
    "Certificate: only after payment + programme completion.",
  ];

  const client = new SESClient({
    region: process.env.AWS_REGION || process.env.SES_REGION || "us-east-1",
  });

  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: lines.join("\n"), Charset: "UTF-8" },
        },
      },
    })
  );

  return { sent: true, to };
}

module.exports = { sendPaymentNotification };
