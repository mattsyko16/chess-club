# Chess Club checks — v1.0.6, 4 November 2026

The Read me / Help buttons open an in-app guide with joining, scoring, both clock modes, shared game time, pause/focus, result correction, exporting and sharing limits.

## Results

- 23 headless Chromium clock checks passed: increments, fresh move allowances, total game countdown, pause/resume, delayed ticks, simultaneous timeouts, duplicate taps/saves and invalid limits.
- 28 DOM and simulated-network checks passed: help navigation and focus, safe player-name rendering, scoring/corrections, unchanged/stale refreshes, pending writes, failed saves, sign-out during an outstanding refresh, blocked storage and a dataset of 100 players / 2,000 games.
- 20 Chromium layout/navigation checks passed over 320×568, 390×844, 430×932, 844×390 and 1280×800 viewports. Help opens/returns, no horizontal overflow, focus countdown/exit controls do not overlap, and clock panels fit. No page JavaScript errors were recorded.
- 12 live Postgres assertions passed using a disposable club inside a transaction under the public client role. Covered wrong passcodes, duplicate/invalid players and results, stale-version writes, duplicate game IDs, deletion and shared reads. All test writes were rolled back.
- Public client roles have no direct SELECT/INSERT/UPDATE/DELETE grants on the chess club table; shared operations go through the passcode-verifying function. Row-level security is enabled.

## Fixes

Unchanged sync responses no longer rebuild the player dropdowns. Browser storage failures no longer interrupt sign-out; failure to clear remembered access is explicitly reported. Exiting the club clears the focus button state. Unknown navigation targets are ignored.

## Re-run the client checks

From the repository root, with Node 24:

```sh
npm install --no-save playwright@1.62.1 jsdom@30.1.3
npx playwright install chromium
node qa/clock.cjs
node qa/dom.cjs
node qa/layout.cjs
```

`CHESS_BROWSER_PATH` can select an already installed Chromium executable. The client scripts use synthetic state/network responses and do not modify the real club. Screenshots are written to `qa/` by the browser suites.

## Limits

These are functional, edge-case and bounded data-volume checks, not a sustained load test or penetration test. The data-volume case tests rendering/scoring in memory, not 2,000 live writes. Stale-client protection was tested, not a large concurrent traffic run. The layout tests use Chromium emulation, not a physical iPhone or Safari. Screen locking, suspended tabs and wake-lock behaviour still depend on the real device. Keep the app open and unlocked during a clock game; unfinished clocks do not survive reloading.

The shared passcode model gives every member permission to edit results; it has no separate administrator role or application-level passcode attempt rate limiter. The Supabase advisor flags the public SECURITY DEFINER function: public execution is intentional for this design, with a password check and empty search path inside the function. Direct table access is denied. This is not a claim that the entire shared Supabase project is free of warnings; other apps were not changed.
