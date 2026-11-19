(function () {
  'use strict';

  // ---------- constants ----------
  const ROLES = ['T', 'J', 'M', 'B', 'S'];
  const ROLE_NAME = { T: 'Top', J: 'Jungle', M: 'Mid', B: 'Bot', S: 'Support' };
  const TIER_WEIGHT = { 1: 3, 2: 2, 3: 1 };
  const TIER_LABEL = { 1: 'signature', 2: 'comfort', 3: 'pocket' };
  const STORE_KEY = 'fearless-ledger.v1';

  // Tournament draft order: 20 steps.
  const ORDER = [
    ['blue', 'ban'], ['red', 'ban'], ['blue', 'ban'], ['red', 'ban'], ['blue', 'ban'], ['red', 'ban'],
    ['blue', 'pick'], ['red', 'pick'], ['red', 'pick'], ['blue', 'pick'], ['blue', 'pick'], ['red', 'pick'],
    ['red', 'ban'], ['blue', 'ban'], ['red', 'ban'], ['blue', 'ban'],
    ['red', 'pick'], ['blue', 'pick'], ['blue', 'pick'], ['red', 'pick']
  ].map(function (s, i) {
    return { side: s[0], type: s[1], phase: i < 6 ? 'Ban phase 1' : i < 12 ? 'Pick phase 1' : i < 16 ? 'Ban phase 2' : 'Pick phase 2' };
  });

  const CHAMPS = window.FL_CHAMPIONS;
  const CHAMP = {};
  CHAMPS.forEach(function (c) { CHAMP[c.name] = c; });

  // ---------- state ----------
  function emptyTeam(name, short) {
    return {
      name: name, short: short,
      players: ROLES.map(function (r) { return { role: r, name: '', pool: [] }; })
    };
  }
  function emptyGame(blueTeam) {
    return { blue: blueTeam, steps: new Array(20).fill(null), winner: null, notes: '', roles: { blue: null, red: null } };
  }
  function emptySeries() {
    return {
      version: 1, format: 5, fearless: 'hard',
      teams: [emptyTeam('Team A', 'TMA'), emptyTeam('Team B', 'TMB')],
      games: [emptyGame(0)], current: 0
    };
  }

  function sampleSeries() {
    function p(role, name, pool) {
      return { role: role, name: name, pool: pool.map(function (x) { const a = x.split('*'); return { c: a[0], t: a[1] ? Number(a[1]) : 2 }; }) };
    }
    const s = {
      version: 1, format: 5, fearless: 'hard',
      teams: [
        { name: 'Team Cirrus', short: 'CRS', players: [
          p('T', 'Halden', ['Rumble*1', "K'Sante*1", 'Gnar*2', 'Renekton*2', 'Aatrox*2', 'Jax*3', 'Ambessa*3']),
          p('J', 'Vesper', ['Vi*1', 'Xin Zhao*1', 'Sejuani*2', 'Maokai*2', 'Wukong*2', 'Skarner*3', 'Pantheon*3']),
          p('M', 'Lumen', ['Azir*1', 'Taliyah*1', 'Orianna*2', 'Yone*2', 'Viktor*2', 'Aurora*3', 'Sylas*3']),
          p('B', 'Kestrel', ['Kalista*1', 'Varus*1', 'Ezreal*2', 'Xayah*2', 'Ashe*2', 'Jhin*3', 'Corki*3']),
          p('S', 'Marrow', ['Rakan*1', 'Rell*1', 'Alistar*2', 'Nautilus*2', 'Braum*2', 'Leona*3', 'Poppy*3'])
        ] },
        { name: 'Team Nimbus', short: 'NMB', players: [
          p('T', 'Orrin', ['Jax*1', 'Renekton*1', 'Ambessa*2', 'Camille*2', 'Gragas*2', "K'Sante*3", 'Sion*3']),
          p('J', 'Tamsin', ['Skarner*1', 'Wukong*1', 'Nidalee*2', 'Xin Zhao*2', 'Lee Sin*2', 'Trundle*3', 'Vi*3']),
          p('M', 'Pell', ['Sylas*1', 'Yone*1', 'Akali*2', 'Taliyah*2', 'Corki*2', 'Galio*3', 'Ahri*3']),
          p('B', 'Rook', ['Ezreal*1', 'Kai\'Sa*1', 'Varus*2', 'Zeri*2', 'Smolder*2', 'Ashe*3', 'Lucian*3']),
          p('S', 'Wren', ['Rell*1', 'Nautilus*1', 'Rakan*2', 'Alistar*2', 'Karma*2', 'Braum*3', 'Renata Glasc*3'])
        ] }
      ],
      games: [], current: 0
    };
    const g1 = emptyGame(0);
    g1.steps = ['Azir', 'Skarner', 'Sylas', 'Kalista', 'Rumble', 'Ezreal',
      'Vi', "K'Sante", 'Rell', 'Taliyah', 'Varus', 'Wukong',
      'Yone', 'Orianna', 'Jax', 'Akali',
      'Corki', 'Rakan', 'Renekton', 'Nautilus'];
    g1.winner = 0;
    g1.notes = 'Won on early Taliyah-Vi pressure bot side. NMB burned Rell and Wukong first; expect Kalista and Rumble bans again.';
    s.games.push(g1);
    s.games.push(emptyGame(1));
    s.current = 1;
    return s;
  }

  let S = load() || sampleSeries();
  let ui = { role: '', search: '', showLocked: false };

  // ---------- persistence ----------
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
  }
  function load() {
    const fromHash = readHash();
    if (fromHash) return fromHash;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? validate(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }
  function validate(o) {
    if (!o || o.version !== 1 || !Array.isArray(o.teams) || o.teams.length !== 2 || !Array.isArray(o.games) || !o.games.length) return null;
    o.games.forEach(function (g) {
      if (!Array.isArray(g.steps) || g.steps.length !== 20) g.steps = new Array(20).fill(null);
      g.steps = g.steps.map(function (c) { return c && CHAMP[c] ? c : null; });
      if (!g.roles) g.roles = { blue: null, red: null };
    });
    if (typeof o.current !== 'number' || o.current < 0 || o.current >= o.games.length) o.current = o.games.length - 1;
    if (['hard', 'soft', 'off'].indexOf(o.fearless) < 0) o.fearless = 'hard';
    if ([1, 3, 5].indexOf(Number(o.format)) < 0) o.format = 5;
    o.format = Number(o.format);
    return o;
  }
  function encodeState() {
    const json = JSON.stringify(S);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function readHash() {
    const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return null;
    try {
      let b = m[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      return validate(JSON.parse(decodeURIComponent(escape(atob(b)))));
    } catch (e) { return null; }
  }

  // ---------- series logic ----------
  function game(i) { return S.games[i === undefined ? S.current : i]; }
  function teamOnSide(g, side) { return side === 'blue' ? g.blue : 1 - g.blue; }
  function sideOfTeam(g, team) { return g.blue === team ? 'blue' : 'red'; }
  function nextStep(g) { return g.steps.indexOf(null); }
  function draftDone(g) { return nextStep(g) === -1; }
  function wins(team) { return S.games.filter(function (g) { return g.winner === team; }).length; }
  function needed() { return Math.floor(S.format / 2) + 1; }
  function seriesOver() { return wins(0) >= needed() || wins(1) >= needed(); }
  function maxGamesLeftAfter(gi) {
    // games that could still be played after game gi in the worst (longest) case
    return Math.max(0, S.format - (gi + 1));
  }

  function picksOf(g, side) {
    const out = [];
    ORDER.forEach(function (o, i) { if (o.side === side && o.type === 'pick' && g.steps[i]) out.push(g.steps[i]); });
    return out;
  }
  function bansOf(g, side) {
    const out = [];
    ORDER.forEach(function (o, i) { if (o.side === side && o.type === 'ban') out.push(g.steps[i]); });
    return out;
  }

  // Champions locked by Fearless for `team` at the start of game gi.
  // Returns map name -> { game, team } of the earlier pick.
  function lockedFor(gi, team) {
    const out = {};
    if (S.fearless === 'off') return out;
    for (let k = 0; k < gi; k++) {
      const g = S.games[k];
      ['blue', 'red'].forEach(function (side) {
        const owner = teamOnSide(g, side);
        if (S.fearless === 'soft' && owner !== team) return;
        picksOf(g, side).forEach(function (c) { if (!out[c]) out[c] = { game: k + 1, team: owner }; });
      });
    }
    return out;
  }
  function usedInGame(g) {
    const out = {};
    g.steps.forEach(function (c, i) { if (c) out[c] = ORDER[i]; });
    return out;
  }
  function availableFor(gi, team) {
    const locked = lockedFor(gi, team);
    const used = usedInGame(S.games[gi]);
    return CHAMPS.filter(function (c) { return !locked[c.name] && !used[c.name]; });
  }

  // Best role assignment for a side's picks (max sum of role preference).
  function assignRoles(picks) {
    const n = picks.length;
    let best = null, bestScore = -1;
    function rec(i, usedRoles, acc, score) {
      if (i === n) { if (score > bestScore) { bestScore = score; best = acc.slice(); } return; }
      const roles = CHAMP[picks[i]] ? CHAMP[picks[i]].roles : [];
      ROLES.forEach(function (r) {
        if (usedRoles[r]) return;
        const idx = roles.indexOf(r);
        const w = idx < 0 ? 0 : 3 - Math.min(idx, 2);
        usedRoles[r] = true; acc.push(r);
        rec(i + 1, usedRoles, acc, score + w);
        usedRoles[r] = false; acc.pop();
      });
    }
    rec(0, {}, [], 0);
    return best || [];
  }
  function openRoles(g, side) {
    const assigned = assignRoles(picksOf(g, side));
    return ROLES.filter(function (r) { return assigned.indexOf(r) < 0; });
  }

  function comfortOf(team, champ, roles) {
    // highest-weight pool entry among players whose role is in `roles`
    let best = null;
    S.teams[team].players.forEach(function (pl) {
      if (roles && roles.indexOf(pl.role) < 0) return;
      pl.pool.forEach(function (e) {
        if (e.c === champ && (!best || TIER_WEIGHT[e.t] > best.w)) best = { w: TIER_WEIGHT[e.t], player: pl, tier: e.t };
      });
    });
    return best;
  }

  // Score candidates for the next step of the current game.
  function advice(limit) {
    const gi = S.current, g = game();
    const step = nextStep(g);
    if (step < 0) return [];
    const o = ORDER[step];
    const me = teamOnSide(g, o.side);
    const opp = 1 - me;
    const oppSide = o.side === 'blue' ? 'red' : 'blue';
    const myOpen = openRoles(g, o.side);
    const oppOpen = openRoles(g, oppSide);
    const gamesAfter = maxGamesLeftAfter(gi);
    const lockLasts = S.fearless === 'hard' ? gamesAfter : 0;
    const myLocked = lockedFor(gi, me);
    const oppLocked = lockedFor(gi, opp);
    const used = usedInGame(g);
    const out = [];
    CHAMPS.forEach(function (c) {
      if (used[c.name] || myLocked[c.name]) return;
      const oppCan = !oppLocked[c.name];
      const mine = o.type === 'pick' ? comfortOf(me, c.name, myOpen) : null;
      const theirs = oppCan ? comfortOf(opp, c.name, oppOpen) : null;
      const theirsAny = oppCan ? comfortOf(opp, c.name, null) : null;
      const flexRoles = c.roles.filter(function (r) { return (o.type === 'pick' ? myOpen : oppOpen).indexOf(r) >= 0; });
      let score = 0;
      const why = [];
      if (o.type === 'pick') {
        if (!mine) return;
        score += mine.w * 2;
        why.push(mine.player.name + ' ' + TIER_LABEL[mine.tier]);
        if (theirsAny) {
          const deny = theirsAny.w * (1 + 0.5 * lockLasts);
          score += deny;
          why.push(lockLasts ? 'burns ' + theirsAny.player.name + "'s " + TIER_LABEL[theirsAny.tier] + ' for ' + lockLasts + ' more game' + (lockLasts > 1 ? 's' : '') : 'denies ' + theirsAny.player.name);
        }
        if (flexRoles.length > 1) { score += 0.75 * (flexRoles.length - 1); why.push('flex ' + flexRoles.map(function (r) { return ROLE_NAME[r]; }).join('/')); }
      } else {
        if (!theirs) return;
        score += theirs.w * 2.2;
        why.push('takes ' + theirs.player.name + "'s " + TIER_LABEL[theirs.tier]);
        if (flexRoles.length > 1) { score += 0.5 * (flexRoles.length - 1); why.push('flex threat'); }
        const mineToo = comfortOf(me, c.name, myOpen);
        if (mineToo && lockLasts) { score -= 2; why.push('or pick it: a pick burns it for the series, a ban does not'); }
      }
      out.push({ name: c.name, score: Math.round(score * 10) / 10, why: why.join(' · ') });
    });
    out.sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
    return out.slice(0, limit || 8);
  }
  // Pool pressure: per player, comfort champions still playable now and after this game.
  function pressure(team) {
    const gi = S.current, g = game();
    const now = lockedFor(gi, team);
    const after = Object.assign({}, now);
    if (S.fearless !== 'off') {
      ['blue', 'red'].forEach(function (side) {
        const owner = teamOnSide(g, side);
        if (S.fearless === 'soft' && owner !== team) return;
        picksOf(g, side).forEach(function (c) { if (!after[c]) after[c] = { game: gi + 1, team: owner }; });
      });
    }
    return S.teams[team].players.map(function (pl) {
      const total = pl.pool.length;
      const nowLeft = pl.pool.filter(function (e) { return !now[e.c]; });
      const afterLeft = pl.pool.filter(function (e) { return !after[e.c]; });
      const sig = afterLeft.filter(function (e) { return e.t === 1; }).length;
      return { player: pl, total: total, now: nowLeft.length, after: afterLeft.length, sigAfter: sig, lost: pl.pool.filter(function (e) { return after[e.c]; }).map(function (e) { return e.c; }) };
    });
  }

  // Burn list: champions in both teams' pools, ranked by what an early pick takes away.
  function burnList(team) {
    const opp = 1 - team;
    const gi = S.current;
    const lockedMe = lockedFor(gi, team), lockedOpp = lockedFor(gi, opp);
    const out = [];
    CHAMPS.forEach(function (c) {
      if (lockedMe[c.name] || lockedOpp[c.name]) return;
      const mine = comfortOf(team, c.name, null);
      const theirs = comfortOf(opp, c.name, null);
      if (!mine || !theirs) return;
      out.push({ name: c.name, score: theirs.w * 2 + mine.w, why: 'yours: ' + mine.player.name + ' ' + TIER_LABEL[mine.tier] + ' · theirs: ' + theirs.player.name + ' ' + TIER_LABEL[theirs.tier] });
    });
    out.sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
    return out;
  }

  // ---------- actions ----------
  function act(name) {
    const g = game();
    const step = nextStep(g);
    if (step < 0 || !CHAMP[name]) return false;
    const team = teamOnSide(g, ORDER[step].side);
    if (usedInGame(g)[name] || lockedFor(S.current, team)[name]) return false;
    g.steps[step] = name;
    commit();
    return true;
  }
  function undo() {
    const g = game();
    if (g.winner !== null) { g.winner = null; commit(); return; }
    let i = nextStep(g);
    i = i < 0 ? 19 : i - 1;
    if (i < 0) return;
    g.steps[i] = null;
    commit();
  }
  function setWinner(side) {
    const g = game();
    if (!draftDone(g)) return;
    g.winner = teamOnSide(g, side);
    commit();
  }
  function nextGame(blueTeam) {
    if (seriesOver() || S.games.length >= S.format) return;
    S.games.push(emptyGame(blueTeam));
    S.current = S.games.length - 1;
    commit();
  }
  function commit() { save(); render(); }

  // ---------- rendering ----------
  const $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function render() {
    renderScore();
    renderTurn();
    renderSides();
    renderGrid();
    renderActions();
    renderAdvice();
    renderPressure();
    renderPrep();
    renderSeries();
  }

  function renderScore() {
    const box = $('scoreline');
    box.textContent = '';
    const a = el('span', 'team-chip', S.teams[0].short);
    const sc = el('b', 'score', wins(0) + ' – ' + wins(1));
    const b = el('span', 'team-chip', S.teams[1].short);
    const meta = el('span', 'muted small', 'Bo' + S.format + ' · ' + (S.fearless === 'off' ? 'normal draft' : S.fearless + ' fearless'));
    box.append(a, sc, b, meta);
  }

  function renderTurn() {
    const g = game(), step = nextStep(g), box = $('turn');
    box.textContent = '';
    box.className = 'turn';
    const gl = el('span', 'game-label', 'Game ' + (S.current + 1));
    box.append(gl);
    if (step < 0) {
      box.append(el('span', '', g.winner === null ? 'Draft complete. Record the result below.' : S.teams[g.winner].name + ' won game ' + (S.current + 1) + '.'));
      return;
    }
    const o = ORDER[step];
    const team = S.teams[teamOnSide(g, o.side)];
    box.classList.add(o.side);
    box.append(el('span', 'phase', o.phase), el('b', '', team.name + ' (' + o.side + ') to ' + o.type));
  }

  function renderSides() {
    const g = game();
    ['blue', 'red'].forEach(function (side) {
      const box = $('side-' + side);
      box.textContent = '';
      const team = S.teams[teamOnSide(g, side)];
      box.append(el('h3', '', team.name), el('p', 'muted small', side + ' side'));
      const bans = el('div', 'bans');
      bansOf(g, side).forEach(function (c) { bans.append(el('span', 'ban' + (c ? '' : ' empty'), c || '—')); });
      box.append(el('p', 'label', 'Bans'), bans);
      const picks = picksOf(g, side);
      const roles = assignRoles(picks);
      const list = el('ol', 'picks');
      for (let i = 0; i < 5; i++) {
        const li = el('li', picks[i] ? 'pick' : 'pick empty');
        li.append(el('span', 'role', picks[i] ? ROLE_NAME[roles[i]] : ''), el('span', 'name', picks[i] || 'Pick ' + (i + 1)));
        list.append(li);
      }
      box.append(el('p', 'label', 'Picks'), list);
    });
  }

  function renderGrid() {
    const g = game(), step = nextStep(g), grid = $('grid');
    grid.textContent = '';
    const team = step < 0 ? null : teamOnSide(g, ORDER[step].side);
    const locked = team === null ? {} : lockedFor(S.current, team);
    const lockedAny = Object.assign({}, lockedFor(S.current, 0), lockedFor(S.current, 1));
    const used = usedInGame(g);
    const q = ui.search.trim().toLowerCase();
    let shown = 0;
    CHAMPS.forEach(function (c) {
      if (ui.role && c.roles.indexOf(ui.role) < 0) return;
      if (q && c.name.toLowerCase().indexOf(q) < 0) return;
      const isLocked = team === null ? !!lockedAny[c.name] : !!locked[c.name];
      if (isLocked && !ui.showLocked) return;
      const b = el('button', 'champ');
      b.type = 'button';
      b.dataset.name = c.name;
      b.append(el('span', 'cn', c.name), el('span', 'cr', c.roles.join(' ')));
      if (used[c.name]) { b.classList.add(used[c.name].type === 'ban' ? 'banned' : 'picked'); b.disabled = true; }
      else if (isLocked) {
        const info = (team === null ? lockedAny : locked)[c.name];
        b.classList.add('locked');
        b.disabled = true;
        b.title = 'Locked: picked by ' + S.teams[info.team].short + ' in game ' + info.game;
        b.append(el('span', 'lk', S.teams[info.team].short + ' G' + info.game));
      } else if (step < 0) { b.disabled = true; }
      grid.append(b);
      shown++;
    });
    if (!shown) grid.append(el('p', 'muted', 'No champion matches.'));
  }

  function renderActions() {
    const g = game(), box = $('result-wrap');
    box.textContent = '';
    if (!draftDone(g)) return;
    if (g.winner === null) {
      ['blue', 'red'].forEach(function (side) {
        const b = el('button', 'btn win ' + side, S.teams[teamOnSide(g, side)].short + ' won');
        b.addEventListener('click', function () { setWinner(side); });
        box.append(b);
      });
      return;
    }
    if (seriesOver()) {
      box.append(el('span', 'done', S.teams[wins(0) > wins(1) ? 0 : 1].name + ' take the series ' + Math.max(wins(0), wins(1)) + '–' + Math.min(wins(0), wins(1))));
      return;
    }
    if (S.current === S.games.length - 1 && S.games.length < S.format) {
      const loser = 1 - g.winner;
      box.append(el('span', 'muted small', S.teams[loser].short + ' choose side:'));
      [0, 1].forEach(function (t) {
        const b = el('button', 'btn', 'Game ' + (S.games.length + 1) + ': ' + S.teams[t].short + ' blue');
        b.addEventListener('click', function () { nextGame(t); });
        box.append(b);
      });
    }
  }

  function renderAdvice() {
    const ol = $('advice');
    ol.textContent = '';
    const g = game();
    if (draftDone(g)) { ol.append(el('li', 'muted', 'Draft complete.')); return; }
    const list = advice(8);
    if (!list.length) { ol.append(el('li', 'muted', 'No pool data for this turn. Add champion pools in Prep.')); return; }
    list.forEach(function (a) {
      const li = el('li');
      const b = el('button', 'adv');
      b.type = 'button';
      b.append(el('b', '', a.name), el('span', 'sc', a.score.toFixed(1)), el('span', 'why', a.why));
      b.addEventListener('click', function () { act(a.name); });
      li.append(b);
      ol.append(li);
    });
  }

  function renderPressure() {
    const box = $('pressure');
    box.textContent = '';
    [0, 1].forEach(function (t) {
      const wrap = el('div', 'press');
      wrap.append(el('h3', '', S.teams[t].name));
      pressure(t).forEach(function (r) {
        const row = el('div', 'prow' + (r.total && r.after <= 2 ? ' risk' : ''));
        row.append(el('span', 'role', ROLE_NAME[r.player.role]), el('span', 'pname', r.player.name || '—'));
        const bar = el('span', 'bar');
        const fill = el('span', 'fill');
        fill.style.width = (r.total ? (100 * r.after / r.total) : 0) + '%';
        bar.append(fill);
        row.append(bar, el('span', 'cnt', r.now + ' → ' + r.after + ' / ' + r.total));
        if (r.lost.length) row.title = 'Gone: ' + r.lost.join(', ');
        wrap.append(row);
      });
      box.append(wrap);
    });
  }

  function renderPrep() {
    $('f-format').value = String(S.format);
    $('f-fearless').value = S.fearless;
    [0, 1].forEach(function (t) {
      const card = $('team-' + t);
      card.textContent = '';
      const team = S.teams[t];
      const head = el('div', 'form-row');
      const n = el('label', '', 'Team name');
      const ni = el('input'); ni.value = team.name; ni.maxLength = 40;
      ni.addEventListener('change', function () { team.name = ni.value.trim() || ('Team ' + (t ? 'B' : 'A')); commit(); });
      n.append(ni);
      const s = el('label', '', 'Tag');
      const si = el('input'); si.value = team.short; si.maxLength = 4; si.size = 5;
      si.addEventListener('change', function () { team.short = (si.value.trim() || team.name.slice(0, 3)).toUpperCase(); commit(); });
      s.append(si);
      head.append(n, s);
      card.append(el('h2', '', 'Roster ' + (t ? 'B' : 'A')), head);
      card.append(el('p', 'muted small', 'Pools: one champion per line or comma-separated. Add *1 for signature, *3 for pocket (default comfort).'));
      team.players.forEach(function (pl) {
        const row = el('div', 'player');
        const lab = el('label', 'pl-name', ROLE_NAME[pl.role]);
        const pi = el('input'); pi.value = pl.name; pi.placeholder = 'Player'; pi.maxLength = 24;
        pi.addEventListener('change', function () { pl.name = pi.value.trim(); commit(); });
        lab.append(pi);
        const ta = el('textarea');
        ta.rows = 2;
        ta.value = pl.pool.map(function (e) { return e.c + (e.t === 2 ? '' : '*' + e.t); }).join(', ');
        ta.setAttribute('aria-label', ROLE_NAME[pl.role] + ' champion pool');
        const warn = el('p', 'warn small');
        ta.addEventListener('change', function () {
          const parsed = parsePool(ta.value);
          pl.pool = parsed.pool;
          warn.textContent = parsed.unknown.length ? 'Not recognised: ' + parsed.unknown.join(', ') : '';
          save(); renderScore(); renderAdvice(); renderPressure(); renderBurn(); renderSeries();
        });
        row.append(lab, ta, warn);
        card.append(row);
      });
    });
    const sel = $('burn-team');
    const cur = sel.value || '0';
    sel.textContent = '';
    [0, 1].forEach(function (t) {
      const o = el('option', '', S.teams[t].name + ' vs ' + S.teams[1 - t].name);
      o.value = String(t);
      sel.append(o);
    });
    sel.value = cur;
    renderBurn();
  }
  function renderBurn() {
    const ol = $('burn');
    ol.textContent = '';
    const list = burnList(Number($('burn-team').value || 0)).slice(0, 12);
    if (!list.length) { ol.append(el('li', 'muted', 'No shared comfort champions left.')); return; }
    list.forEach(function (a) {
      const li = el('li', 'burn');
      li.append(el('b', '', a.name), el('span', 'why', a.why));
      ol.append(li);
    });
  }

  function parsePool(text) {
    const pool = [], unknown = [], seen = {};
    const lower = {};
    CHAMPS.forEach(function (c) { lower[c.name.toLowerCase().replace(/[^a-z]/g, '')] = c.name; });
    text.split(/[\n,]/).forEach(function (raw) {
      const t = raw.trim();
      if (!t) return;
      const m = /^(.*?)(?:\*([123]))?$/.exec(t);
      const key = m[1].toLowerCase().replace(/[^a-z]/g, '');
      const name = lower[key];
      if (!name) { unknown.push(m[1].trim()); return; }
      if (seen[name]) return;
      seen[name] = true;
      pool.push({ c: name, t: m[2] ? Number(m[2]) : 2 });
    });
    return { pool: pool, unknown: unknown };
  }

  function renderSeries() {
    const box = $('games');
    box.textContent = '';
    S.games.forEach(function (g, i) {
      const card = el('div', 'gcard' + (i === S.current ? ' cur' : ''));
      const head = el('div', 'ghead');
      head.append(el('b', '', 'Game ' + (i + 1)));
      head.append(el('span', 'muted small', S.teams[g.blue].short + ' blue · ' + S.teams[1 - g.blue].short + ' red'));
      head.append(el('span', 'small', g.winner === null ? (draftDone(g) ? 'result pending' : 'drafting') : S.teams[g.winner].short + ' won'));
      const open = el('button', 'btn ghost small', i === S.current ? 'Open' : 'Go to');
      open.addEventListener('click', function () { S.current = i; commit(); switchTab('draft'); });
      head.append(open);
      card.append(head);
      ['blue', 'red'].forEach(function (side) {
        const t = S.teams[teamOnSide(g, side)].short;
        const picks = picksOf(g, side);
        const roles = assignRoles(picks);
        card.append(el('p', 'line ' + side, t + ' picks: ' + (picks.length ? picks.map(function (c, k) { return c + ' (' + ROLE_NAME[roles[k]] + ')'; }).join(', ') : '—')));
        card.append(el('p', 'line muted small', t + ' bans: ' + bansOf(g, side).map(function (c) { return c || '—'; }).join(', ')));
      });
      const notes = el('textarea', 'notes');
      notes.rows = 2;
      notes.placeholder = 'Coach notes for game ' + (i + 1);
      notes.value = g.notes || '';
      notes.addEventListener('change', function () { g.notes = notes.value; save(); renderReport(); });
      card.append(notes);
      box.append(card);
    });
    const lk = $('locked-list');
    lk.textContent = '';
    if (S.fearless === 'off') { lk.append(el('p', 'muted', 'Fearless is off for this series.')); }
    else {
      const nextGi = S.games.length;
      (S.fearless === 'hard' ? [0] : [0, 1]).forEach(function (t) {
        const names = Object.keys(lockedFor(nextGi, t)).sort();
        const who = S.fearless === 'hard' ? 'Both teams' : S.teams[t].short;
        const p = el('p', '');
        p.append(el('b', '', 'Locked for ' + who + ' next game (' + names.length + '): '));
        p.append(document.createTextNode(names.length ? names.join(', ') : 'nothing locked yet'));
        lk.append(p);
      });
    }
    renderReport();
  }

  function report() {
    const lines = [];
    lines.push('# ' + S.teams[0].name + ' vs ' + S.teams[1].name + ' — Bo' + S.format + ', ' + (S.fearless === 'off' ? 'normal draft' : S.fearless + ' Fearless'));
    lines.push('');
    lines.push('Series: ' + S.teams[0].short + ' ' + wins(0) + ' – ' + wins(1) + ' ' + S.teams[1].short);
    S.games.forEach(function (g, i) {
      lines.push('');
      lines.push('## Game ' + (i + 1) + (g.winner === null ? '' : ' — ' + S.teams[g.winner].short + ' win'));
      ['blue', 'red'].forEach(function (side) {
        const t = S.teams[teamOnSide(g, side)].short;
        const picks = picksOf(g, side), roles = assignRoles(picks);
        lines.push('- **' + t + '** (' + side + ') picks: ' + (picks.length ? picks.map(function (c, k) { return c + ' ' + ROLE_NAME[roles[k]]; }).join(', ') : '—'));
        lines.push('- **' + t + '** bans: ' + bansOf(g, side).map(function (c) { return c || '—'; }).join(', '));
      });
      if (g.notes) lines.push('- Notes: ' + g.notes.replace(/\n/g, ' '));
    });
    lines.push('');
    lines.push('## Pool pressure going into the next game');
    [0, 1].forEach(function (t) {
      const locked = lockedFor(S.games.length, t);
      lines.push('');
      lines.push('### ' + S.teams[t].name);
      S.teams[t].players.forEach(function (pl) {
        const left = pl.pool.filter(function (e) { return !locked[e.c]; });
        lines.push('- ' + ROLE_NAME[pl.role] + ' ' + (pl.name || '—') + ': ' + left.length + '/' + pl.pool.length + ' left' + (left.length ? ' (' + left.map(function (e) { return e.c; }).join(', ') + ')' : ''));
      });
    });
    return lines.join('\n') + '\n';
  }
  function renderReport() { $('report').textContent = report(); }

  function download(name, text, type) {
    const blob = new Blob([text], { type: type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(function (b) {
      const on = b.dataset.tab === name;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.view').forEach(function (v) {
      const on = v.id === 'tab-' + name;
      v.classList.toggle('on', on);
      v.hidden = !on;
    });
  }

  // ---------- events ----------
  function bind() {
    document.querySelectorAll('.tab').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });
    $('grid').addEventListener('click', function (e) {
      const b = e.target.closest('.champ');
      if (b && !b.disabled) act(b.dataset.name);
    });
    $('search').addEventListener('input', function (e) { ui.search = e.target.value; renderGrid(); });
    $('search').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const first = $('grid').querySelector('.champ:not([disabled])');
        if (first && act(first.dataset.name)) { e.target.value = ''; ui.search = ''; renderGrid(); }
      }
    });
    $('role-filter').addEventListener('click', function (e) {
      const b = e.target.closest('.chip');
      if (!b) return;
      ui.role = b.dataset.r;
      document.querySelectorAll('#role-filter .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      renderGrid();
    });
    $('show-locked').addEventListener('change', function (e) { ui.showLocked = e.target.checked; renderGrid(); });
    $('undo').addEventListener('click', undo);
    $('reset-game').addEventListener('click', function () {
      if (!confirm('Clear every pick and ban in game ' + (S.current + 1) + '?')) return;
      const g = game(); g.steps = new Array(20).fill(null); g.winner = null; commit();
    });
    document.addEventListener('keydown', function (e) {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); switchTab('draft'); $('search').focus(); }
      else if (e.key === 'Backspace' && !typing) { e.preventDefault(); undo(); }
    });
    $('f-format').addEventListener('change', function (e) {
      const f = Number(e.target.value);
      if (f < S.games.length) { e.target.value = String(S.format); alert('This series already has ' + S.games.length + ' games.'); return; }
      S.format = f; commit();
    });
    $('f-fearless').addEventListener('change', function (e) { S.fearless = e.target.value; commit(); });
    $('burn-team').addEventListener('change', renderBurn);
    $('load-sample').addEventListener('click', function () { S = sampleSeries(); commit(); });
    $('new-series').addEventListener('click', function () {
      if (!confirm('Start a new empty series? Rosters are kept, games are cleared.')) return;
      const teams = S.teams;
      S = emptySeries(); S.teams = teams; commit();
    });
    $('copy-link').addEventListener('click', function () {
      const url = location.href.split('#')[0] + '#s=' + encodeState();
      const msg = $('share-msg');
      function done(ok) { msg.textContent = ok ? 'Link copied. Anyone who opens it gets this series as a local copy.' : url; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
    $('dl-json').addEventListener('click', function () { download('fearless-series.json', JSON.stringify(S, null, 2), 'application/json'); });
    $('dl-md').addEventListener('click', function () { download('fearless-report.md', report(), 'text/markdown'); });
    $('ul-json').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      f.text().then(function (t) {
        let o = null;
        try { o = validate(JSON.parse(t)); } catch (err) { o = null; }
        $('share-msg').textContent = o ? 'Imported.' : 'That file is not a Fearless Ledger series.';
        if (o) { S = o; commit(); }
      });
      e.target.value = '';
    });
  }

  bind();
  render();
  if (readHash()) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } save(); }

  // Test hook for headless checks (see .junie/guidelines.md).
  window.__ledger = {
    get state() { return S; },
    ORDER: ORDER, act: act, undo: undo, setWinner: setWinner, nextGame: nextGame,
    lockedFor: lockedFor, availableFor: availableFor, advice: advice, pressure: pressure,
    burnList: burnList, assignRoles: assignRoles, report: report, parsePool: parsePool,
    loadSample: function () { S = sampleSeries(); commit(); },
    reset: function () { S = emptySeries(); commit(); },
    encodeState: encodeState
  };
})();
