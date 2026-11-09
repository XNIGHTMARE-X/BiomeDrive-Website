/* BiomeDrive · page.js, for the inner pages (pricing, contact, legal, 404).
   Smooth scroll, the footer wordmark, heading entrances, scroll reveals, the legal-page index,
   the currency switch on pricing, and the same contact picker as the home page.
   Lenis is optional: everything works without it. */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const calm = root.classList.contains('calm');
  const CONFIG = window.BD_CONFIG;
  const navH = () => parseFloat(getComputedStyle(root).getPropertyValue('--nav')) || 68;

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (!calm && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 }); window.__lenis = lenis;
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToEl = el => {
    const y = el.getBoundingClientRect().top + (lenis ? lenis.scroll : scrollY) - navH() - 24;
    if (lenis) lenis.scrollTo(Math.max(0, y)); else scrollTo({ top: Math.max(0, y), behavior: calm ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#top') { e.preventDefault(); return lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' }); }
    const t = id.length > 1 && $(id);
    if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    history.replaceState(null, '', id);
  }));
  if (location.hash.length > 1) { const t = $(location.hash); if (t) setTimeout(() => scrollToEl(t), 60); }

  /* ---------------- the footer wordmark fills its row ---------------- */
  const fitWords = () => $$('.foot-word span').forEach(el => {
    el.style.fontSize = '100px';
    const w = el.scrollWidth, box = el.parentElement.clientWidth;
    if (w && box) el.style.fontSize = `${((100 * box) / w).toFixed(2)}px`;
  });
  fitWords();
  document.fonts.ready.then(fitWords);
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fitWords, 150); });
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------------- entrance: heading words rise out of a mask, then the rest fades up ---------------- */
  // Wrap each word of [data-split] headings (including words inside <em>) in two spans.
  $$('[data-split]').forEach(h => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(document.createTextNode(' '));
          const o = document.createElement('span'), w = document.createElement('span');
          o.className = 'wd'; w.textContent = part; w.style.setProperty('--i', i++);
          o.append(w); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('todo')) walk(n);
    });
    walk(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  });
  $$('.rise').forEach((el, i) => el.style.setProperty('--i', i));
  const go = () => requestAnimationFrame(() => root.classList.add('ready'));
  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 700))]).then(go);

  // sections fade up once as they arrive
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    $$('.reveal, .flow').forEach(el => io.observe(el));
  } else $$('.reveal, .flow').forEach(el => el.classList.add('seen'));
  $$('.flow li').forEach((li, i) => li.style.setProperty('--i', i));

  /* ---------------- legal pages: the index follows the section you are reading ---------------- */
  const tocLinks = $$('.toc ol a');
  if (tocLinks.length) {
    const secs = tocLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const mark = () => {
      const line = navH() + innerHeight * 0.25;
      let cur = secs[0];
      secs.forEach(s => { if (s.getBoundingClientRect().top <= line) cur = s; });
      tocLinks.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${cur.id}`)));
    };
    mark();
    addEventListener('scroll', mark, { passive: true });
  }

  /* ---------------- pricing: USD / GBP / EUR ---------------- */
  const sw = $('#curSwitch');
  if (sw) {
    const SYM = { usd: '$', gbp: '£', eur: '€' };
    const btns = $$('button', sw);
    const guess = () => {
      const l = (navigator.languages && navigator.languages[0]) || navigator.language || '';
      if (/-GB$|-IE$|^en-GB/i.test(l)) return /-IE$/i.test(l) ? 'eur' : 'gbp';
      if (/^(de|fr|nl|es|it|pt|fi|el|sk|sl|et|lv|lt)\b/i.test(l)) return 'eur';
      return 'usd';
    };
    let saved = null; try { saved = localStorage.getItem('bd-cur'); } catch (e) {}
    const set = (c, animate) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cur === c)));
      $$('[data-usd]').forEach(el => {
        const v = el.dataset[c];
        if (el.textContent === v) return;
        el.textContent = v;
        if (animate && !calm) { el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll'); }
      });
      $$('.sym').forEach(el => (el.textContent = SYM[c]));
      $$('[data-sym]').forEach(el => (el.textContent = SYM[c]));
    };
    set(SYM[saved] ? saved : guess(), false);
    btns.forEach(b => b.addEventListener('click', () => {
      set(b.dataset.cur, true);
      try { localStorage.setItem('bd-cur', b.dataset.cur); } catch (e) {}
    }));
  }

  /* ---------------- contact: one address on the page, a picker, an email to the whole team ---------------- */
  const pick = $('#mailPick');
  if (pick && CONFIG) {
    const enc = encodeURIComponent;
    const at = u => `${u}@${CONFIG.domain}`;
    const query = o => Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}=${enc(v)}`).join('&');
    const MAILERS = {
      gmail: { name: 'Gmail', url: (to, s, b) => `https://mail.google.com/mail/?view=cm&fs=1&${query({ to, su: s, body: b })}` },
      outlook: { name: 'Outlook', url: (to, s, b) => `https://outlook.live.com/mail/0/deeplink/compose?${query({ to, subject: s, body: b })}` },
      app: { name: 'your mail app', url: (to, s, b) => { const q = query({ subject: s, body: b }); return `mailto:${to}${q ? `?${q}` : ''}`; } },
    };
    const picks = $$('button', pick);
    let opener = null, draft = null, hideT = 0;
    $$('[data-mail]').forEach(b => { b.textContent = at(CONFIG.shown); });

    const placePick = () => {
      if (!opener) return;
      const r = opener.getBoundingClientRect(), w = pick.offsetWidth, h = pick.offsetHeight, m = 12, gap = 10;
      if (r.bottom < 0 || r.top > innerHeight) return closePick(false);
      const up = r.bottom + gap + h > innerHeight - m && r.top - gap - h > m;
      pick.classList.toggle('up', up);
      pick.style.left = `${Math.min(innerWidth - w - m, Math.max(m, r.left))}px`;
      pick.style.top = `${up ? r.top - gap - h : r.bottom + gap}px`;
    };
    const openPick = (el, subject = '', body = '', onPick = null) => {
      clearTimeout(hideT);
      if (opener && opener !== el) opener.setAttribute('aria-expanded', 'false');
      opener = el; draft = { subject, body, onPick };
      el.setAttribute('aria-expanded', 'true');
      pick.hidden = false;
      placePick();
      pick.classList.add('open');
      picks[0].focus({ preventScroll: true });
    };
    function closePick(refocus = true) {
      if (!opener) return;
      const el = opener;
      opener = null; draft = null;
      el.setAttribute('aria-expanded', 'false');
      pick.classList.remove('open');
      hideT = setTimeout(() => { pick.hidden = true; }, calm ? 0 : 250);
      if (refocus) el.focus({ preventScroll: true });
    }
    $$('[data-mail]').forEach(b => b.addEventListener('click', () => (opener === b ? closePick() : openPick(b))));
    picks.forEach(btn => btn.addEventListener('click', () => {
      const m = MAILERS[btn.dataset.mailer], { subject, body, onPick } = draft;
      const url = m.url(CONFIG.team.map(at).join(','), subject, body);
      if (btn.dataset.mailer === 'app') location.href = url; else window.open(url, '_blank', 'noopener');
      closePick();
      if (onPick) onPick(m.name);
    }));
    pick.addEventListener('keydown', e => {
      const i = picks.indexOf(document.activeElement), n = picks.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); picks[i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n].focus(); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); picks[e.key === 'Home' ? 0 : n - 1].focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); closePick(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && opener) { e.preventDefault(); closePick(); } });
    document.addEventListener('pointerdown', e => { if (opener && !pick.contains(e.target) && !opener.contains(e.target)) closePick(false); });
    addEventListener('scroll', placePick, { passive: true });
    addEventListener('resize', placePick);

    const form = $('#form');
    if (form) {
      const msg = $('#formMsg'), send = $('#formSend');
      form.addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(form);
        const name = (d.get('name') || '').trim(), email = (d.get('email') || '').trim();
        const badEmail = !/^\S+@\S+\.\S+$/.test(email);
        $('#f-name').closest('.field').classList.toggle('err', !name);
        $('#f-email').closest('.field').classList.toggle('err', badEmail);
        if (!name || badEmail) { msg.textContent = !name ? 'Add your name so we know who to reply to.' : 'Add an email we can reply to.'; return; }
        const plan = d.get('plan') ? `Plan: ${d.get('plan')}\n` : '';
        const body = `Name: ${name}\nEmail: ${email}\nBusiness / site: ${d.get('site') || '-'}\n${plan}\n${(d.get('message') || '').trim()}`;
        msg.textContent = 'Pick where to send it from.';
        openPick(send, `New project from ${name}`, body, app => { msg.textContent = `Opening ${app}…`; });
      });
      // pricing links like /contact/?plan=business pre-pick the plan
      const want = new URLSearchParams(location.search).get('plan'), sel = $('#f-plan');
      if (want && sel && [...sel.options].some(o => o.value === want)) sel.value = want;
    }
  }
})();
