# Design Brief

## Direction

Nocturne Stream — a cinematic dark video platform where amber-gold energy meets cool cyan precision.

## Tone

Premium modern-tech dark mode: deep charcoal surfaces with sharp amber accents and confident, tight typography.

## Differentiation

A floating four-button bottom nav with a glowing amber active state, and video cards that lift on a soft elevated shadow — the app feels like a premium streaming theater, not a generic feed.

## Color Palette

| Token      | OKLCH        | Role                                  |
| ---------- | ------------ | ------------------------------------- |
| background | 0.15 0.014 265 | Deep charcoal canvas                |
| foreground | 0.95 0.008 265 | Primary text                        |
| card       | 0.19 0.016 265 | Video cards, nav, raised surfaces   |
| primary    | 0.78 0.16 78   | Amber-gold: CTAs, active nav, coins |
| accent     | 0.78 0.14 195  | Electric cyan: progress, live, links |
| muted      | 0.24 0.02 265  | Inactive fills, metadata text        |
| destructive| 0.62 0.2 25    | Errors, delete actions               |

## Typography

- Display: Space Grotesk — wordmark, page headings, card titles (bold, tight tracking)
- Body: Plus Jakarta Sans — UI labels, descriptions, metadata
- Mono: JetBrains Mono — view counts, coin balances, timestamps
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Layered dark surfaces: background < card < popover, each with a subtle 1px border; cards use `shadow-subtle`, hover uses `shadow-elevated`, bottom nav uses `shadow-nav-raised`.

## Structural Zones

| Zone    | Background        | Border        | Notes                                        |
| ------- | ----------------- | ------------- | -------------------------------------------- |
| Header  | bg-card           | border-b      | Wordmark left, coin chip + avatar right      |
| Content | bg-background     | —             | Feed cards on bg-card; alternate muted/30    |
| Footer  | bg-card raised    | border-t      | Fixed four-button nav, shadow-nav-raised     |

## Spacing & Rhythm

Spacious mobile-first: `px-4` gutters, `gap-4` between cards, `py-6` section gaps, `gap-2` inside metadata rows.

## Component Patterns

- Buttons: pill (`rounded-full`) for primary amber CTAs; `rounded-xl` for secondary; hover lifts with `shadow-elevated` and `transition-smooth`
- Cards: `rounded-xl` (12px), `bg-card`, `border border-border`, `shadow-subtle`, hover `shadow-elevated`
- Badges: pill, uppercase `text-[10px]` — TRENDING amber, LIVE cyan with `animate-pulse-live`
- Thumbnails: 16:9, `rounded-xl`, overflow-hidden

## Motion

- Entrance: `animate-fade-rise` staggered on feed cards, 0.45s cubic-bezier
- Hover: card lift + shadow shift via `transition-smooth` (0.3s)
- Decorative: `animate-pulse-live` on LIVE badges, `animate-shimmer` on skeletons

## Constraints

- Dark mode only; no light theme
- All colors via semantic OKLCH tokens — no raw hex or arbitrary Tailwind colors
- No live-audio, earnings/withdrawal, comments, or search UI

## Signature Detail

The floating bottom nav with an amber-glow active tab and a top-raised shadow — the single element that makes every screen instantly recognizable.
