# Building a Fearless Draft tool with an agent: rules that must not drift

Fearless Ledger is my second entry. It is built the same way as my booth game (Skyline Relay): a guidelines file first, small tasks, and a check at the end of every task. A draft tool can fail in a way a game can't, though. When the grid says a champion is free and the advice says it's locked, a coach stops trusting both, and a whole series is lost on one wrong lock. So the work here was mostly about keeping the rules in one place and testing the whole series, not single screens.

## 1. The rules went into `.junie/guidelines.md` before any code

Three rules come straight from how Fearless works, and they are the ones I didn't want any task to quietly break:

- The draft order in `ORDER` is the tournament order (6 bans, 6 picks, 4 bans, 4 picks). Don't change it without a rule source.
- Bans never carry over between games. Picks carry over under `hard` (both teams) and `soft` (the picking team only).
- Fearless locks come only from `lockedFor()`. Every view reads locks from it and never recomputes them.

The file also holds the venue rules (no dependencies, no network, `localStorage` wrapped in try/catch, state that survives a share link) and one product rule: every score in `advice()` and `burnList()` must come with a short reason a human can read.

## 2. One check for the whole series

The check every task ended with is written in the guidelines, so it never had to be repeated in a prompt:

> load the sample, draft a full game by always taking `advice(1)`, record a winner, start the next game, and confirm that every pick from earlier games is refused by `act()`. Do this headless at 1280×800 and 390×844 with no console errors and no horizontal overflow.

A test hook, `window.__ledger`, exposes `act`, `undo`, `setWinner`, `nextGame`, `lockedFor`, `advice`, `pressure` and `report`, so a script drafts a full game in milliseconds. Drafting by always taking the top advice tests two things at once: the advice never suggests something illegal, and the locks hold when the next game starts.

## 3. What went wrong, and how it was caught

- **Three answers to one question.** Early versions worked out locks separately in the grid, the advice list and the coach report. Under soft Fearless they disagreed: the grid greyed out a champion that the advice still suggested to the other team. The series check caught it, because the top advice was refused by `act()`. The fix was the `lockedFor()` rule above. After that, this class of bug could not come back without breaking a written rule.
- **Roles from draft order.** Picks arrive in draft order, not role order, and flex champions make the mapping ambiguous. A greedy assignment put a flex mid into the top lane. It is now a small exhaustive search over role assignments (at most 120), and the report shows the lineup a coach would expect.
- **A bare number nobody trusts.** The first advice list was a ranked column of scores. Reading it as a coach, it told me nothing, so the guidelines now require a reason with every score. A line like "Pell signature · burns Lumen's comfort for 3 more games" is something a coach can argue with, and that is the point.

## 4. The Junie CLI task

The last feature was built from the Junie CLI with this prompt: "Add a Copy draft button that puts the current game's bans and picks on the clipboard as plain text for the team chat. Follow .junie/guidelines.md and run the series check it describes." Junie added the button and a fallback for browsers that refuse clipboard access: it shows a selected text box, so the copy still works on a locked-down venue laptop. It then ran the series check at both widths. The commit is in the history (`fdca18d`).

## 5. What I kept for myself

- **Count pools, not picks.** In a format built on scarcity, the useful question is "which player runs out first", not "which champion is strong". The Pool pressure panel, and its flag at two comfort picks or fewer, is that decision.
- **When to pick a ban.** A ban lasts one game and a pick lasts the series. So when a ban target is also in your own pool, the tool says so ("or pick it"). That rule comes from watching Fearless series, not from the code.
- **No portraits, logos or real player names.** Every champion is plain text, and the sample teams are fictional. This keeps the tool clear of third-party art, and it reads faster on a phone between games.
