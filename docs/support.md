# Support Hub

## Data sources
- `contactHeroDetails` & `contactChannels` from `data/fixtures/marketing.ts` power the hero stats + contact cards.
- `howItWorksFaq` (first two entries) plus page-specific FAQ copy cover locker/payments/ordering topics.
- Ticket form is currently a mock: submission waits 1.2s and surfaces a success banner. TODO: wire up Strapi endpoint (e.g., `/api/support-tickets`).

## Page structure (`/support`)
1. **Hero** — operating hours, secure chat blurb, quick contact chips. Copy CTA writes contact info to clipboard.
2. **Contact cards** — Telegram, email, wholesale/media, SMS hotline. Each card exposes “Open channel” + “Copy details” buttons.
3. **FAQ accordion** — locker issues, payment/wallet, tracking + two existing “How it works” FAQs.
4. **Ticket form** — collects topic, message (≥20 chars), optional order reference; shows inline `StateMessage` on success/error.

## Interactions
- Clipboard API used for hero chips + channel cards; fallback toast shown when copy fails.
- Buttons open `mailto:`, `sms:`, or external Telegram URLs in new tabs where relevant.
- Form uses React Hook Form + zod for validation; disable button while submitting.

## SLA / messaging
- Hero text states concierge cover 09:00–21:00 GMT and SMS is for emergencies. Success toast promises a 2-hour response window.
- Once Strapi endpoint exists, reuse the same schema to POST `{ topic, message, orderRef }`.
