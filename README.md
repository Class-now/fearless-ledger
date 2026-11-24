# Lockout Ledger

A draft board and series planner for **Fearless Draft** in League of Legends, built for coaching staff.
Under Fearless, every champion picked earlier in a series is gone for the games that follow. Spreadsheets cope badly with that: someone has to cross names out by hand between games, and nobody can see at a glance which player is about to run out of comfort picks. Lockout Ledger does the bookkeeping and turns it into draft advice.

**Use it:** open `index.html` in any modern browser, or the hosted copy on GitHub Pages. No install, no account, no server. Press **Load sample series** in Prep to see a Bo5 already one game in.

Category: **League of Legends: Macro Scouting & Draft Management System** (Modular Draft Organizer supporting Fearless Draft rules) — Cloud9 x JetBrains "Sky's The Limit" Hackathon 2026.

## What it does

| Coaching problem | What Lockout Ledger does |
|---|---|
| Tracking which champions are gone | Every pick from earlier games is locked automatically. Locked champions drop out of the grid, or show which team took them and in which game. Hard (both teams), soft (picking team only) and normal drafts are supported. |
| Running the draft live | A board that follows the tournament order (ban 3, pick 3, ban 2, pick 2 per side), shows whose turn it is, refuses illegal picks, and assigns roles to picks automatically. Type to search, Enter to lock in, Backspace to undo. |
| "Who is running out of champions?" | **Pool pressure** shows, for every player on both teams, how many comfort champions are still playable now and after the current picks lock. Players down to two or fewer are flagged. |
| Ban or pick? | Under Fearless a ban only lasts one game, while a pick takes a champion away for the rest of the series. **Advice for this turn** ranks options by your comfort, what the choice takes from the opponent, how flexible it is across open roles, and how many games the lock will last. When a ban target is also in your own pool, it tells you to pick it instead. |
| Series prep | **Burn list**: champions that sit in both teams' pools, ranked by how much an early pick denies the opponent. |
| Sharing with the staff | Copy the current draft as plain text, copy a share link (the whole series lives in the URL), download or import JSON, or export a Markdown coach report with every game, notes and the remaining pools. |

## Pools

In Prep, each player gets a pool, one champion per line or comma-separated. Mark signature picks with `*1` and pocket picks with `*3`; everything else counts as comfort. Spelling is forgiving: `kaisa`, `ksante` and `dr mundo` all resolve.

## Code tour

| File | What is in it |
|---|---|
| `index.html` | Three tabs: Draft, Prep, Series |
| `style.css` | Dark broadcast-style theme, responsive down to phone width |
| `champions.js` | Champion names and the roles they are drafted into (text only) |
| `app.js` | Draft order, Fearless lock rules, role assignment, advice and pressure scoring, share link, report |
| `.junie/guidelines.md` | Rules the Junie agent works under |

## Built with JetBrains

Developed with the Junie coding agent from the Junie CLI, using `.junie/guidelines.md` to keep the lock rules in one function and every change testable headless through `window.__ledger`.

How it was built with Junie: [AI_WORKFLOW.md](AI_WORKFLOW.md)

## License

MIT. Lockout Ledger is a fan-made coaching tool and is not endorsed by Riot Games. League of Legends and champion names are trademarks of Riot Games, Inc.; no Riot artwork is used.
