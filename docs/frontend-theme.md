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
| `Card` | `variant` (`elevated` \| `outlined`), `padding`, slot props (`title/description/footer`) | Standard panel for dashboards & tiles. Padding map: `sm → p-sm`, `md → p-md`, `lg → p-lg`. |
| `Input` | `isInvalid`, `disabled` | Dark-surface input with tokenized borders/focus states. `disabled` adds `opacity-60 cursor-not-allowed` and suppresses focus ring. |

Usage example:
```tsx
import { Button, Card, Input } from "@/components/ui";
```

## 3. Tailwind Usage Guide
- Colors: `bg-night-900`, `text-ink-400`, `border-plum-500`.
- Spacing: `px-sm`, `gap-lg`, `p-2xl` from custom scale.
- Shadows: `shadow-surface` for cards, `shadow-ring` for focus outlines.
- Radius: `rounded-lg` uses `--gh-radius-lg`.

## 4. Section Components
Location: `components/sections/`

| Component | Props | Notes |
| --- | --- | --- |
| `HeroClassic` | `title`, optional `subtitle`, `highlight`, CTA links, stats array | Default copy pulled from `data/fixtures/marketing.ts`. Designed for hero banner with gradient background. |
| `HowItWorksLocker` | `title`, `steps` (icon/title/description), optional tip bubble | Renders 3-column flow on desktop, stacked on mobile. |
| `ProductCollectionGrid` | `eyebrow`, `title`, `description`, `products`, `primaryCta` | Uses `ProductCardData` placeholders (image/title/category/price). |
| `PaymentRecommendation` | `recommendation`, `secondary[]`, `footnote` | Displays featured subscription + secondary plans. |

Default content for these sections lives in `data/fixtures/marketing.ts`. Feature teams can override props or inject live data.

## 5. Collaboration Rules
1. Other branches must `git fetch origin && git rebase origin/feature/fe-theme-tokens` before adding UI work; reuse tokens/components instead of hardcoding colors.
2. If new token/component/section is needed, update this document first, then add to `globals.css` / `tailwind.config.ts` / `components/ui` or `components/sections` within the same PR.
3. Components/ui is the single source for primitives; downstream features should compose from there.

## 6. Testing Checklist
- `pnpm lint` — ensure ESLint passes after adopting tokens & components.
- `pnpm test` — run Vitest suite (Buttons/Card/Input coverage).
- `pnpm dev` — smoke test interactive states (hover/focus) when wiring sections.
- Document link must be included in PR descriptions.
