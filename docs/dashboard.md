# Customer Dashboard (`/dashboard`)

## Data sources
- Wallet balance: `GET /api/wallet/balance` via `swrFetcher` (refresh interval 60s).
- Orders snapshot: `listMyOrders({ page: 1, pageSize: 2 })` from `lib/orders-api.ts` (Strapi `/api/orders/mine`).
- Notifications preview: `NotificationProvider` context (latest 3 items, unread count).
- Referral mini-card: `getReferralSummary()` (`/api/referrals/me`).
- Withdrawals: temporary fallback fixture until `/api/withdrawals/mine` is exposed.

## Layout
1. **Hero** — greeting with member name + CTA to `/products` and `/support`.
2. **Wallet widget** — balance, lifetime top-up, quick buttons (Top-up → `/checkout#topup`, Withdraw → `/support`), placeholder withdrawal list.
3. **Orders** — latest two orders with status pill + “View all orders” button.
4. **Notifications** — preview of three items + unread count + CTA to `/notifications` + refresh button.
5. **Referral** — code、点击/CTR、转化率、点击奖励 vs 本月佣金，按钮跳转 `/referral` + 复制链接。
6. **Support** — card pointing to `/support` hub.

## Notes
- Clipboard copy in referral card is wrapped in `try/catch`; no toast yet (optional enhancement).
- Withdrawals currently display mock data; once Strapi endpoint exists, replace `fallbackWithdrawals` with real SWR fetch.
- Page reuses `StatusPill` helper for consistent status styling.

## Metrics
- `ctr`/`conversionRate` 为 0-1 之间的小数，前端显示为百分比。
- 点击奖励 = `clickPayoutTotal`（£0.30/click），消费奖励 = `bonusEarned - clickPayoutTotal`。
- `monthCommission`（若后端提供）用于展示本月佣金，否则默认为 0。
