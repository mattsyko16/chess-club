# SEO Chess Club

Live app: https://mattsyko16.github.io/chess-club/

A dedicated shared club app. Open the same permanent URL on any device and enter the existing shared passcode. There is no club creation, club-name selector, or separate device-only board. Existing saved logins for SEO Chess Club continue to work.

## Use

- Add players under Players.
- Record White wins, Black wins or Draw to update the shared leaderboard.
- Win = 1 point, draw = 0.5, loss = 0. Ties sort by wins, fewer losses, then name.
- All devices use the same player list and history; shared changes refresh every five seconds.
- Copy app link shares the permanent URL without version parameters or credentials.

## Clock

Choose White/Black, then choose:

- **Time for the whole game**: 1–180 minutes per player, with a 0–60 second increment after a completed move.
- **Maximum time per move**: 1–3600 seconds per move. Each turn starts with a fresh allowance; unused seconds are discarded. Pause preserves the current turn's remaining time.

Tap your own clock after moving. White starts. Timeouts stop at zero and require a confirmed game result; no win is awarded automatically.

Reset uses an in-app confirmation instead of a browser pop-up. It pauses while you decide; Keep playing resumes the same player with the same remaining time. Reset game clears the unfinished game without recording a result. New game after a saved result needs no extra confirmation. Reset is blocked while a result save is in progress.

Focus mode makes the two clock targets fill the visible page. Portrait stacks the two panels and rotates White for the opposite player. Landscape uses side-by-side panels. Pause/reset controls float over the divider; Exit focus is always available. Browser address bars remain controlled by the browser.

Keep the page open and the phone unlocked while timing a game. Supported browsers receive a screen wake-lock request. Refreshing or closing the page discards an unfinished clock game.

## Stress checks

Run `node stress-test.mjs` from this directory. It uses only Node's built-in filesystem support and runs the embedded production app against a deterministic mock DOM/clock/network.

Passed 12,138 assertions across 8,000 turn changes, 100 reset cycles, increments, expiry boundaries, invalid settings, both timer modes, pause/cancel, storage denial, HTML escaping, save-in-flight protection, double saves, lost responses, retries and timeout recovery.

Live PostgreSQL checks passed 100 result writes with mixed time controls, version checks, duplicate prevention, stale writes, invalid games, passcodes, corrections and anonymous table isolation. That batch was rolled back. A separate two-client fixture reached exactly one result/version increment; it is isolated from SEO Chess Club. Its database-row cleanup requires an interactive SQL confirmation and was not completed.

SEO Chess Club retained its five players and zero games during these tests. Phone rendering and interaction checks are tracked separately from logic tests; browser emulation does not replace testing on a real handset.

## Database

The chess function and table are already installed in the coffee-round-tracker Supabase project. The included SQL is a reference for a separate installation; do not rerun it for normal use. Frontend configuration contains only the publishable key. Direct table reads are denied; the RPC checks the shared club passcode.
