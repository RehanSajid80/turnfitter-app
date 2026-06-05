# TurnFitter — Design System

**The memorable thing:** *Every time something good happens, it flashes lime.* Rewards, "you're booked!", spots-left, streaks, check-ins — positive moments glow green against a confident violet brand. It makes the "reward-based" positioning *visible* and instantly ownable.

## Aesthetic
Energetic & bold, light-first. Clean violet-tinted surfaces, big confident headings, generous touch targets. Premium and motivating — never corporate, never bubbly. Two faces of one system:
- **Member-facing** (public booking, mobile): premium, trustworthy, glanceable — converts anonymous visitors.
- **Staff-facing** (dashboard): the same brand, a little denser and more utility.

## Color
| Token | Hex | Use |
|---|---|---|
| `brand` | `#6D28D9` | Primary brand — headers, primary buttons, brand moments |
| `brand-deep` | `#4C1D95` | Hover/depth, dark hero gradients |
| `brand-soft` | `#EDE9FE` | Tints, focus rings, subtle fills |
| `reward` | `#A3E635` | **The signature** — success, "booked!", spots-left, streaks, rewards |
| `reward-deep` | `#4D7C0F` | Reward text on light backgrounds (contrast) |
| `ink` | `#18122B` | Primary text (violet-black) |
| `muted` | `#6B7280` | Secondary text |
| `canvas` | `#F7F7FB` | Page background (violet-tinted) |
| `surface` | `#FFFFFF` | Cards |
| `line` | `#E9E7F2` | Borders |
| `danger` | `#E11D48` | Destructive / cancel |
| `amber` | `#F59E0B` | Warning / full class |

**Rule:** lime (`reward`) is *only* for positive/winning moments. Never decorative. That discipline is what makes it ownable.

## Typography
- **Clash Display** (600/700) — headings. Characterful, bold, memorable. Not the overused Inter/Poppins.
- **Plus Jakarta Sans** (400–800) — body & UI. Clean, friendly, crisp on small phones.
- Tabular numbers for all times, counts, prices.

## Spacing & Radius
4px base scale (4/8/12/16/24/40/64). Cards `rounded-2xl` (16px), buttons `rounded-xl` (12px), pills/badges full. Generous mobile padding; primary buttons ≥ 48px tall for thumbs.

## Motion
Quick and springy — 150–250ms ease-out. Buttons press in (`scale .98`) on tap. Success moments get a subtle lime pop. Skeletons over spinners. Never sluggish.

## Mobile-first rules (TurnFitter-specific)
- Members book on phones, staff check in on phones at the door → 48px touch targets, high contrast for bright-gym / dark-locker-room lighting.
- One primary action per screen — no mid-workout decision paralysis.
- Class time + availability + CTA glanceable in 2 seconds.

## Component personality
- **Buttons:** confident, rounded-xl. Primary = violet/white. Reward = lime/ink. Ghost = bordered white.
- **Cards:** white, soft violet-tinted border, gentle shadow, rounded-2xl.
- **Inputs:** generous, rounded-xl, violet focus ring.
- **Badges:** full-pill; lime for positive, amber for "full", rose for cancelled.

*Tokens live in `src/app/globals.css` (`@theme`). Fonts load via `@import` (Fontshare + Google).*
