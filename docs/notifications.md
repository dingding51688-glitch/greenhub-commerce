# Notifications

## Preferences API
- Endpoint: `/api/account/notifications` (proxy → `${NEXT_PUBLIC_AUTH_BASE_URL}/api/customers/me/notification-preferences`).
- GET returns `{ enableSystem, enableEmail, enableTelegram, enableSms, quietHours: { start, end } }`.
- PUT accepts the same shape; `enableSystem` is forced `true` client-side.
- Requires JWT cookie (`AUTH_TOKEN_KEY`).

## /account/notifications UI
- 4 toggles managed via React Hook Form + optimistic PUT (with automatic revalidation).
- System/in-app channel is read-only with reminder that critical alerts stay enabled.
- Telegram/SMS toggles disabled until the user adds a handle or phone (links to /support or /account).
- Quiet hours form uses `<input type="time">`; only mutes marketing pushes.
- Status banner confirms saves or surfaces errors.

## Notes
- Strapi lacking endpoint → fallback is storing in `customers.me.notificationPreferences`; call out in PR if backend missing fields.
- Tests: `pnpm run lint && pnpm run test` before shipping.

## Telegram linking
- Notification prefs depend on a linked Telegram handle.
- `/account/telegram` provides the linking flow; once linked, `/account/notifications` enables the Telegram toggle automatically.
- Codes expire after 5 minutes; new codes minted via `/api/account/telegram/request-code`.
