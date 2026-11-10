# Skills logo animation architecture

The portfolio's native Web Animations API sequence is restored from working commit 205cc3040bb1366377eabcccfdcd4629fe289b7c. No animation dependency was added.

The single scroll orb is the launch origin. Each delayed release measures its current viewport position. Logos follow arc-length-sampled cubic flights, grow and rotate into a scattered arrangement, squash briefly on landing, then settle into their original categories. Labels fade into the settled positions. Final badge sizes, assets, hover rotation and keyboard focus remain unchanged.

| Phase | Portfolio timing |
| --- | --- |
| Trigger | Workbench top enters 62% of viewport; once |
| Lead-in | 550ms for six categories |
| Global release stagger | 32ms |
| Flight | 600ms |
| Scatter hold | 350ms after the final flight |
| Landing | 70ms squash and 500ms elastic recovery |
| Settle | 650ms, quartic easing |
| Category / item stagger | 110ms / 20ms |
| Label reveal | 350ms with 8ms stagger |

One animation-frame clock coordinates the sequence; transforms and opacity perform the visual movement. Leaving the section, focusing a badge, resizing during flight, hiding the tab or enabling reduced motion cancels temporary animations and exposes the normal content. Jumping completely past Skills before the trigger also reveals the normal layout, preventing a permanently hidden section.

Simulated-clock tests exercise release, origin measurement, return, spring, labels, fallbacks and cleanup. They do not measure device frame pacing or physical trackpad feel. Third-party asset notices remain in assets/brand/SOURCES.md and the bundled Lenis license.
