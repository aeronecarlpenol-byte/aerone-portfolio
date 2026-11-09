# Skills distribution motion audit — November 9, 2026

Reference: https://iamkreezel.com/#skills

Inspected the live page, its outbound/settled states and its linked public script:
https://iamkreezel.com/_astro/Skills.astro_astro_type_script_index_0_lang.Dyu7lWJm.js

Re-downloading confirmed SHA-256
2E2619F166E85129C36E6F3C4D1E6E249DDFB71DC6A0166C5EB99986FE224733.
The reference uses GSAP/MotionPath/ScrollTrigger. This portfolio has no existing
GSAP dependency; its native Web Animations API implementation is retained.

## Verified reference parameters

| Phase | Reference value |
| --- | --- |
| Trigger | Workbench top crosses 62% of viewport height; once |
| Lead-in | 350ms + 40ms per category after the first: 550ms for six |
| Global logo releases | 32ms apart |
| Opacity entrance | 100ms, linear |
| Outbound flight | 600ms, cubic path with power1.in distance easing |
| Growth / rotation | power2.out; scale .3 to 1; rotation starts at -120 degrees times direction, ends randomly within +/-40 degrees |
| Airborne landing response | 70ms squash to scaleX 1.14 / scaleY .8, power2.out; 500ms elastic.out(1,.45) recovery |
| Gather start | Last release + 600ms + 350ms |
| Return to category | 650ms, power3.inOut |
| Category / intra-category return delays | 110ms / 20ms |
| Names | Gather + 600ms; 350ms expo.out; stagger 8ms |
| Leave section | Cancel temporary motion, expose normal content |

The reference also tips its cup. That cup-specific movement is intentionally
not applied to the portfolio's existing rolling emblem, whose appearance,
rotation and path must remain unchanged. The actual emblem rectangle is read
on each release frame, not cached before the delayed sequence.

## Implementation and bounds

Only js/personality.js's Skills distribution and its behavioral tests changed.
No HTML, SVG, category, border, typography, hover stylesheet, final placement,
navigation, hero animation or emblem/trail script changed.

One shared requestAnimationFrame clock replaces independent category timelines.
Native transform/opacity animations use sampled quadratic distance, cubic
growth, quartic return and elastic recovery functions. A cubic path is sampled
by arc length. Web Animation currentTime accounts for scheduling lateness.
Slots stay in document flow; no top/left layout properties animate and no clone
emblem, drag handlers, overlay interfaces or animation library is introduced.
Logo requests are made eager and decoding starts before the scroll trigger.

For the portfolio's 16 logos and six groups, relative to triggering:
first release 550ms; last release 1030ms; last outbound flight ends 1630ms;
first return starts 1980ms; final return ends 3200ms. The reference has 46 logos,
so its complete sequence is longer despite identical interval parameters.

This is a source-informed adaptation, not a claim of pixel-identical motion:
different artwork, emblem, category geometry, counts, randomized scatter,
native sampled easing and per-release origin tracking necessarily differ.

## Verification

- 58 tests pass, including global release intervals, fresh origin measurement
  after marker movement, gather/return beats, spring and name timing, preloading,
  reduced motion, no observer/marker fallback, focus, resize, hidden tabs and
  scroll-away cleanup. Existing hero, non-draggable logo, navigation, contact,
  gallery, rotation and trail regressions pass.
- Syntax/asset/link checks and the static build pass.
- Successful Vercel deployment of 40ccfcaa545a6525922a1854979106e42aafc35e
  was inspected. The airborne state visibly originates at the single emblem;
  final desktop state has all 16 logos visible and every logo transform cleared.
- Portfolio inspected at 1280x900 and 390x844: all SVGs loaded, no horizontal
  overflow, no console errors, and no persistent animation transforms.
- Reference inspected at the same 1280px width; its browser tab reported 720px
  height even after the viewport override. Thus an equal-height, frame-synced
  video comparison was not achieved. Source values and simulated-clock tests,
  rather than screenshots, substantiate the timing measurements.
- Browser performance tracing was unavailable. No measured 60 FPS or zero
  dropped-frame claim is made. Native touch hardware was not tested.
- Local ignored screenshots: tests/.verification/skills-motion-desktop.jpg and
  skills-motion-phone.jpg. Screenshots show final states, not temporal proof.

