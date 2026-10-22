# Step 5 — Deploy Paystack payments (runbook)

This guide puts the code already in the repo onto AWS and Paystack.
**Nothing here creates infra automatically.** You (or an admin) create resources in the AWS Console / CLI.

For the full system diagram, see the root [README.md](../README.md).

**Architecture reminder**

| Piece | What it is |
|-------|------------|
| Main site | Existing S3 + CloudFront ? `thedigitalgenome.com` |
| Payment UI | New S3 + CloudFront ? later `pay.thedigitalgenome.com` |
| API | API Gateway + 2 Lambdas ? `/create-payment`, `/webhook` |
| Email | Amazon SES ? `support@thedigitalgenome.com` |
| Payments | Paystack (test keys first) |

Suggested region: **`us-east-1`** (same as the main site).

---

## Checklist (order)

1. [ ] Amazon SES — verify sender email  
2. [ ] Zip and create two Lambda functions  
3. [ ] API Gateway HTTP API + routes  
4. [ ] S3 + CloudFront for the `pay/` site  
5. [ ] Set `pay/config.js` ? `API_BASE_URL`  
6. [ ] Paystack webhook URL (test mode)  
7. [ ] End-to-end test with Paystack test card  
8. [ ] (Later) DNS `pay.thedigitalgenome.com`  
9. [ ] (Later) Live Paystack keys  

---

## 1. Amazon SES (email to support@)

1. AWS Console ? **Amazon SES** ? **Verified identities** ? **Create identity**.  
2. Verify **`support@thedigitalgenome.com`** (email verification) **or** verify the whole domain `thedigitalgenome.com` (DNS records).  
3. If the account is still in the **SES sandbox**, you can only send **to** verified addresses. For production, request **production access**.  
4. Note: webhook Lambda env will use:
   - `SES_FROM_EMAIL=support@thedigitalgenome.com`
   - `SUPPORT_EMAIL=support@thedigitalgenome.com`

Until SES is verified, the webhook still logs payments in CloudWatch; email is skipped if `SES_FROM_EMAIL` is missing.

---

## 2. Lambda functions

### 2.1 Build zip packages (on your machine)

```bash
cd backend
npm install
npm run zip:create-payment
npm run zip:webhook
```

Outputs:

- `backend/dist/create-payment.zip`
- `backend/dist/webhook.zip`

### 2.2 IAM role for Lambdas

Create an execution role (e.g. `tdg-pay-lambda-role`) with:

- AWS managed: **`AWSLambdaBasicExecutionRole`** (CloudWatch logs)
- Custom policy: see [`.github/iam-pay-lambda-policy.json`](../.github/iam-pay-lambda-policy.json) (`ses:SendEmail`)

### 2.3 Create Lambda: `tdg-create-payment`

| Setting | Value |
|---------|--------|
| Runtime | Node.js 20.x (or 18.x) |
| Handler | `src/createPayment.handler` |
| Architecture | x86_64 |
| Upload | `dist/create-payment.zip` |
| Timeout | 15 seconds |

**Environment variables**

| Key | Example |
|-----|---------|
| `PAYSTACK_SECRET_KEY` | `sk_test_…` (from Paystack Dashboard) |
| `PAY_SUCCESS_URL` | `https://YOUR_PAY_CLOUDFRONT_DOMAIN/success.html` (update after step 4) |
| `ALLOWED_ORIGIN` | `https://pay.thedigitalgenome.com,https://dxxxx.cloudfront.net,http://localhost:8080` |

### 2.4 Create Lambda: `tdg-webhook`

| Setting | Value |
|---------|--------|
| Runtime | Node.js 20.x (or 18.x) |
| Handler | `src/webhook.handler` |
| Upload | `dist/webhook.zip` |
| Timeout | 15 seconds |

**Environment variables**

| Key | Example |
|-----|---------|
| `PAYSTACK_SECRET_KEY` | same `sk_test_…` |
| `SUPPORT_EMAIL` | `support@thedigitalgenome.com` |
| `SES_FROM_EMAIL` | `support@thedigitalgenome.com` |

---

## 3. API Gateway (HTTP API)

1. **API Gateway** ? **Create API** ? **HTTP API**.  
2. Name: e.g. `tdg-pay-api`.  
3. Add integrations:
   - `tdg-create-payment`
   - `tdg-webhook`
4. Routes:

| Method | Path | Integration |
|--------|------|-------------|
| `POST` | `/create-payment` | `tdg-create-payment` |
| `OPTIONS` | `/create-payment` | `tdg-create-payment` (CORS preflight) |
| `POST` | `/webhook` | `tdg-webhook` |

5. Stage: `$default` (auto-deploy) or `prod`.  
6. Copy the **Invoke URL**, e.g.  
   `https://abc123.execute-api.us-east-1.amazonaws.com`  

That value is your **`API_BASE_URL`** (no trailing slash).

**CORS (optional extra):** You can also configure CORS on the HTTP API for `POST`/`OPTIONS` and origin `https://pay.thedigitalgenome.com`. The Lambda already returns CORS headers.

---

## 4. Payment static site (S3 + CloudFront)

