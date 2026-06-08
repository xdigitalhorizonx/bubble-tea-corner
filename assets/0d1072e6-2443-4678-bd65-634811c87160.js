(function () {
  'use strict';

  /* ---------- Floating bubbles ---------- */
  const field = document.getElementById('bubbleField');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (field && !reduce) {
    const COUNT = 16;
    for (let i = 0; i < COUNT; i++) {
      const b = document.createElement('span');
      b.className = 'bubble';
      const size = 10 + Math.random() * 42;          // 10–52px
      const left = Math.random() * 100;              // vw
      const dur = 14 + Math.random() * 16;           // 14–30s
      const delay = -Math.random() * 30;             // stagger, negative = mid-flight
      const sway = (Math.random() * 46 - 23).toFixed(0) + 'px';
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = left + 'vw';
      b.style.animationDuration = dur + 's';
      b.style.animationDelay = delay + 's';
      b.style.setProperty('--sway', sway);
      field.appendChild(b);
    }
  }

  /* ---------- Menu: category filter ---------- */
  const filters = document.getElementById('filters');
  const cards = Array.prototype.slice.call(document.querySelectorAll('.drink-card'));
  if (filters) {
    filters.addEventListener('click', function (e) {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      filters.querySelectorAll('.filter').forEach(function (f) { f.classList.remove('active'); });
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      cards.forEach(function (card) {
        const show = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  }

  /* ---------- Menu: size toggle ---------- */
  const sizeToggle = document.getElementById('sizeToggle');
  if (sizeToggle) {
    sizeToggle.addEventListener('click', function (e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      sizeToggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      const size = btn.getAttribute('data-size');
      document.querySelectorAll('.price').forEach(function (p) {
        const val = p.getAttribute(size === 'lg' ? 'data-lg' : 'data-reg');
        p.innerHTML = '$' + val;
      });
    });
  }

  /* ---------- Favorites ---------- */
  document.querySelectorAll('.fav').forEach(function (f) {
    f.addEventListener('click', function () { f.classList.toggle('on'); });
  });

  /* ---------- Add to order + toast ---------- */
  let count = 0;
  const cartCount = document.getElementById('cartCount');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }

  document.querySelectorAll('.add-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      count++;
      if (cartCount) {
        cartCount.textContent = count;
        cartCount.classList.add('show');
      }
      const card = btn.closest('.drink-card');
      const name = card ? card.querySelector('.drink-name').textContent : 'Drink';
      showToast(name + ' added to your order');
      const label = btn.querySelector('svg') ? btn.innerHTML : 'Add';
      btn.classList.add('added');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Added';
      setTimeout(function () {
        btn.classList.remove('added');
        btn.innerHTML = label;
      }, 1200);
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  const sections = ['top', 'menu', 'about', 'locations']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { obs.observe(s); });
  }
})();

/* ===================== CHASE MODE (cursor mascot) ===================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(pointer: coarse)').matches;
  var bubble = document.getElementById('chaseBubble');
  var sprite = document.getElementById('cursor-chaser');
  if (!bubble || !sprite) return;
  if (reduce || touch) { bubble.style.display = 'none'; return; }

  var state = {
    x: window.innerWidth / 2, y: window.innerHeight / 2,
    targetX: window.innerWidth / 2, targetY: window.innerHeight / 2,
    lastX: window.innerWidth / 2, visible: false, direction: 1
  };
  var config = { followStrength: 0.09, cursorOffsetX: 38, cursorOffsetY: 58, maxTilt: 10, bobAmount: 5, delay: 300 };
  var rafId = null, active = false;
  var trail = []; // recent pointer samples {x, y, t} for delayed following

  // lightweight feedback reusing the toast element
  var toastEl = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastTimer = null;
  function feedback(msg) {
    if (!toastEl) return;
    if (toastMsg) toastMsg.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1700);
  }

  function onMove(event) {
    trail.push({ x: event.clientX, y: event.clientY, t: performance.now() });
  }

  // Returns the cursor position from config.delay ms ago, so the sprite
  // trails behind in time — it follows you instead of being you.
  function delayedPoint(now) {
    var targetT = now - config.delay;
    while (trail.length > 2 && trail[1].t <= targetT) trail.shift();
    if (!trail.length) return null;
    if (trail.length === 1) return { x: trail[0].x, y: trail[0].y };
    var a = trail[0], b = trail[1];
    var span = b.t - a.t;
    var f = span > 0 ? Math.max(0, Math.min(1, (targetT - a.t) / span)) : 1;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  function animate(time) {
    var aim = delayedPoint(time);
    if (aim) {
      state.targetX = aim.x - config.cursorOffsetX;
      state.targetY = aim.y - config.cursorOffsetY;
    }
    var dx = state.targetX - state.x;
    var dy = state.targetY - state.y;
    state.x += dx * config.followStrength;
    state.y += dy * config.followStrength;

    var velocityX = state.x - state.lastX;
    if (Math.abs(velocityX) > 0.18) state.direction = velocityX > 0 ? 1 : -1;
    state.lastX = state.x;

    var tilt = Math.max(-config.maxTilt, Math.min(config.maxTilt, velocityX * 1.6));
    var bob = Math.sin(time / 155) * config.bobAmount;
    var squash = 1 + Math.min(0.08, Math.hypot(dx, dy) / 4000);

    sprite.style.transform = 'translate3d(' + state.x + 'px, ' + (state.y + bob) + 'px, 0) scaleX(' + state.direction + ') rotate(' + tilt + 'deg) scaleY(' + squash + ')';
    rafId = requestAnimationFrame(animate);
  }

  function start() {
    if (active) return;
    active = true;
    trail.length = 0;
    // launch the mascot out of the heart bubble, then let it drift to the cursor
    var r = bubble.getBoundingClientRect();
    state.x = r.left + r.width / 2 - config.cursorOffsetX;
    state.y = r.top + r.height / 2 - config.cursorOffsetY;
    state.lastX = state.x;
    state.targetX = state.x;
    state.targetY = state.y;
    document.body.classList.add('chase-on');
    bubble.classList.add('active');
    bubble.setAttribute('aria-pressed', 'true');
    sprite.style.opacity = '1';
    window.addEventListener('pointermove', onMove, { passive: true });
    rafId = requestAnimationFrame(animate);
    feedback('Chase mode on — move your cursor!');
  }

  function stop() {
    if (!active) return;
    active = false;
    document.body.classList.remove('chase-on');
    bubble.classList.remove('active');
    bubble.setAttribute('aria-pressed', 'false');
    window.removeEventListener('pointermove', onMove);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    sprite.style.opacity = '0';
    feedback('Chase mode off');
  }

  bubble.addEventListener('click', function () {
    if (active) stop(); else start();
  });
})();
