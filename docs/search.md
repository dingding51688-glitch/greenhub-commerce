# Product Search

## API
- `lib/search-api.ts` exposes `searchProducts({ q, category, strain, potency, thc })`.
- Hits `${NEXT_PUBLIC_AUTH_BASE_URL}/api/products` with `filters[$or]` for keyword matches and direct filters for strain/potency/THC.
- Always requests `coverImage,weightOptions`; page size defaults to 12. If backend is missing, falls back to `productListingFallbacks` fixtures.

## /search UI
- Header with query input + CTA button. Submits update the URL (`/search?q=`) and stores recent searches (localStorage, latest 5).
- Filter chips for Strain, Potency, THC. Clicking toggles each filter; chips show active state.
- Results load via SWR + `ProductCard` (list variant); skeleton grid on load, `StateMessage` for empty/error.
- Reset button clears filters + query.

## Navigation integration
- Desktop header includes a search icon linking to `/search`.
- Mobile drawer adds a search field at the top; submitting closes the drawer and routes to `/search?q=`.

## Notes
- Strapi full-text endpoint not required yet; when available, update `searchProducts` to swap base URL.
- Keep query/filter combos in SWR key to leverage caching.
