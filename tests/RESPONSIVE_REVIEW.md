# Responsive navigation and scroll-path review

Reviewed November 8, 2026.

## Source and method

Browser review used a local snapshot of GitHub commit `0c8a2c64dde77b001853d3aec2df140c7ee8379d`, with the final navigation stylesheet and Research scroll-spy correction applied. Existing remote content, project galleries and routes were retained. Temporary preview files are not included in the commit.

| Viewport | Whole-homepage geometry audit |
| --- | --- |
| 360 × 800 | Passed |
| 390 × 844 | Passed |
| 768 × 1024 | Passed |
| 1024 × 900 | Passed |
| 1440 × 900 | Passed |
| 844 × 390 landscape | Passed |

At each width, measured the SVG route against rendered headings, paragraphs, links, controls, project piles, research collage, portrait and skill panels throughout the homepage. Sampled the actual M/L/Q geometry at intervals of at most 3 CSS pixels, with 6 pixels of additional clearance around measured content boxes. No path/content collisions, vertical backtracking or document-level horizontal overflow were found. The drawn and base path data match; the decorative SVG uses pointer-events: none. Corner controls are bounded by half of the adjoining segment lengths, and all straight connectors are orthogonal.

Viewport screenshots reviewed the hero, About, project transition, Research, experience/year display, education, skills, GitHub and Contact across representative mobile, tablet and desktop views. The browser backend could capture viewport screenshots but rejected a full-page screenshot; complete-page clearance was checked using rendered DOM bounds and path geometry rather than a stitched image.

## Corrections from the rendered review

- Aligned the hero to the same content system as other sections so the desktop portrait clears the path gutter; scaled its desktop heading to fit the narrower container.
- Stacked the university logo and name on phones and reduced card padding so the university name remains readable.
- Increased mobile dock label size and gave the hero text link, contact email and research lightbox close button comfortable touch targets.
- Mapped the Research page navigation item to the homepage Research preview for scroll tracking while keeping its existing /research destination.

## Interaction checks

- Home, About, Projects, Experience, Skills, GitHub and Contact anchors reached their sections below the header (approximately 112 CSS pixels from the viewport top).
- Research opens the existing research page; its return link works. Research is highlighted while its homepage preview is current.
- Active indicators follow clicks, manual keyboard scrolling, viewport changes and the document bottom. Contact is selected at the bottom. Desktop indicator alignment differed from the active link by less than 1 CSS pixel.
- Mobile menu labels, Enter/Tab navigation, visible keyboard focus and Escape/focus return work. All four mobile dock destinations work.
- Both project stories open, fit the viewport without internal horizontal overflow, scroll internally when needed, retain reachable close controls and restore focus on close. Single-image galleries accurately omit previous/next controls.
- The research photo lightbox fits the mobile viewport and closes with Escape.
- Resizing from phone portrait to landscape and back rebuilt the path without collisions. All nine visible homepage images were confirmed loaded during the phone checks; reload and subsequent viewport changes retained alignment.
- Scroll-linked signal progress advanced to 1 at the bottom and returned to 0 at the hero.

## Automated validation and limits

`node --test tests/*.test.js`: 40 tests passed in the local workspace. Includes regression coverage for Research scroll tracking, current-section changes in both directions, bottom-of-page selection, native anchor focus and the Research page's existing route indicator. Existing motion tests cover reduced-motion behavior and unavailable animation capabilities.

`node scripts/check.js`: syntax and linked-asset checks passed; local static build completed.

Reduced-motion behavior was checked through source inspection and automated tests, not by changing the operating system preference. Browser checks used desktop Chromium at the listed viewport sizes; physical iOS/Android devices were not tested. The browser reported a nonfatal native cross-page View Transition opt-in warning; ordinary Research navigation and return navigation worked. Remote GitHub repository insights were unavailable in the preview; that existing data integration was outside this layout/navigation change.
