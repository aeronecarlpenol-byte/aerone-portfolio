# Interactive hero and Skills & Tools

November 9, 2026.

The former hero logo constellation is replaced with seven small, individually
placed engineering keepsakes. They use inline original SVG artwork, gentle
floating, staggered entrances, terminal cursor blinking and low-amplitude mouse
parallax. Mobile retains four keepsakes and disables pointer parallax.

All nine requested technology symbols now live in Skills & Tools. When the
existing rotating marker reaches that section, their launch origin comes from
its real screen rectangle. The original route, rotation, year change and trail
script is unmodified. No second emblem is introduced.

The logos settle into reserved, responsive positions, remain softly floating,
and retain mouse/touch/keyboard dragging. Starting a drag cancels that logo's
flight. Resize or reduced-motion changes settle all flights immediately. Without
observers or a usable marker, the tools remain visible without a flight.

Verification covers:

- All 59 automated tests, including four new tests for emission timing, the
  actual marker origin, visible fallbacks, interrupted launches and parallax.
- Existing gallery, navigation, contact, drag/reset, hero-only assemble,
  year-transition, rotating-emblem and particle regression tests.
- Syntax and asset/link checks for the homepage and secondary pages, a complete
  static build, and XML parsing of the six additional SVG logo files.

Visual limitation: the browser tool stopped local-preview navigation because it
could not verify the active URL. Rendered desktop/mobile spacing, overlaps and
touch-device behavior were not visually verified in this run. The CSS reserves
space for both compositions and retains the existing section gutters and page
background; this source review is not a substitute for that visual check.
