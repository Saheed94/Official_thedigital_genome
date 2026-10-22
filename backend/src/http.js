function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let allowOrigin = "*";
  if (allowed.length === 1 && allowed[0] === "*") {
    allowOrigin = "*";
  } else if (origin && allowed.includes(origin)) {
    allowOrigin = origin;
  } else if (allowed.length > 0 && allowed[0] !== "*") {
    allowOrigin = allowed[0];
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event || event.body == null || event.body === "") return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function requestOrigin(event) {
  const headers = event.headers || {};
  return headers.origin || headers.Origin || "";
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = {
  corsHeaders,
  jsonResponse,
  parseBody,
  requestOrigin,
  isValidEmail,
};
