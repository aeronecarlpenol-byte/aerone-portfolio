# Electromagnetic scroll core — November 9, 2026

Replaces only the scroll indicator artwork and its energy/trail behavior.
The existing route measurement function was compared byte-for-byte with its
pre-change copy and is unchanged. Scroll-to-distance mapping, reading-line
tracking, base rolling rotation, timeline year transitions and content/layout
are preserved. Skills releases still measure the existing single position group.

## Implementation

- Procedural nested SVG, with no PNG/GIF dependency: white/icy-blue radial core,
  cyan/teal field, three independently animated elliptical containment planes,
  charged particles, circuit brackets, thin arcs and fading wave rings.
- Size is 44px desktop and 30px at the existing mobile route breakpoint.
- Independent orbit periods are 6.8s, 9.1s and 11.3s; the middle orbit reverses.
  Pulse/arc/wave periods differ to avoid a single mechanical loop.
- Scroll distance and elapsed time produce a bounded velocity target. An
  exponential response smooths acceleration and decay; native animation rates
  rise up to four times idle. Glow/field/arc opacity follows the energy value.
  Native orbit timelines retain their phase when rates change.
- The JS energy loop stops after decay. Idle motion runs through native Web
  Animations/CSS instead of a permanent JS frame loop. Hidden tabs pause orbit
  timelines and CSS motion, clear the trail and discard velocity. Reduced
  motion keeps a static core and removes ripples/trail/boost.
- Sparse trail retains the existing direction, spacing, rate and population
  caps (8 desktop, 4 mobile), with cyan sparks, short trace segments, electrons,
  filaments and small pulses. It begins behind the core and clears on jumps.
- Every energy/path element remains pointer-events:none and aria-hidden.
  No new controls, dependencies, background effects or other sections were added.

## Verification

- 61 tests pass, including new tests for procedural orbit structure,
  counter-rotation, velocity boost/decay, no idle JS loop, hidden-tab pause and
  reduced motion. Existing route, reverse scroll, year, particle cap/cleanup,
  Skills choreography, non-draggable logos, navigation, galleries and contact
  behavior remain covered.
- Syntax and asset checks and the static build pass.
- Live Vercel deployment inspected on desktop and at 390x844. All three ellipse
  centers match the heart center (within .001 CSS px in sampled DOM geometry).
  Visual QA caught an initial SVG transform pivot offset; orbit, heart and wave
  origins were corrected to user-space (0,0) before completion.
- Actual incremental scrolling produced nonzero energy (.106 in one sampled
  frame), and idle returned to zero. Trail sparks were visible behind the core.
- One existing field-path remains. No console errors or horizontal document
  overflow were found. Mobile core width is 30px and effects do not intercept
  input. Browser snapshots are ignored local QA artifacts under
  tests/.verification/energy-core-desktop.jpg and energy-core-phone.jpg.

No browser performance trace or physical touch-device test was available;
sustained 60 FPS is an optimization target, not a measured guarantee. OS-level
motion preferences were covered by simulated preference-change tests rather
than manually switching the operating system setting.

