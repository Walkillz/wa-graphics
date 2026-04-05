# WagerAttack Sports Graphics

Single-file web app that pulls live odds from WagerAttack + live scores from ESPN and generates 1080x1080 PNG graphics for MLB/NBA/NHL games - pre-game templates with Spread/ML/Total and post-game templates showing the final score, winning side, and bet results (COVERED / DID NOT COVER / PUSH, OVER / UNDER).

**Live:** https://walkillz.github.io/wa-graphics/

## What it does

- **Three sport tabs:** MLB, NBA, NHL
- **Pre-game template:** team logos + colors, spread, moneyline, total with juice on both sides, start time, pitchers (MLB)
- **Post-game template:** final score, winning team highlighted, spread result, ML winner + payout, total result (O/U vs actual)
- **Daily slate graphic:** single 1080x1080 showing every game on the day's slate with lines
- **Auto-refresh:** scores refresh every 30s while any game is LIVE; schedule + odds refresh every 5 min
- **Graceful fallback:** if WagerAttack API is down, shows ESPN scores only and renders templates without odds

## Architecture

```
Browser (index.html)
  |-- ESPN scoreboard API        (direct, no auth, CORS-open)
  \-- WagerAttack sportsbook API (via Cloudflare Worker proxy)
         \-- wa-proxy.mahmoudwakil89.workers.dev
```

**Stack:** vanilla JS, single-file HTML, HTML5 Canvas. No build step. Deployed to GitHub Pages.

## WagerAttack API field reference

The WA API documentation published in the internal brief did not match production. Actual fields used:

| Purpose | Field used |
|---|---|
| Customer ID (auth body param) | `customerID` (not `username`) |
| Team 1 name (away) | `Team1ID` (contains team name string) |
| Team 2 name (home) | `Team2ID` |
| Spread juice | `SpreadAdj1`, `SpreadAdj2` |
| Total juice | `TtlPtsAdj1` (over), `TtlPtsAdj2` (under) |
| Pitchers (MLB) | `ListedPitcher1`, `ListedPitcher2` |
| Favored team | `FavoredTeamID` compared to `Team1ID` |

## Team name aliases

- `Athletics` -> `OAK` (team relocated from Oakland, ESPN still uses OAK abbr)
- Doubleheader suffixes ` GM1`, ` GM2`, ` Game N`, `(N)` are stripped before matching
- Futures/novelty bets (`wins world series`, `to win` etc.) are filtered out

## Files

- `index.html` - the entire app (HTML + CSS + JS in one file)
- `worker.js` - Cloudflare Worker proxy source

## Deploy updates

1. Edit `index.html` locally
2. Commit + push to `main`
3. GitHub Pages auto-deploys within ~30s

## Adding a new sport

1. Add an entry to `SPORT_CONFIG` with `sportType`, `sportSubType`, `propDescription`, `espn` path
2. Add team colors to `COLORS[SPORT]`
3. Add a `NAME_MAP[SPORT]` mapping full team names -> ESPN abbrs
4. Add a `<div class="tab" data-sport="XXX">XXX</div>` in the tabs bar

## Compliance

- 18+ / 21+ footer on every graphic
- "Lines subject to change" on pre-game
- No personalization or copy that could be misread as an endorsement
