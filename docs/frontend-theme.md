# Frontend Theme & Design Tokens

_Branch: `feature/fe-theme-tokens`_

## 1. Token Overview

| Token | Value / Usage |
| --- | --- |
| `night` palette | Legacy surface colors (`night-50` … `night-950`). Use for backgrounds + typography contrast. |
| `plum` palette | Primary purple accent; `plum-600` (`#7c3aed`) is the default CTA color. |
| `jade` palette | Success/CTA secondary color (`jade-500` = `#24b485`). |
| `amber` palette | Warning state + highlights. |
| `ink` palette | Neutral greys for text. |
| Fonts | `Space Grotesk` (body), `Sora` (display), `IBM Plex Mono` (numerics). Defined in `globals.css` + `tailwind.config.ts`. |
| Spacing | Custom scale (`2xs` → `2xl`) mapped to CSS variables and Tailwind spacing tokens (`px-sm`, `gap-lg`). |
| Radius | `sm/md/lg` map to CSS vars (8/12/16px equivalents). |
| Shadows | `shadow-surface`, `shadow-ring` for cards/buttons/focus states. |

Sources:
- `app/globals.css` → CSS variables + base layer.
- `tailwind.config.ts` → exposes colors, spacing, fonts, radii, shadows to Tailwind.

## 2. Core UI Components

Location: `components/ui/`

| Component | Props | Notes |
| --- | --- | --- |
| `Button` | `variant` (`primary` \| `secondary` \| `ghost`), `size` (`sm/md/lg`), `fullWidth` | Uses plum/jade tokens + focus ring. |
| `Card` | `variant` (`elevated` \| `outlined`), `padding`, slot props (`title/description/footer`) | Standard panel for dashboards & tiles. |
| `Input` | `isInvalid` flag | Dark-surface input with tokenized borders/focus states. |

Usage example:
```tsx
import { Button, Card, Input } from "@/components/ui";
```

## 3. Tailwind Usage Guide
- Colors: `bg-night-900`, `text-ink-400`, `border-plum-500`.
- Spacing: `px-sm`, `gap-lg`, `p-2xl` from custom scale.
- Shadows: `shadow-surface` for cards, `shadow-ring` for focus outlines.
- Radius: `rounded-lg` uses `--gh-radius-lg`.

## 4. Collaboration Rules
1. Other branches must `git fetch origin && git rebase origin/feature/fe-theme-tokens` before adding UI work; reuse tokens/components instead of hardcoding colors.
2. If new token/component is needed, update this document first, then add to `globals.css` + `tailwind.config.ts` + `components/ui/` in the same PR.
3. Components/ui is the single source for primitives; downstream features should compose from there.

## 5. Testing Checklist
- `pnpm lint` — ensure ESLint passes after adopting tokens & components.
- `pnpm dev` — smoke test interactive states (hover/focus for buttons/inputs).
- Document link must be included in PR descriptions.
