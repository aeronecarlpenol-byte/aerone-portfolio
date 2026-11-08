# Continuous homepage refinement

November 9, 2026.

The homepage now uses one document-origin dot grid and transparent section
surfaces through the footer. Its section spacing, heading gaps and alignment
share a common rhythm. Section dividers are removed; card boundaries and the
existing scroll-linked circuit route remain.

Only the five hero groups receive assemble classes, delays, observer triggers
or canvas assembly. Their original intro and replay timing is retained.
Projects and research no longer have separate scroll-entry delays. Gallery
opening/closing, image hover/color, navigation and rotating hero phrases remain.

Verification:

- All 47 Node tests pass. They cover hero-only assembly, readable nonhero
  content, reduced motion, gallery navigation and focus return, contact actions,
  scroll navigation, circuit routing, emblem rotation and particle lifecycle.
- Syntax checks and asset/link validation pass for the homepage, research
  archive and project pages; the static build succeeds.
- Source comparison confirms every anchor ID and all homepage content are
  preserved. Hero phrase styles and the entire scroll-path/emblem/particle
  script are unchanged.
- CSS review includes the shared desktop inset, stacked mobile layouts and the
  existing bottom-navigation safe area. The grid remains on the body, so its
  origin does not restart at section boundaries.

Visual verification limitation: Computer Use could not establish the active
browser URL and stopped browser control. The completed homepage has not been
visually checked at desktop/mobile widths in this run; no claim of rendered
overflow, overlap, spacing or real-device verification is made. Earlier browser
results in RESPONSIVE_REVIEW.md predate this change.

## Floating logos follow-up

Four original SVG symbols downloaded from the brands' own sites now sit above
the hero quote. A normal-flow container reserves their full height, with smaller
sizes on phones. Arrival, floating and hover transforms use separate elements;
floating pauses offscreen and reduced motion exposes all logos immediately.
This does not add assemble targets or change the circuit-path code.

The original 47 tests and three new logo lifecycle/fallback tests pass (50 in
total), and the build plus SVG parsing checks pass. A fresh browser attempt was
also blocked because Computer Use could not verify the active browser URL.
Desktop/mobile visual and overlap verification is still outstanding.
