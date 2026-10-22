/**
 * Payment site configuration.
 *
 * STEP 1–2: Leave API_BASE_URL empty until API Gateway is deployed.
 * After Step 2 deploy: set to your API base (no trailing slash), e.g.:
 *   "https://xxxxxxxx.execute-api.us-east-1.amazonaws.com"
 *
 * The frontend calls: POST {API_BASE_URL}/create-payment
 */
window.TDG_PAY_CONFIG = {
  API_BASE_URL: "https://l9wed1qmk5.execute-api.us-east-1.amazonaws.com",
  SUPPORT_EMAIL: "support@thedigitalgenome.com",
  MAIN_SITE_URL: "https://thedigitalgenome.com",
};
