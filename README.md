# Aerone portfolio

Static HTML, CSS and JavaScript, with one Vercel Node API function for public GitHub activity. The existing project and production URL remain `https://aerone-carl.vercel.app/`.

## Run locally

Use Node.js 22 or later. No dependencies need to be installed.

```sh
node scripts/dev.js
```

Open `http://127.0.0.1:3000/#github`. Set `PORT` in your shell to use a different port. Opening the HTML file directly or using a static-only Live Server does not run `/api/github`; the section will show an explanatory error.

```sh
node --test tests/*.test.js
node scripts/check.js
```

The build validates JavaScript syntax and linked assets, then copies public portfolio assets to `dist/`. Vercel deploys `api/github.js` separately. Tests, server scripts and environment files are excluded from the public build.

## Data and refresh behavior

The account is configured in `api/github.js` as `aeronecarlpenol-byte`. Existing profile links in `index.html` point to the same account.

- Profile, public repository metadata and recent public events use the official GitHub REST API. Repository requests follow pagination and exclude private repositories.
- Daily contributions use `https://github-contributions-api.jogruber.de/v4/aeronecarlpenol-byte?y=last`. This service reads GitHub's profile calendar. Dates, counts and levels are validated and preserved exactly; the displayed total is checked against the sum of daily counts. Missing dates or invalid responses produce an error, never fabricated zero days.
- Zero-contribution days are displayed. Calendar padding outside the returned date range has no fabricated cells. A blue legend, hover titles, tap details and keyboard navigation make daily history accessible. Arrow keys move one day vertically or one week horizontally; Home/End move to the first/last day.
- Each resource is independently cached for 15 minutes in the Vercel CDN and warm function instance. Concurrent requests in an instance are deduplicated. The browser checks expiry every 30 seconds while visible and when returning to the page. Refresh requests respect the shared cache.
- Every panel shows its retrieval timestamp. The contribution provider separately caches its source for up to one hour, and GitHub's public event feed can itself be delayed. These limitations are disclosed in the section. Contribution totals and event-feed entries are different measurements.
- Expired results are hidden if refresh fails. Loading, empty and error states are independent. Rate-limit responses honor the source reset/retry time; other failures wait at least one minute before retrying. The profile link remains available.

## Existing Vercel deployment

Keep the existing GitHub connection and Vercel project. Commit these files to the connected repository; merging into its configured production branch uses the existing deployment URL. `vercel.json` selects the static `dist/` output, build command and Node function. No replacement Vercel project is needed.

No secret is required for public data. For higher GitHub REST rate limits, optionally add `GITHUB_TOKEN` to the existing Vercel project's Environment Variables for Preview and Production, then redeploy. Use the least access needed for public metadata. The token is read only inside `api/github.js`, sent only to `api.github.com`, and never returned to the browser or calendar provider. Do not prefix it with a frontend environment-variable prefix. `.env.example` is documentation; the dependency-free local server reads your shell environment and does not load `.env` automatically.

After deployment, verify each URL returns JSON with the correct username, timestamps and source data:

```text
/api/github?resource=profile
/api/github?resource=repos
/api/github?resource=events
/api/github?resource=calendar
```

## Diagnosis and validation

The original section embedded an external SVG image and made one uncached, unauthenticated browser request for up to 100 repositories. It had no profile/follower data, public event feed, periodic refresh, daily contribution tooltips, or rate-limit recovery. Its image error listener could also miss an image that failed before the deferred script attached. The live production image and REST request both worked during inspection; no persistent endpoint outage or CORS error was reproduced.

The update retains the section and existing styles, adds a same-origin data endpoint, and moves the GitHub implementation from `js/interactions.js` into `js/github.js`. The scroll reveal targets individual GitHub panels so a tall mobile section cannot remain hidden behind the original intersection threshold.

Live validation on October 28, 2026 confirmed the account, two public repositories, zero followers/following, ten recent public events, and 44 contributions across the provider's 368 returned days. Every daily date, count and intensity level was compared with GitHub's official contribution calendar with zero mismatches. Desktop browser rendering, daily details, console output and a 390px iframe viewport were checked locally. Fifteen automated tests cover pagination, caching, expiry, deduplication, rate limits, public-only data, calendar validation, loading, empty states, partial failure and recovery. Test fixtures are confined to tests; production never substitutes fixture data.

Production verification of the updated implementation must follow a deployment; local verification does not establish that the production branch has changed.
