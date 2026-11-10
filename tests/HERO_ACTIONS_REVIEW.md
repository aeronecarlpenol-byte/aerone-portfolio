# Functional hero actions — November 9, 2026

Hero actions use 46px targets, 14px corners and a wrapping flex row with 10px/12px gaps. Electric blue, existing dark surfaces, thin secondary borders and a gentle 2px hover lift form the portfolio action style.

Removed all seven hero engineering stickers, their reserved container, inline
artwork, idle/entrance/hover keyframes, pointer parallax and obsolete test.
The left quote keeps intentional negative space; the introduction and actions
align with the right showcase column on desktop and stack beneath the quote on
mobile. The existing curiosity rotator remains, with how things connect first
and its accessible supporting text updated accordingly.

Verified action destinations are the existing contact email
mailto:aeronecarlpenol@gmail.com and GitHub profile
https://github.com/aeronecarlpenol-byte. GitHub uses the existing authentic SVG,
target=_blank and rel=noopener noreferrer. Email uses native mailto behavior;
no message is sent by the page. Both controls have keyboard focus outlines.

No CV PDF was found in the local project or the complete GitHub repository
tree. Asked for the real file path/URL; the user replied "no". Therefore the
live row contains Email me and GitHub only. No fake, disabled or placeholder CV
download was added. A genuine PDF is still required for a Download CV action.

Verification:

- 63 automated tests and static syntax/asset/link/build checks pass. The removed
  test covered deleted sticker parallax. Existing hero assembly, Skills logo
  distribution, scroll geometry, energy core/trail, navigation, galleries and
  contact behavior remain covered.
- Compared source before/after: non-hero HTML is unchanged. Hero text assembly,
  navigation and field-notes scroll/energy source files are unchanged.
- Deployed preview checked at 360, 390, 768, 1280 and 1440 CSS-pixel widths.
  Buttons measure 46px high, remain in one row where space permits and support
  flex wrapping. Quote/introduction use two columns on desktop and one on
  mobile. No horizontal overflow was measured.
- No decorative sticker nodes remain. Exactly one energy core remains and the
  existing scrolling/hero entrance behavior is visible. Browser error logs were
  empty. Icons, text and keyboard focus remained readable.
- Inspected native anchor targets and keyboard focus. A GitHub click was
  attempted, but the browser did not expose a new destination tab, so this
  is not claimed as an end-to-end external-tab test. Native mail-client launch
  and actual email delivery were not tested. Hover behavior was source-checked;
  the browser automation surface did not expose a hover action.
- Ignored local screenshots: tests/.verification/hero-actions-desktop.jpg and
  hero-actions-phone.jpg. No CV download verification is claimed.
