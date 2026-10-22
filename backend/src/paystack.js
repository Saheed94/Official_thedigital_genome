async function initializeTransaction({
  secretKey,
  email,
  amount,
  currency,
  callbackUrl,
  metadata,
}) {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      currency,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.status) {
    const message =
      (payload && payload.message) ||
      `Paystack initialize failed (${response.status})`;
    const err = new Error(message);
    err.paystack = payload;
    err.statusCode = 502;
    throw err;
  }

  return payload.data;
}

module.exports = { initializeTransaction };
