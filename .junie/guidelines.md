# Junie guidelines — Fearless Ledger

## Project
A Fearless Draft organizer for League of Legends coaching staff. Plain HTML/CSS/JS, no build step, no dependencies, no network calls.

## Hard rules
- Dependency-free. Everything must run by opening `index.html` from disk or from GitHub Pages.
- Champion names are text only. Never add champion portraits, splash art, icons, team logos or real player names.
- The draft order in `ORDER` is the tournament order (6 bans, 6 picks, 4 bans, 4 picks). Do not change it without a rule source.
- Fearless locks come only from `lockedFor()`. Every view (grid, advice, pressure, burn list, report) must read locks from it, never recompute them.
- Bans never carry over between games. Picks carry over under `hard` (both teams) and `soft` (picking team only).
- Wrap every `localStorage` access in try/catch. State must also survive a round-trip through the share link (`#s=`).
- Touch targets at least 36 px, body text at least 15 px, no horizontal scroll at 390 px wide.

## Code style
- Single IIFE in `app.js`, `'use strict'`, 2-space indent, semicolons.
- Build DOM with `el()` and `textContent`. No `innerHTML` with user text (team names, notes, pools).
- Scores in `advice()` and `burnList()` must come with a short human-readable reason.

## Testing
- `window.__ledger` exposes `state`, `act(name)`, `undo()`, `setWinner(side)`, `nextGame(blueTeam)`, `lockedFor(game, team)`, `advice(n)`, `pressure(team)`, `report()` and `loadSample()`.
- Before finishing a task: load the sample, draft a full game by always taking `advice(1)`, record a winner, start the next game, and confirm that every pick from earlier games is refused by `act()`. Do this headless at 1280×800 and 390×844 with no console errors and no horizontal overflow.
