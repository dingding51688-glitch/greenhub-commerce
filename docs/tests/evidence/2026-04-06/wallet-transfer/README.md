# Wallet transfer verification — 2026-04-06

- **Source handle (sender):** GH-CA3798BB (mafedex111@gmail.com)
- **Destination handle:** GH-842B3330 (QA test account)
- **Amount:** £20
- **Memo:** "QA transfer test"
- **Timestamp (UTC):** 2026-04-06T14:53:55Z

## Requests captured
1. `transfer-api-orders.txt` — POST `https://www.greenhub420.co.uk/api/account/transfers`
   - Result: `404 _not-found`, headers show `x-matched-path: /_not-found` (Next route missing).
2. `transfer-api-strapi.txt` — POST `https://www.greenhub420.co.uk/api/strapi/account/transfers`
   - Result: `200`, payload `{ "success": true, "transfer": { "reference": "TRF-1775487234620-3-4", ... } }`.

## Notes
- Next.js route `/api/account/transfers` is still absent in production (returns 404). The working endpoint remains the Strapi proxy (`/api/strapi/account/transfers`).
- Since the web UI currently relies on the proxy endpoint, the transfer succeeded only after calling `/api/strapi/...` directly.
- No UI screenshot was captured because the browser flow cannot finish until `/api/account/transfers` is deployed; attempting the documented endpoint triggers Next's not-found page.
- Please deploy the Next API route or update the front-end to continue using the Strapi proxy. Once `/api/account/transfers` is live, we can redo the flow with DevTools screenshots of the success toast.

## Follow-up: headless Playwright verification (2026-04-06T15:38Z)
- After deploying the `/api/account/transfers` proxy route, a headless Playwright script was used to log in, submit a £20 transfer to `GH-842B3330`, and capture both the API payload and UI state.
- Evidence:
  - `transfer-response-1775488300674.json` — response from `POST /api/account/transfers` showing `success: true`, reference `TRF-1775488300674-3-5`.
  - `transfer-success-1775488300674.png` — screenshot of the “转账成功” confirmation screen.
- Script: `scripts/wallet-transfer-playwright.mjs` (automates login, fills the form, waits for the success banner, saves artifacts automatically).
