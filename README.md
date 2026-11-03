# Chess Club

A shared leaderboard, player list, match history and two-player speed-chess clock for games on a physical board. No online chessboard is included.

## Ready-to-use connection — updated 3 November 2026

The chess SQL has already been installed in your existing coffee-round-tracker Supabase project. Its public connection settings are prefilled in this version. You do not need to run the SQL or copy an API key.

Upload `index.html` to a separate GitHub Pages repository, open its published URL, choose your club name and passcode, and click **Create a new club**. Then add players and use **Copy club invite**. Send the passcode separately. Other players choose **Join club**.

## Get started on this device

Open `index.html` in your browser and choose **Try on this device**. Add players and record results. This mode stores data in that browser only; it is clearly labelled and does not sync.

## Manual shared setup — only for a different Supabase project

1. In your Supabase project (the coffee app project is fine), open **SQL Editor**, paste the complete `supabase-chess-setup.sql` and run it once. It creates a separate chess table and function; it does not change coffee data.
2. Put `index.html` in a separate GitHub repository and enable GitHub Pages from the main branch/root. Do not replace your coffee app homepage.
3. Open the published chess URL. Expand **Shared connection settings**. Enter the Supabase project URL and its **publishable key** or legacy **anon key**. Never use a secret or service-role key.
4. Choose a club name (3–40 letters, numbers or hyphens) and a unique shared passcode (at least 8 characters; maximum 64 bytes). Choose **Create a new club** once.
5. Add players. Use **Copy club invite** to share the app link and prefilled connection settings. Give your players the passcode separately. They select **Join club**.

The invite contains the public connection key, project URL and club name. It does not contain the passcode. Players do not need Supabase accounts or individual logins. Anyone with the club credentials can add players, add results and remove mistaken results. Remembering the passcode stores it on that device; use only on a trusted device. Club passcodes are hashed in the database. There is no passcode recovery feature in this version.

## Leaderboard

- Win: 1 point. Draw: 0.5 points. Loss: 0 points.
- Sort: points, wins, fewer losses, then name alphabetically.
- History records White/Black, result, date and time control. Remove an incorrect result and enter its replacement.
- Shared results refresh every five seconds. Conflicting updates are rejected and refreshed instead of overwriting another player's change. Retry your action after a conflict message.
- Results export as a CSV for Excel. This is a results export, not an import/restore feature.

## Clock

Choose White and Black, select a preset or custom minutes/increment, then Start. White moves first. After moving, tap your own large clock to stop it and start the opponent's. The increment is added after each completed turn. Pause/resume, focus mode, reset and timeout indication are included. On narrow screens, White's panel is rotated to face the opposite player.

One device controls the clock. The live clock is not shared across devices. Keep the page open and device unlocked; wake lock is requested when supported. Refreshing or closing the page loses an unfinished clock game. The app warns before leaving while a game is unfinished. Timeouts stop at zero; confirm a win or draw based on the position. The app never automatically awards or saves a timeout win.

After pausing or a timeout, select White wins / Draw / Black wins to save the match and update the shared leaderboard. A clock game's result is saved at most once, even if its save is retried. Reset for the next game.

## Included files

- `index.html`: complete app; no build tools or JavaScript libraries required.
- `supabase-chess-setup.sql`: run once to enable shared clubs.
- `README.md`: these instructions.

## Validation and limits

The JavaScript was syntax-checked, and local player/result flows, leaderboard calculations, clock switching, increment, pause and timeout behaviour were checked with a simulated DOM and clock. The Supabase SQL is installed and tested in your live project under the anonymous role used by the app: club creation, incorrect-passcode rejection, club isolation, duplicate player names, stale updates, invalid matches, result saving, duplicate prevention, corrections and table permissions passed. Test data was rolled back. Your existing coffee and race records were not changed.

The database security review reports the intentional public RPC and deny-by-default table design: players can call the passcode-protected club function but cannot read the table directly. See [Supabase's function access advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [RLS without policies advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). These settings implement the shared-passcode access model.

The browser preview could not connect to the local server, so visual and real-device checks remain outstanding. Automatic hosting was blocked by this session's network access, so the frontend still needs to be uploaded to GitHub Pages.
