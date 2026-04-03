# Account Profile Editing

## API proxy
- **Route:** `/api/account/profile`
  - **GET** → `${NEXT_PUBLIC_AUTH_BASE_URL}/api/customers/me?populate=lockerPreferences`
  - **PUT** → `${NEXT_PUBLIC_AUTH_BASE_URL}/api/customers/me`
- JWT is read from the `AUTH_TOKEN_KEY` cookie that AuthProvider sets. Requests inherit any locker preference relations.

### Request body (PUT)
```json
{
  "phone": "+447700900000",
  "telegramHandle": "locker_member",
  "preferredLocker": "locker_bt1",
  "marketingOptIn": true
}
```
- Phone uses loose E.164 validation (7–15 digits, optional leading `+`).
- Telegram allows 5–32 chars, alphanumeric + `_`, optional leading `@` (removed before sending).

## Frontend
- `/account` now renders a “Profile settings” form powered by React Hook Form + zod.
- Read-only: full name + email (pulled from Strapi `customers/me`).
- Editable: phone, Telegram handle, preferred locker select (options from `lockerPreferences`), marketing opt-in checkbox.
- Submit calls the PUT proxy, shows success/error state, then refreshes both the SWR customer query and `AuthProvider.refreshProfile()` so other components get the updated data.

## Validation rules
| Field | Rule |
| --- | --- |
| Phone | Empty allowed, otherwise `^\+?[0-9]{7,15}$` |
| Telegram | Empty allowed, otherwise `^@?[A-Za-z0-9_]{5,32}$` (stored without leading `@`) |
| Locker | Optional select populated from Strapi relation |
| Marketing opt-in | Boolean checkbox |

## UX notes
- Loading state: skeleton placeholders before profile data arrives.
- Error state: `StateMessage` with retry.
- Success toast: inline banner above the submit button.
- Non-authenticated users still see the existing “Please sign in” gate from `/account`.

## Security settings
- `/account/security` contains three blocks: password change, 2FA reminder, recent sessions.
- Change-password form calls `/api/account/security/change-password` (proxy → Strapi `/api/auth/change-password`). Validation: >=12 chars + upper/lower/number/symbol + confirmation.
- Recent sessions use `/api/account/security/devices` for now (fixtures). DELETE route signs-out a device (mock until backend ready).
- Two-factor section currently explains Telegram concierge approvals + future OTP roadmap.
- Copy reminder warns against saving passwords on shared devices.

## Telegram linking
- `/account/telegram` walks users through requesting a code, messaging @GreenHubBot, then confirming within 5 minutes.
- Uses `/api/account/telegram` (GET/DELETE), `/api/account/telegram/request-code` (POST), `/api/account/telegram/confirm` (POST).
- UI shows countdown timer, deep link, QR image via qrserver, clipboard copy, and unlink button once connected.
- Failure cases bubble up Strapi errors (expired code, already linked).

## Favorites
- API proxy: `/api/account/favorites` (GET returns metadata.favorites, POST/DELETE mutate metadata). Stores snapshots `{ productId, slug, title, strain, priceFrom, coverImage, addedAt }`.
- AuthProvider caches `favorites` + provides `addFavorite/removeFavorite/isFavorite` with optimistic updates.
- UI surfaces hearts on ProductCard + product hero; unauth users redirected to /register.
- `/favorites` page sorts by `addedAt`, shows `ProductCard` + “Add to cart / View details” CTAs with empty state reminder.
