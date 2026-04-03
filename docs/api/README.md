# Auth API Notes

## Register proxy (`/api/auth/register`)
- **Method:** POST
- **Body:**
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "hunter2!!",
    "phone": "+44 7700 900000",
    "telegramHandle": "janedoe420"
  }
  ```
- **Behavior:** Forwards payload to `${NEXT_PUBLIC_AUTH_BASE_URL}/api/auth/local/register` with `username = fullName || email`. Custom fields (`fullName`, `phone`, `telegramHandle`) are passed straight through for the Users-Permissions profile.
- **Success response:** Mirrors Strapi ( `{ "jwt": string, "user": {...} }` ). JWT is persisted by `AuthProvider` for subsequent requests.
- **Failure response:** `{ error: { message: string } }` with Strapi status code (400 duplicate email, 422 validation, etc.).

## Environment
- `NEXT_PUBLIC_AUTH_BASE_URL` – Base URL of the Strapi Users-Permissions API (e.g., `https://cms.greenhub420.co.uk`). The register proxy and `AuthProvider` login call require this value.
- Optional fallback: `NEXT_PUBLIC_API_BASE_URL` (used if the dedicated auth env is missing).

## Testing
1. Ensure `NEXT_PUBLIC_AUTH_BASE_URL` points at a Strapi instance with registration enabled.
2. Issue a request:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Test User","email":"test+ts@greenhub.app","password":"Sup3rSecure","phone":"+447700900123","telegramHandle":"testuser"}' \
     https://<your-domain>/api/auth/register
   ```
3. Expect a 200 response with JWT + user profile. Errors bubble up with Strapi's message (e.g., `"Email is already taken."`).

## Login proxy (`/api/auth/login`)
- **Method:** POST
- **Body:**
  ```json
  {
    "identifier": "jane@example.com",
    "password": "hunter2!!"
  }
  ```
- **Behavior:** Forwards to `${NEXT_PUBLIC_AUTH_BASE_URL}/api/auth/local`. Error messages are normalized (invalid credentials, unconfirmed, blocked) so the UI can display friendly feedback.
- **Success response:** `{ "jwt": string, "user": {...} }` (Strapi default).
- **Headers:** Include the returned JWT in `Authorization: Bearer <token>` for `/api/auth/me` or other authenticated requests.