### 4.1 S3 bucket

1. Create a bucket, e.g. `thedigitalgenome-pay-…` (unique name), region `us-east-1`.  
2. Block public access can stay **on** if CloudFront uses Origin Access Control (OAC) — recommended.  
3. Upload contents of the repo `pay/` folder to the bucket root:
   - `index.html`, `success.html`, `cancel.html`
   - `styles.css`, `config.js`, `pay.js`

### 4.2 CloudFront

1. Create a distribution.  
2. Origin = the pay S3 bucket (OAC).  
3. Default root object: `index.html`.  
4. Alternate domain names: leave empty until DNS (step 8).  
5. Copy the distribution domain: `https://dxxxxxxxx.cloudfront.net`

### 4.3 Point Lambda success URL at this site

Update `tdg-create-payment` env:

```text
PAY_SUCCESS_URL=https://dxxxxxxxx.cloudfront.net/success.html
```

### 4.4 Point the pay frontend at the API

Edit `pay/config.js` **before** (or after) upload:

```js
window.TDG_PAY_CONFIG = {
  API_BASE_URL: "https://abc123.execute-api.us-east-1.amazonaws.com",
  SUPPORT_EMAIL: "support@thedigitalgenome.com",
  MAIN_SITE_URL: "https://thedigitalgenome.com",
};
```

Re-upload `config.js` and invalidate CloudFront (`/*`).

Optional GitHub Action skeleton: [`.github/workflows/deploy-pay.yml`](../.github/workflows/deploy-pay.yml).

---

## 5. Paystack Dashboard (test mode)

1. Stay on **Test** mode.  
2. Confirm **international / USD** is enabled if you charge USD.  
3. **Settings ? API Keys & Webhooks**:
   - Webhook URL: `https://abc123.execute-api.us-east-1.amazonaws.com/webhook`
   - Events: at least **`charge.success`**
4. Save. Use **test** secret key in both Lambdas.

---

## 6. End-to-end test

1. Open the pay CloudFront URL.  
2. Confirm **Pay** buttons are enabled (API_BASE_URL set).  
3. Enter any valid email ? **Pay $100** (Beginner).  
4. Use a [Paystack test card](https://paystack.com/docs/payments/test-payments/), e.g. success card from their docs.  
5. You should:
   - Land on `success.html`
   - See the charge in Paystack Dashboard (test)
   - See `charge.success` in Lambda CloudWatch logs
   - Receive email at `support@…` if SES is verified  

If Pay fails to start: check Lambda logs for `create-payment` (keys, USD enabled, CORS).

---

## 7. Main site links

`index.html` already links to `https://pay.thedigitalgenome.com/`.

Until DNS exists, either:

- Temporarily change those hrefs to your **CloudFront pay URL**, or  
- Complete step 8 below.

Redeploy the main site as usual (existing workflow).

---

## 8. Custom domain `pay.thedigitalgenome.com`

1. **ACM** (must be **us-east-1** for CloudFront): request certificate for `pay.thedigitalgenome.com`.  
2. Validate via DNS (CNAME from ACM).  
3. CloudFront ? add alternate name `pay.thedigitalgenome.com` + attach the cert.  
4. Where **DNS** for `thedigitalgenome.com` is managed (Cloudflare, Route 53, or registrar):

   | Type | Name | Target |
   |------|------|--------|
   | CNAME (or ALIAS) | `pay` | `dxxxxxxxx.cloudfront.net` |

   If DNS is on **Cloudflare**, add the record there. If on **Route 53**, add it there.  
   (Your site is hosted on **AWS CloudFront**, not Cloudflare hosting.)

5. Update:
   - `PAY_SUCCESS_URL=https://pay.thedigitalgenome.com/success.html`
   - `ALLOWED_ORIGIN` to include `https://pay.thedigitalgenome.com`
   - Main site links (already correct)
   - Paystack callback is driven by `PAY_SUCCESS_URL`

---

## 9. Go live (only after tests pass)

1. Paystack ? **Live** mode ? new `sk_live_…` / `pk_live_…`.  
2. Replace Lambda `PAYSTACK_SECRET_KEY` with live secret.  
3. Set live webhook URL (same API path, or confirm it works for live).  
4. Confirm bank / USD settlement settings in Paystack.  
5. Do one small real payment, then refund if desired.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Pay buttons disabled | `pay/config.js` ? `API_BASE_URL` empty |
| CORS error in browser | `ALLOWED_ORIGIN` includes the exact pay origin; OPTIONS route exists |
| Paystack initialize error | Secret key; USD/international enabled; amount/currency |
| No support email | SES identity verified; `SES_FROM_EMAIL` set; Lambda IAM `ses:SendEmail`; sandbox recipients |
| Webhook 401 | Wrong secret key; body must be raw for signature (API Gateway should not rewrite body) |
| Success page but no email | CloudWatch `tdg-webhook` logs; SES errors |

---

## What this step did **not** do

- Create buckets, Lambdas, or DNS in your AWS account  
- Store your Paystack secret in git  
- Switch you to live payments  

When you want help executing Console/CLI steps interactively, say so and we can walk through them one resource at a time.
