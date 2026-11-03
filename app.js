(() => {
  'use strict';

  /* ---------- Données ---------- */
  const STORE_KEY = 'bocal-sandra-v1';
  const TOTAL = MESSAGES.length;
  const byId = new Map(MESSAGES.map((m) => [m.id, m]));
  const COLORS = ['rose', 'jaune', 'creme', 'eau'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s) => document.querySelector(s);

  const DEFAULTS = { unlocked: false, nom: null, opened: [], favoris: [], lettreLue: false, son: true, lastVisit: null, connus: null };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { ...DEFAULTS };
      const s = { ...DEFAULTS, ...JSON.parse(raw) };
      // Si messages.js a changé, on ignore les identifiants qui n'existent plus.
      const seen = new Set();
      s.opened = (Array.isArray(s.opened) ? s.opened : []).filter((o) => {
        if (!o || !byId.has(o.id) || seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      s.favoris = (Array.isArray(s.favoris) ? s.favoris : []).filter((id) => seen.has(id));
      return s;
    } catch (e) {
      return { ...DEFAULTS };
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible : on continue en mémoire */ }
  }

  const state = load();
  const previousVisit = state.lastVisit;

  // Nouveaux mots ajoutés depuis la dernière visite ?
  const allIds = MESSAGES.map((m) => m.id);
  const newWords = Array.isArray(state.connus) ? allIds.filter((id) => !state.connus.includes(id)).length : 0;
  state.connus = allIds;
  state.lastVisit = Date.now();
  save();

  const openedIds = () => new Set(state.opened.map((o) => o.id));
  const remainingIds = () => { const o = openedIds(); return MESSAGES.map((m) => m.id).filter((id) => !o.has(id)); };
  const numberOf = (id) => state.opened.findIndex((o) => o.id === id) + 1;
  const colorOf = (id) => COLORS[(id * 3) % COLORS.length];
  const isFav = (id) => state.favoris.includes(id);

  function catClass(cat) {
    const c = cat.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (c.startsWith('ouvre')) return 'cat-ouvre';
    for (const k of ['tendre', 'drole', 'souvenir', 'promesse', 'defi', 'dore']) if (c.startsWith(k)) return 'cat-' + k;
    return '';
  }

  function randomInt(n) {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  // Tirage sans répétition ; les mots marqués « dernier » attendent la fin.
  function pickNext(rem) {
    const pool = rem.filter((id) => !byId.get(id).dernier);
    const list = pool.length ? pool : rem;
    return list[randomInt(list.length)];
  }

  /* ---------- Petits utilitaires ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Graine fixe par emplacement : le bocal garde toujours la même allure.
  function seeded(i) {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  function displayName(nom) {
    if (!nom) return 'Sandra';
    if (/^(Sandra|Mme|Madame)/.test(nom)) return nom;
    return nom.charAt(0).toLowerCase() + nom.slice(1);
  }

  /* ---------- Son et vibration ---------- */
  let audioCtx = null;
  function audio() {
    if (!state.son) return null;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }

  // Froissement de papier synthétisé (pas de fichier audio à charger).
  function rustle(duration = 0.35, volume = 0.22) {
    const a = audio();
    if (!a) return;
    const len = Math.floor(a.sampleRate * duration);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    let crackle = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      if (Math.random() < 0.004) crackle = 1;
      crackle *= 0.992;
      const env = Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t);
      d[i] = (Math.random() * 2 - 1) * env * (0.25 + crackle);
    }
    const src = a.createBufferSource();
    src.buffer = buf;
    const band = a.createBiquadFilter();
    band.type = 'bandpass'; band.frequency.value = 3200; band.Q.value = 0.6;
    const gain = a.createGain();
    gain.gain.value = volume;
    src.connect(band).connect(gain).connect(a.destination);
    src.start();
  }

  function chime() {
    const a = audio();
    if (!a) return;
    [880, 1318.5, 1760].forEach((f, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      const t = a.currentTime + i * 0.12;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + 1.3);
    });
  }

  const vibrate = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* rien */ } };

  /* ---------- Écrans ---------- */
  const screens = { welcome: $('#screen-welcome'), home: $('#screen-home'), collection: $('#screen-collection') };
  let current = null;
  function show(name) {
    for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
    current = name;
    if (name === 'home') renderHome();
    if (name === 'collection') {
      renderCollection();
      // Petite cascade à l'ouverture seulement, pas à chaque mise à jour.
      const list = $('#collection-list');
      list.classList.remove('enter');
      if (!reduceMotion.matches) { void list.offsetWidth; list.classList.add('enter'); setTimeout(() => list.classList.remove('enter'), 700); }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Bienvenue ---------- */
  const accepted = new Map(SURNOMS.map((s) => [norm(s), s]));
  let attempts = 0;
  $('#welcome-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#welcome-input');
    const match = accepted.get(norm(input.value));
    const err = $('#welcome-error');
    if (!match) {
      attempts++;
      err.textContent = attempts >= 2
        ? 'Indice : ton prénom, ou un des petits noms que je te donne ♥'
        : 'Hmm… ce n’est pas comme ça que je t’appelle. Essaie encore.';
      input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
      vibrate([20, 40, 20]);
      return;
    }
    state.unlocked = true;
    state.nom = match;
    save();
    input.blur();
    vibrate(30);
    show('home');
    $('#greeting').textContent = `Bienvenue, ${displayName(match)} ♥`;
  });

  /* ---------- Le bocal ---------- */
  const jarEl = $('#jar');
  const papersEl = $('#jar-papers');
  const slots = [];
  const SLOTS = Math.min(TOTAL, 32); // au-delà, le bocal reste simplement « plein »
  for (let i = 0; i < SLOTS; i++) {
    const el = document.createElement('span');
    const cols = 4;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = 4 + col * 23 + (seeded(i) - 0.5) * 7 + (row % 2 ? 3 : -2);
    const y = 3 + row * (78 / Math.max(1, Math.ceil(SLOTS / cols))) + (seeded(i + 50) - 0.5) * 3;
    const rot = (seeded(i + 100) - 0.5) * 70;
    el.className = 'paper-mini c-' + COLORS[Math.floor(seeded(i + 200) * COLORS.length)];
    el.style.left = x + '%';
    el.style.bottom = y + '%';
    el.style.transform = `rotate(${rot.toFixed(1)}deg)`;
    el.style.zIndex = String(i + 1);
    el.dataset.rot = rot.toFixed(1);
    papersEl.appendChild(el);
    slots.push(el);
  }
  const goldEl = document.createElement('span');
  goldEl.className = 'paper-mini c-gold';
  goldEl.hidden = true;
  papersEl.appendChild(goldEl);

  function renderHome() {
    const rem = remainingIds().length;
    slots.forEach((el, i) => { el.hidden = i >= rem; });
    goldEl.hidden = rem > 0;

    const counter = $('#counter');
    const btn = $('#btn-draw');
    if (rem > 1) { counter.textContent = `${rem} mots t’attendent`; btn.textContent = 'Ouvre-moi'; }
    else if (rem === 1) { counter.textContent = '1 mot t’attend… le dernier'; btn.textContent = 'Ouvre-moi'; }
    else if (!state.lettreLue) { counter.textContent = 'Le bocal est vide… enfin, presque.'; btn.textContent = 'Ouvre le papier doré'; }
    else { counter.textContent = 'Tu as tout lu. Le papier doré est à toi.'; btn.textContent = 'Relire la lettre'; }

    $('#collection-count').textContent = String(state.opened.length);
    renderSound();
  }

  function renderSound() {
    const b = $('#btn-sound');
    b.setAttribute('aria-pressed', String(state.son));
    b.setAttribute('aria-label', state.son ? 'Son activé' : 'Son coupé');
  }

  function greet() {
    const nom = displayName(state.nom);
    const away = previousVisit ? Date.now() - previousVisit : 0;
    if (newWords > 0) {
      $('#greeting').textContent = newWords === 1 ? `✨ Un nouveau mot pour toi, ${nom}` : `✨ ${newWords} nouveaux mots pour toi, ${nom}`;
      return;
    }
    $('#greeting').textContent = away > 12 * 3600 * 1000 ? `Te revoilà, ${nom} ♥` : `Coucou, ${nom} ♥`;
  }

  /* ---------- Envol du papier ---------- */
  function measure(el) {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: el.offsetWidth, h: el.offsetHeight, rot: parseFloat(el.dataset.rot || '-6'), cls: el.className.replace('paper-mini', '').trim() };
  }

  /* ---------- Mélange et paillettes ---------- */
  const canAnimate = () => !reduceMotion.matches && !!Element.prototype.animate;

  // Le bocal tangue et les papiers se mélangent avant le tirage.
  function shuffleJar(duration = 620) {
    if (!canAnimate()) return Promise.resolve();
    jarEl.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-3deg)', offset: 0.2 },
      { transform: 'rotate(2.5deg)', offset: 0.45 },
      { transform: 'rotate(-1.5deg)', offset: 0.7 },
      { transform: 'rotate(0deg)' },
    ], { duration, easing: 'ease-in-out' });

    const papers = slots.filter((el) => !el.hidden);
    if (!goldEl.hidden) papers.push(goldEl);
    return Promise.all(papers.map((el) => {
      const rot = parseFloat(el.dataset.rot || '-6');
      const z = el.style.zIndex || '1';
      const frames = [{ transform: `translate(0%,0%) rotate(${rot}deg)`, zIndex: z }];
      for (let k = 1; k <= 3; k++) {
        const dx = (Math.random() - 0.5) * 70;          // en % de la largeur du papier
        const dy = (Math.random() - 0.65) * 140;        // plutôt vers le haut : ça remue
        const turn = rot + (Math.random() - 0.5) * 90;
        frames.push({ transform: `translate(${dx}%,${dy}%) rotate(${turn}deg)`, zIndex: String(1 + randomInt(40)), offset: k / 4 });
      }
      frames.push({ transform: `translate(0%,0%) rotate(${rot}deg)`, zIndex: z });
      return el.animate(frames, { duration, delay: Math.random() * 70, easing: 'ease-in-out' }).finished;
    })).catch(() => {});
  }

  const SPARKLE_COLORS = ['#f2c75c', '#ffffff', '#f2b8b2', '#e0a54a', '#fff3c4', '#d98a84'];
  function sparkleBurst(x, y, count = 14, spread = 70) {
    if (!canAnimate()) return;
    const fx = $('#fx');
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      const size = 7 + Math.random() * 9;
      s.className = 'sparkle';
      Object.assign(s.style, { left: x - size / 2 + 'px', top: y - size / 2 + 'px', width: size + 'px', height: size + 'px', background: SPARKLE_COLORS[randomInt(SPARKLE_COLORS.length)] });
      fx.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = spread * (0.4 + Math.random() * 0.6);
      const dx = Math.cos(a) * d;
      const dy = Math.sin(a) * d - 10;
      s.animate([
        { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy + 16}px) scale(.3) rotate(180deg)`, opacity: 0 },
      ], { duration: 650 + Math.random() * 450, delay: Math.random() * 80, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' })
        .finished.then(() => s.remove());
    }
  }

  // Petite traînée de paillettes derrière le papier qui vole.
  function sparkleTrail(el, ms) {
    if (!canAnimate()) return;
    const end = performance.now() + ms;
    let last = 0;
    (function tick(t) {
      if (t > end || !el.isConnected) return;
      if (t - last > 40) {
        last = t;
        const r = el.getBoundingClientRect();
        sparkleBurst(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 1, 28);
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  async function fly(info, { gold = false } = {}) {
    if (reduceMotion.matches || !info.w || !Element.prototype.animate) return null;
    const jarTop = jarEl.getBoundingClientRect().top;
    const clone = document.createElement('div');
    clone.className = 'paper-fly ' + info.cls;
    Object.assign(clone.style, { width: info.w + 'px', height: info.h + 'px', left: info.cx - info.w / 2 + 'px', top: info.cy - info.h / 2 + 'px' });
    document.body.appendChild(clone);

    jarEl.classList.add('is-open');
    const up = jarTop - info.h * 1.4 - info.cy;
    await clone.animate([
      { transform: `translate(0,0) rotate(${info.rot}deg)` },
      { transform: `translate(0,${up - 22}px) rotate(${info.rot * 0.3}deg) scale(1.15)`, offset: 0.7 },
      { transform: `translate(0,${up}px) rotate(0deg) scale(1.1)` },
    ], { duration: 520, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished;

    // Le papier sort du bocal : une gerbe de paillettes.
    const out = clone.getBoundingClientRect();
    sparkleBurst(out.left + out.width / 2, out.top + out.height / 2, gold ? 26 : 16, gold ? 95 : 70);

    const dx = window.innerWidth / 2 - info.cx;
    const dy = window.innerHeight * 0.45 - info.cy;
    const scale = Math.min(4, (Math.min(window.innerWidth, 420) * 0.5) / info.w);
    sparkleTrail(clone, 420);
    await clone.animate([
      { transform: `translate(0,${up}px) rotate(0deg) scale(1.1)` },
      { transform: `translate(${dx}px,${dy}px) rotate(-4deg) scale(${scale})` },
    ], { duration: 420, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'forwards' }).finished;

    jarEl.classList.remove('is-open');
    sparkleBurst(window.innerWidth / 2, window.innerHeight * 0.45, gold ? 22 : 12, gold ? 160 : 120);
    return clone;
  }

  function dropClone(clone) {
    if (!clone) return;
    clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.then(() => clone.remove());
  }

  let busy = false;
  async function draw() {
    if (busy) return;
    busy = true;
    try {
      audio(); // débloque le son pendant le geste
      const rem = remainingIds();
      if (rem.length === 0) {
        vibrate(30);
        rustle(0.7, 0.22);
        await shuffleJar();
        const clone = await fly(measure(goldEl), { gold: true });
        const first = !state.lettreLue;
        openLetter({ fromJar: true });
        dropClone(clone);
        if (first) { chime(); confetti(); }
        return;
      }
      const id = pickNext(rem);
      // Enregistré tout de suite : la progression survit même si l'app est fermée pendant l'animation.
      state.opened.push({ id, at: Date.now() });
      save();
      vibrate(30);
      rustle(0.7, 0.22);
      await shuffleJar();
      const info = measure(slots[Math.min(rem.length, SLOTS) - 1]);
      renderHome();
      const clone = await fly(info);
      openMessage(id, { fromJar: true });
      dropClone(clone);
    } finally {
      busy = false;
    }
  }

  /* ---------- Le papier déplié ---------- */
  const overlay = $('#overlay');
  const sheet = $('#sheet');
  let sheetMode = null;

  function openOverlay() {
    if (!(history.state && history.state.overlay)) history.pushState({ ...(history.state || {}), overlay: true }, '');
    overlay.classList.remove('is-closing');
    overlay.hidden = false;
    sheet.classList.remove('unfold');
    void sheet.offsetWidth;
    sheet.classList.add('unfold');
    setTimeout(() => { const f = sheet.querySelector('.btn-primary, .btn'); if (f) f.focus({ preventScroll: true }); }, 400);
  }

  function hideOverlay(instant) {
    if (overlay.hidden) return Promise.resolve();
    if (instant || reduceMotion.matches) { overlay.hidden = true; return Promise.resolve(); }
    overlay.classList.add('is-closing');
    return wait(160).then(() => { overlay.hidden = true; overlay.classList.remove('is-closing'); });
  }

  function closeOverlay() {
    if (history.state && history.state.overlay) history.back(); // popstate ferme le papier
    else hideOverlay();
  }

  function openMessage(id, { fromJar = false } = {}) {
    const m = byId.get(id);
    const rem = remainingIds().length;
    sheetMode = { type: 'mot', id };
    sheet.className = 'sheet c-' + colorOf(id);
    const nextLabel = rem > 0 ? 'Un autre mot' : 'Le papier doré ✨';
    sheet.innerHTML = `
      <div class="sheet-content">
        <div class="sheet-head">
          <h2 id="sheet-title" class="sheet-num">Mot n° ${numberOf(id)}</h2>
          <span class="chip ${catClass(m.categorie)}">${esc(m.categorie)}</span>
        </div>
        ${m.photo ? `<figure class="polaroid"><img src="${esc(m.photo)}" alt="Photo de Sandra" loading="eager" decoding="async"></figure>` : ''}
        <p class="sheet-text">${esc(m.texte)}</p>
        <div class="sheet-actions">
          ${fromJar ? `<button class="btn btn-primary" type="button" data-action="next">${nextLabel}</button>` : ''}
          <button class="btn btn-soft" type="button" data-action="fav" aria-pressed="${isFav(id)}">${isFav(id) ? '♥ Gardé' : '♡ Garder'}</button>
          <button class="btn btn-soft" type="button" data-action="close">Fermer</button>
        </div>
      </div>`;
    const img = sheet.querySelector('.polaroid img');
    if (img) img.addEventListener('error', () => img.closest('.polaroid').remove(), { once: true });
    openOverlay();
    if (fromJar) setTimeout(() => rustle(0.25, 0.12), 250);
  }

  function openLetter({ fromJar = false } = {}) {
    sheetMode = { type: 'lettre' };
    state.lettreLue = true;
    save();
    renderHome();
    sheet.className = 'sheet sheet-gold';
    sheet.innerHTML = `
      <div class="sheet-content">
        <div class="sheet-head">
          <h2 id="sheet-title" class="sheet-num">Le papier doré</h2>
          <span class="chip cat-dore">Doré</span>
        </div>
        <p class="sheet-text">${esc(LETTRE_FINALE)}</p>
        <p class="signature">${esc(SIGNATURE)}</p>
        <div class="sheet-actions">
          <button class="btn btn-primary" type="button" data-action="close">Fermer</button>
        </div>
      </div>`;
    openOverlay();
    if (!fromJar) rustle(0.25, 0.12);
  }

  sheet.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const action = b.dataset.action;
    if (action === 'close') closeOverlay();
    if (action === 'fav' && sheetMode && sheetMode.type === 'mot') {
      const id = sheetMode.id;
      state.favoris = isFav(id) ? state.favoris.filter((x) => x !== id) : [...state.favoris, id];
      save();
      b.setAttribute('aria-pressed', String(isFav(id)));
      b.textContent = isFav(id) ? '♥ Gardé' : '♡ Garder';
      b.classList.remove('heart-pop'); void b.offsetWidth; b.classList.add('heart-pop');
      if (isFav(id)) vibrate(15);
      if (current === 'collection') renderCollection();
    }
    if (action === 'next') {
      // On garde l'entrée d'historique : le prochain papier la réutilise.
      await hideOverlay();
      draw();
    }
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closeOverlay(); });

  /* ---------- Collection ---------- */
  let tab = 'tous';
  function renderCollection() {
    const list = $('#collection-list');
    const favCount = state.favoris.length;
    $('#tab-count-tous').textContent = `(${state.opened.length})`;
    $('#tab-count-favoris').textContent = `(${favCount})`;
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));

    let items = state.opened.map((o, i) => ({ id: o.id, n: i + 1 }));
    if (tab === 'favoris') items = items.filter((it) => isFav(it.id));
    items.reverse(); // le plus récent en haut

    let html = '';
    if (tab === 'tous' && state.lettreLue) {
      html += `<button class="mot-card c-gold" type="button" data-letter="1">
        <div class="mot-card-head"><span>✨ Le papier doré</span></div>
        <p class="mot-card-text">${esc(LETTRE_FINALE.split('\n')[0])}</p></button>`;
    }
    html += items.map(({ id, n }, i) => {
      const m = byId.get(id);
      return `<button class="mot-card c-${colorOf(id)}" type="button" data-id="${id}" style="--i:${Math.min(i + 1, 8)}">
        <div class="mot-card-head"><span>Mot n° ${n} · ${esc(m.categorie)}</span>${isFav(id) ? '<span class="fav" aria-label="Gardé">♥</span>' : ''}</div>
        <p class="mot-card-text">${esc(m.texte)}</p></button>`;
    }).join('');

    if (!html) {
      html = tab === 'favoris'
        ? '<p class="empty">Aucun mot gardé pour l’instant.<br>Touche « ♡ Garder » sur ceux que tu préfères.</p>'
        : '<p class="empty">Aucun mot pour l’instant.<br>Le bocal t’attend.</p>';
    }
    list.innerHTML = html;
  }

  $('#collection-list').addEventListener('click', (e) => {
    const card = e.target.closest('.mot-card');
    if (!card) return;
    if (card.dataset.letter) openLetter();
    else openMessage(Number(card.dataset.id));
  });
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; renderCollection(); }));

  function openCollection() {
    history.pushState({ screen: 'collection' }, '');
    show('collection');
  }
  function backHome() {
    if (history.state && history.state.screen === 'collection') history.back();
    else show('home');
  }

  $('#btn-reset').addEventListener('click', () => {
    const ok = window.confirm('Recommencer le bocal ?\nTous les papiers retournent dedans, et les mots gardés sont effacés.');
    if (!ok) return;
    state.opened = [];
    state.favoris = [];
    state.lettreLue = false;
    save();
    backHome();
    renderHome();
  });

  /* ---------- Bouton retour Android ---------- */
  window.addEventListener('popstate', () => {
    const st = history.state || {};
    if (!st.overlay) hideOverlay();
    if (!state.unlocked) return;
    const target = st.screen === 'collection' ? 'collection' : 'home';
    if (target !== current) show(target);
  });

  /* ---------- Confettis ---------- */
  function confetti() {
    if (reduceMotion.matches || !Element.prototype.animate) return;
    const fx = $('#fx');
    const colors = ['#f7cdc7', '#f9e29a', '#e0a54a', '#c4e6da', '#d9a63c', '#fff3c4'];
    const h = window.innerHeight;
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('i');
      c.className = 'confetto';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      const sway = (Math.random() - 0.5) * 120;
      const spin = (Math.random() - 0.5) * 900;
      fx.appendChild(c);
      c.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${sway}px,${h * 0.6}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${sway * 1.4}px,${h + 40}px) rotate(${spin}deg)`, opacity: 0 },
      ], { duration: 2200 + Math.random() * 1400, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.4,.6,1)', fill: 'forwards' })
        .finished.then(() => c.remove());
    }
  }

  /* ---------- Branchements ---------- */
  $('#btn-draw').addEventListener('click', draw);
  jarEl.addEventListener('click', draw);
  $('#btn-collection').addEventListener('click', openCollection);
  $('#btn-back').addEventListener('click', backHome);
  $('#btn-sound').addEventListener('click', () => {
    state.son = !state.son;
    save();
    renderSound();
    if (state.son) rustle(0.2, 0.12);
  });

  /* ---------- Démarrage ---------- */
  if (state.unlocked) {
    history.replaceState({}, '');
    show('home');
    greet();
  } else {
    show('welcome');
  }

  // Demande au téléphone de ne pas effacer la progression.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* rien */ }

  /* ---------- Mises à jour à distance ----------
   * Sur iPhone, l'app installée reste souvent ouverte en arrière-plan : quand
   * Sandra y revient, on regarde discrètement si messages.js a changé, et on
   * recharge si c'est le cas (jamais pendant qu'un papier est ouvert). */
  let swReg = null;
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').then((r) => { swReg = r; }).catch(() => {});
    });
  }

  const currentSig = JSON.stringify(MESSAGES) + '|' + LETTRE_FINALE;
  let lastCheck = Date.now();

  async function checkForNewWords() {
    if (Date.now() - lastCheck < 60 * 1000 || !navigator.onLine) return;
    lastCheck = Date.now();
    try {
      if (swReg) swReg.update().catch(() => {});
      const res = await fetch('messages.js?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const code = await res.text();
      const fresh = new Function(code + '\n;return { m: MESSAGES, l: LETTRE_FINALE };')();
      if (JSON.stringify(fresh.m) + '|' + fresh.l === currentSig) return;
      // On attend qu'aucun papier ne soit ouvert pour ne rien interrompre.
      (function reloadWhenIdle() {
        if (overlay.hidden && !busy) location.reload();
        else setTimeout(reloadWhenIdle, 1000);
      })();
    } catch (e) { /* hors ligne ou fichier en cours d'envoi : on réessaiera */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForNewWords(); });
  window.addEventListener('focus', checkForNewWords);
})();
