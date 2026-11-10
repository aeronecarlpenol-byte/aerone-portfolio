# Continuous cubic scroll path — November 9, 2026

Supersedes the earlier route geometry described in ENERGY_CORE_REVIEW.md.
The energy core artwork, sizes, native orbit periods and palette are unchanged.

## Portfolio implementation

The route uses cached DOM layout boxes and connected cubic curves with vertical endpoint tangents. The orb uses the same SVG path distance as the illuminated stroke, with a 45ms exponential settling response. Scroll movement stays in native document coordinates.

The former orthogonal polyline plus small quadratic corner rounds is replaced
by five connected cubic segments, including two lateral S-curves. There is one
move command, no separate subpaths, horizontal plateaus or angular joins.
The base and progress strokes share the exact same geometry. Blue styling and
rounded stroke caps/joins remain intact.

Crossings use actual About/Projects and Skills/GitHub container bounds and
computed content insets. Curves are checked against both neighboring content
rectangles with a reactor-sized clearance allowance. No section spacing or
content positions change. Unnecessary side changes around Projects/Research
are removed. Experience uses the outside lane instead of cutting across its
32–45px gaps, which cannot fit a 44px core plus a broad lateral curve. Existing
timeline content/markers and year/role reading-line synchronization remain.

## Rendering and lifecycle

The measured path length and monotone distance lookup are cached until resize,
font/image loading or ResizeObserver notifications require remeasurement.
Each scroll event schedules a passive, frame-coalesced update. A shared rendered
distance drives both the core position (getPointAtLength) and stroke dash offset.
Time-based exponential interpolation has no overshoot and works in reverse.
Rendering stops when the remaining distance is below .02px. Main-layout
coordinates are cached; the glide does not read main bounding rectangles.

Rolling rotation remains in its separate nested wrapper and accumulates actual
distance traveled at the existing speed. Geometry changes preserve the rolling
angle. The tilt wrapper no longer has a competing CSS transform transition.
The trail and reactor velocity respond to actual interpolated movement, not
only the frames with new scroll events. Reduced motion shows a complete trace
and a static core; hidden tabs cancel pending rendering and resume cleanly.

## Verification

- 64 automated tests pass, covering vertical tangent joins, monotonically
  increasing curve control points, two side changes, reversal/no overshoot,
  synchronized stroke/core distance, cached layout and rolling-angle continuity.
  Existing reactor, particles, years, Skills choreography, gallery, navigation,
  contact and reduced-motion behavior remain covered.
- Syntax, assets and static build checks pass. No HTML/content, section layout,
  brand assets, hero animation, Skills layout or energy-core styling changed.
- Deployed site visually inspected at 1280px and 1440px desktop widths, 768px
  tablet, 390px/360px phones and nominal 901px (reported as 902px by browser
  pixel rounding). Resizing rebuilds the route. A narrow-desktop 1–2px clearance
  issue caught during QA was corrected before completion.
- An audit sampled every cubic across the entire document against headings,
  paragraphs, visible image bounds (respecting existing clipping ancestors),
  project/Skills cards, the research collage and GitHub card. Final audits found
  no collisions within the core's solid radius plus .5px and no horizontal
  document overflow at the tested widths. Soft aura is decorative and ignores
  pointer events.
- Core positions sampled along straight lanes lie on the curve within rounding
  tolerance (approximately .001px); curve checks use sampled projection. Final
  rendered/target progress agrees. Exactly one route and one core are present.
- Navigation from hero to Contact reaches progress 1; reverse navigation through
  Experience/Projects retains alignment. Browser console error logs were empty.
- Ignored local screenshots: tests/.verification/fluid-path-desktop.jpg and
  fluid-path-phone.jpg show the section crossing and preserved content.

No browser performance trace or physical touch-device session was available.
The implementation avoids per-frame geometry rebuilds and uses native
transform animations, but sustained 60 FPS is not a measured guarantee.
