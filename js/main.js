/* AK Logistics — hero interactions */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    mainNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Track / Ship tabs ---------- */
  var tabs = document.querySelectorAll('.order-tab');
  var panels = document.querySelectorAll('.order-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(function (p) {
        var active = p.id === 'panel-' + tab.dataset.tab;
        p.classList.toggle('is-active', active);
        p.classList.toggle('is-hidden', !active);
        p.setAttribute('aria-hidden', String(!active));
        p.inert = !active;
      });
    });
  });

  /* ---------- Track-by pills ---------- */
  var pills = document.querySelectorAll('.pill');
  var trackInput = document.getElementById('trackInput');
  var trackMsg = document.getElementById('trackMsg');
  var trackSubmitLabel = document.querySelector('#trackSubmit span');

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) {
        var active = p === pill;
        p.classList.toggle('is-active', active);
        p.setAttribute('aria-checked', String(active));
      });
      trackInput.placeholder = pill.dataset.placeholder;
      trackInput.value = '';
      trackInput.classList.remove('has-error');
      trackMsg.textContent = '';
      trackMsg.classList.remove('is-ok');
      // Mobile needs OTP verification; other identifiers track directly
      trackSubmitLabel.textContent = pill.textContent.trim() === 'Mobile' ? 'Get OTP' : 'Track Now';
      trackInput.focus();
    });
  });

  /* ---------- Track form (front-end validation only) ---------- */
  var trackForm = document.getElementById('panel-track');
  if (trackForm) {
    trackForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var mode = document.querySelector('.pill.is-active').textContent.trim();
      var value = trackInput.value.trim();
      var error = '';

      if (!value) {
        error = 'Please enter your ' + (mode === 'Mobile' ? 'mobile number' : mode) + '.';
      } else if (mode === 'Mobile' && !/^[6-9]\d{9}$/.test(value)) {
        error = 'Enter a valid 10-digit mobile number.';
      }

      trackInput.classList.toggle('has-error', !!error);
      trackMsg.classList.toggle('is-ok', !error);
      // TODO: connect to the tracking / OTP API
      trackMsg.textContent = error || (mode === 'Mobile' ? 'OTP request ready to send (API not connected yet).' : 'Tracking lookup ready (API not connected yet).');
    });
  }

  /* ---------- Ship form (front-end validation only) ---------- */
  var shipForm = document.getElementById('panel-ship');
  var shipMsg = document.getElementById('shipMsg');
  if (shipForm) {
    shipForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = shipForm.querySelectorAll('.order-input');
      var ok = true;
      inputs.forEach(function (input) {
        var valid = /^\d{6}$/.test(input.value.trim());
        input.classList.toggle('has-error', !valid);
        if (!valid) ok = false;
      });
      shipMsg.classList.toggle('is-ok', ok);
      // TODO: connect to the rate / quote API
      shipMsg.textContent = ok ? 'Quote request ready (API not connected yet).' : 'Enter valid 6-digit pincodes.';
    });
  }
})();

/* ---------- Why AK: grey words turn dark as the section scrolls into view ---------- */
(function () {
  'use strict';
  var muted = document.querySelector('.why-title .muted');
  var title = document.querySelector('.why-title');
  if (!muted || !title) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var words = muted.textContent.trim().split(/\s+/);
  muted.textContent = '';
  var spans = words.map(function (w, i) {
    var s = document.createElement('span');
    s.className = 'reveal-word';
    s.textContent = w;
    muted.appendChild(s);
    if (i < words.length - 1) muted.appendChild(document.createTextNode(' '));
    return s;
  });

  var ticking = false;
  function update() {
    ticking = false;
    var r = title.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var start = vh * 0.9;             // reveal begins as the heading enters the screen
    var end = vh * 0.8;               // and finishes once the whole heading is in view
    var p = (start - r.top) / ((start - end) + r.height);
    p = Math.max(0, Math.min(1, p));
    var on = Math.round(p * spans.length);
    for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-on', i < on);
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- Testimonials slider ---------- */
(function () {
  'use strict';
  var root = document.getElementById('testimonialSlider');
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll('.ts-slide'));
  var dotsWrap = document.getElementById('tsDots');
  var prev = document.getElementById('tsPrev');
  var next = document.getElementById('tsNext');
  if (slides.length < 2) return;

  var index = 0, busy = false, timer = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTOPLAY_MS = 6000;

  var dots = slides.map(function (_, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'ts-dot';
    d.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
    d.addEventListener('click', function () { go(i, i > index ? 1 : -1); });
    dotsWrap.appendChild(d);
    return d;
  });

  function mark() {
    slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== index)); });
    dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === index)); });
  }

  // dir: 1 = new slide comes in from the right, -1 = from the left
  function go(to, dir) {
    to = (to + slides.length) % slides.length;
    if (busy || to === index) return;
    var out = slides[index], inc = slides[to];

    if (reduce) {
      out.classList.remove('is-active'); out.style.transform = '';
      inc.classList.add('is-active'); inc.style.transform = '';
      index = to; mark(); return;
    }

    busy = true;
    // Park the incoming slide on the side it enters from, with no animation yet.
    // (Animation is switched on only after this position has been applied; otherwise
    // the slide visibly sweeps across from the wrong side.)
    inc.style.transition = 'none';
    inc.style.transform = 'translateX(' + (dir * 100) + '%)';
    void inc.offsetWidth;
    inc.style.transition = '';
    inc.classList.add('is-moving');
    out.classList.add('is-moving');
    void inc.offsetWidth;
    inc.style.transform = 'translateX(0)';
    out.style.transform = 'translateX(' + (-dir * 100) + '%)';

    var done = false;
    function finish() {
      if (done) return; done = true;
      out.classList.remove('is-active', 'is-moving'); out.style.transform = '';
      inc.classList.add('is-active'); inc.classList.remove('is-moving'); inc.style.transform = '';
      busy = false;
    }
    inc.addEventListener('transitionend', function h(e) {
      if (e.target !== inc) return;
      inc.removeEventListener('transitionend', h); finish();
    });
    setTimeout(finish, 900);
    index = to; mark();
  }

  function start() { if (!reduce && !timer) timer = setInterval(function () { go(index + 1, 1); }, AUTOPLAY_MS); }
  function stop() { clearInterval(timer); timer = null; }

  next.addEventListener('click', function () { go(index + 1, 1); });
  prev.addEventListener('click', function () { go(index - 1, -1); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') go(index + 1, 1);
    if (e.key === 'ArrowLeft') go(index - 1, -1);
  });

  // Swipe on touch screens
  var x0 = null;
  root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    start();
  });

  mark();
  start();
})();

/* ---------- Scroll route: faint dashed grid lines with orange dots running along them ---------- */
(function () {
  'use strict';
  var layer = document.getElementById('routeLayer');
  var hero = document.querySelector('.hero');
  if (!layer || !hero || !window.SVGPathElement) return;
  document.documentElement.classList.add('has-route');

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DOT_SPEED = 650;      // px per second along a grid line
  var DOT_PAUSE = 1500;     // ms before a dot starts again from the top
  var FADE = 90;            // px over which a dot grows in / shrinks out at the ends

  var state = null;

  function box(el, top) {
    var r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY - top, bottom: r.bottom + window.scrollY - top, left: r.left + window.scrollX, right: r.right + window.scrollX, h: r.height };
  }

  // Polyline -> path with rounded corners
  function rounded(pts, R) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i - 1], c = pts[i], n = pts[i + 1];
      var l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
      if (!l1 || !l2) continue;
      var r = Math.min(R, l1 / 2, l2 / 2);
      var a = [c[0] - (c[0] - p[0]) / l1 * r, c[1] - (c[1] - p[1]) / l1 * r];
      var b = [c[0] + (n[0] - c[0]) / l2 * r, c[1] + (n[1] - c[1]) / l2 * r];
      d += ' L' + a[0] + ' ' + a[1] + ' Q' + c[0] + ' ' + c[1] + ' ' + b[0] + ' ' + b[1];
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last[0] + ' ' + last[1];
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function build() {
    var P = document.querySelector('.partners'), W = document.querySelector('.why'),
        C = document.querySelector('.solutions-card'), S = document.querySelector('.services'),
        T = document.querySelector('.testimonials'),
        O = document.querySelector('.fleet-card'), N = document.querySelector('.news'), F = document.querySelector('.faq'),
        K = document.querySelector('.connect');
    if (!P || !W || !C || !S || !T) return;

    var top = hero.getBoundingClientRect().bottom + window.scrollY;
    var p = box(P, top), w = box(W, top), c = box(C, top), s = box(S, top), t = box(T, top);
    var width = document.documentElement.clientWidth;
    var o = O && box(O, top), n = N && box(N, top), f = F && box(F, top), k = K && box(K, top);
    // Lines run all the way down to the footer (fallback: the last section there is)
    var footer = document.querySelector('.site-footer');
    var last = f || k || n || o || t;
    var height = footer ? footer.getBoundingClientRect().top + window.scrollY - top : last.bottom;
    layer.style.top = top + 'px';
    layer.style.height = height + 'px';

    // Grid columns = the dividers between the stats (fallback: even split of the container)
    var stats = Array.prototype.slice.call(document.querySelectorAll('.stats li'));
    var xs = stats.slice(1).map(function (li) { return Math.round(li.getBoundingClientRect().left + window.scrollX) + 0.5; });
    var uniq = xs.filter(function (x, i) { return xs.indexOf(x) === i; });
    if (uniq.length < 4) {
      var cb = document.querySelector('.why .container').getBoundingClientRect();
      xs = [1, 2, 3, 4].map(function (i) { return Math.round(cb.left + cb.width * i / 5) + 0.5; });
    }
    var rev = [3, 2, 1, 0], id = [0, 1, 2, 3];
    var bands = [
      [0, p.top + p.h * 0.15, rev],
      [w.top + 10, w.bottom - 30, id],
      [c.top + 60, c.bottom - 60, rev],
      [s.top + 10, s.bottom - 30, id],
      [t.top + 20, t.bottom - 10, rev]
    ];
    // Continue the same alternating pattern through Our Offices, We Are In News and Connect
    [o, n, f, k].forEach(function (sec) {
      if (!sec) return;
      var prev = bands[bands.length - 1];
      bands.push([sec.top + 20, sec.bottom - 20, prev[2] === id ? rev : id]);
    });
    bands[bands.length - 1][1] = height;          // the last stretch ends right at the footer's top edge
    // Middle two lines run on the inner stat dividers and swap sides between sections (crossing in an X).
    // The outer two stay on their own side, weaving between a wide and a wider position.
    var outerL = [Math.round(width * 0.14) + 0.5, Math.round(width * 0.05) + 0.5];
    var outerR = [width - outerL[0], width - outerL[1]];
    var gridD = [0, 1, 2, 3].map(function (i) {
      var pts = [];
      bands.forEach(function (b, k) {
        var x;
        if (i === 0) x = outerL[k % 2];
        else if (i === 3) x = outerR[k % 2];
        else x = (b[2] === id ? (i === 1 ? xs[0] : xs[3]) : (i === 1 ? xs[3] : xs[0]));  // middle lines: 78%+ and 120+ dividers
        pts.push([x, b[0]], [x, b[1]]);
      });
      return rounded(pts, 90);
    });

    layer.innerHTML = '';
    var svg = el('svg', { width: width, height: height, viewBox: '0 0 ' + width + ' ' + height }, layer);
    var grids = gridD.map(function (d, i) { return el('path', { d: d, class: 'route-grid' + (i === 1 || i === 2 ? ' route-grid--mid' : '') }, svg); });
    var dots = grids.map(function () { return el('rect', { x: -2, y: -4, width: 4, height: 8, class: 'route-dot', opacity: 0 }, svg); });


    state = {
      grids: grids.map(function (g, i) { return { path: g, len: g.getTotalLength(), dot: dots[i], start: performance.now() }; })
    };
  }

  function tick(now) {
    if (state && !reduce) {
      state.grids.forEach(function (g) {
        var travel = g.len / DOT_SPEED * 1000;
        var t = (now - g.start) % (travel + DOT_PAUSE);
        if (t < 0 || t > travel) { g.dot.setAttribute('opacity', 0); return; }
        var L = t / travel * g.len;
        var p1 = g.path.getPointAtLength(L), p2 = g.path.getPointAtLength(Math.min(g.len, L + 2));
        var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI - 90;
        var k = Math.max(0, Math.min(1, L / FADE));   // grows in at the top, then runs right into the footer
        g.dot.setAttribute('transform', 'translate(' + p1.x + ' ' + p1.y + ') rotate(' + ang + ') scale(' + k + ')');
        g.dot.setAttribute('opacity', k);
      });
    }
    requestAnimationFrame(tick);
  }

  var rebuildTimer;
  function rebuild() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(build, 120); }

  window.addEventListener('resize', rebuild);
  window.addEventListener('load', build);
  if (window.ResizeObserver) new ResizeObserver(rebuild).observe(document.body);
  build();
  requestAnimationFrame(tick);
})();


/* ---------- Solutions box: orange square runs the rectangles and squeezes into the box ---------- */
(function () {
  'use strict';
  var route = document.getElementById('boxRoute');
  var runner = document.getElementById('boxRunner');
  if (!route || !runner) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Outline of the box in the same coordinates as the lines (traced from the design)
  var BOX = [[358, 78], [846, 255], [839, 430], [634, 618], [152, 407], [136, 241]];
  var SPEED = 230;   // units per second along the route
  var EDGE = 45;     // distance from the box edge over which the square squeezes and fades
  var len = route.getTotalLength(), t0 = performance.now();

  function inside(x, y) {
    var c = false;
    for (var i = 0, j = BOX.length - 1; i < BOX.length; j = i++) {
      var a = BOX[i], b = BOX[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  function edgeDist(x, y) {
    var best = Infinity;
    for (var i = 0, j = BOX.length - 1; i < BOX.length; j = i++) {
      var a = BOX[j], b = BOX[i], dx = b[0] - a[0], dy = b[1] - a[1];
      var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy));
    }
    return best;
  }

  function tick(now) {
    var L = ((now - t0) / 1000 * SPEED) % len;
    var a = route.getPointAtLength(L), b = route.getPointAtLength((L + 2) % len);
    var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI - 90;
    var k = inside(a.x, a.y) ? 0 : Math.min(1, edgeDist(a.x, a.y) / EDGE);
    // Squeeze: the square gets thinner and shorter as it slips under the box, and fades
    var sx = 0.35 + 0.65 * k, sy = 0.2 + 0.8 * k;
    runner.setAttribute('transform', 'translate(' + a.x + ' ' + a.y + ') rotate(' + ang + ') scale(' + sx + ' ' + sy + ')');
    runner.setAttribute('opacity', k);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ---------- Sticky header: switch to the white version once the page scrolls ---------- */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  if (!header) return;
  var on = null;
  function update() {
    var s = window.scrollY > 10;
    if (s !== on) { on = s; header.classList.toggle('is-scrolled', s); }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ---------- Office pins: tap to open on touch screens, keep tooltips inside the card ---------- */
(function () {
  'use strict';
  var pins = Array.prototype.slice.call(document.querySelectorAll('.office-pin'));
  if (!pins.length) return;
  function place() {
    pins.forEach(function (p) {
      var x = parseFloat(p.style.left);
      p.classList.toggle('tip-right', x < 18);
      p.classList.toggle('tip-left', x > 82);
    });
  }
  pins.forEach(function (p) {
    p.querySelector('.office-pin-btn').addEventListener('click', function () {
      var open = !p.classList.contains('is-open');
      pins.forEach(function (o) { o.classList.remove('is-open'); });
      p.classList.toggle('is-open', open);
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.office-pin')) pins.forEach(function (o) { o.classList.remove('is-open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') pins.forEach(function (o) { o.classList.remove('is-open'); });
  });
  place();

  // Map spotlight: a soft circle follows the cursor (eased) and lights up the dots under it
  var map = document.querySelector('.offices-map');
  if (map && window.matchMedia('(hover: hover)').matches) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var draw = function () {
      cx += (tx - cx) * (still ? 1 : 0.2);
      cy += (ty - cy) * (still ? 1 : 0.2);
      map.style.setProperty('--spot-x', cx.toFixed(1) + 'px');
      map.style.setProperty('--spot-y', cy.toFixed(1) + 'px');
      raf = (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) ? requestAnimationFrame(draw) : 0;
    };
    map.addEventListener('pointermove', function (e) {
      var r = map.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!map.classList.contains('is-lit')) { cx = tx; cy = ty; map.classList.add('is-lit'); }
      if (!raf) raf = requestAnimationFrame(draw);
    });
    map.addEventListener('pointerleave', function () { map.classList.remove('is-lit'); });
  }
})();


/* ---------- FAQs: open one answer at a time ---------- */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-q button');
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      items.forEach(function (o) {
        o.classList.remove('is-open');
        o.querySelector('.faq-q button').setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();

/* ---------- Footer: hide the header while the footer is on screen; newsletter check ---------- */
(function () {
  'use strict';
  var footer = document.querySelector('.site-footer');
  var header = document.querySelector('.site-header');
  if (footer && header && 'IntersectionObserver' in window) {
    // Keep the header at the very top, so short pages whose footer is already on screen still show it
    var footerOn = false;
    var update = function () { header.classList.toggle('is-hidden', footerOn && window.scrollY > 0); };
    new IntersectionObserver(function (entries) {
      footerOn = entries[0].isIntersecting;
      update();
    }, { rootMargin: '0px 0px -35% 0px' }).observe(footer);
    window.addEventListener('scroll', update, { passive: true });
  }
  // Reveal: the contents sit shifted up under the section above and catch up with the page as the footer scrolls in
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (footer && !reduceMotion.matches) {
    var ticking = false, last = '';
    var reveal = function () {
      ticking = false;
      var vh = window.innerHeight, rect = footer.getBoundingClientRect();
      var shift = Math.min(vh < 700 ? 140 : 260, rect.height * 0.35); // how far up the contents start
      var p = Math.max(0, Math.min(1, (vh - rect.top) / Math.min(vh, rect.height)));
      var value = (-(1 - p) * shift).toFixed(1) + 'px';
      if (value !== last) { last = value; footer.style.setProperty('--footer-shift', value); }
    };
    var queue = function () { if (!ticking) { ticking = true; requestAnimationFrame(reveal); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    reveal();
  }

  var form = document.getElementById('footerNews');
  if (form) {
    var input = document.getElementById('footerEmail'), msg = document.getElementById('footerNewsMsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      msg.classList.toggle('is-ok', ok);
      // TODO: connect to the newsletter service
      msg.textContent = ok ? 'Thanks! You\'re on the list (not connected yet).' : 'Enter a valid email address.';
    });
  }
})();

/* ---------- About page: show the first 8 team members, "Load more" reveals the rest ---------- */
(function () {
  'use strict';
  var grid = document.getElementById('teamGrid');
  var more = document.getElementById('teamMore');
  if (!grid || !more) return;
  var SHOW = 8;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.team-card'));
  if (cards.length <= SHOW) return;
  cards.slice(SHOW).forEach(function (c) { c.hidden = true; });
  more.hidden = false;
  more.addEventListener('click', function () {
    cards.forEach(function (c) { c.hidden = false; });
    more.hidden = true;
    var first = cards[SHOW].querySelector('a');
    if (first) first.focus({ preventScroll: true });
  });
})();

/* ---------- About page: journey. The section pins to the screen and scrolling drives the truck along
   the line; the road and each drawing are drawn just ahead of it, and the chapter copy follows ---------- */
(function () {
  'use strict';
  var section = document.getElementById('journey');
  if (!section) return;
  var stage = section.querySelector('.journey-stage');
  var svg = section.querySelector('.journey-svg');
  var world = section.querySelector('.jr-world');
  var ground = section.querySelector('.jr-ground');
  var truck = section.querySelector('.jr-truck');
  var wheels = Array.prototype.slice.call(section.querySelectorAll('.jr-wheel'));
  var roadBands = Array.prototype.slice.call(section.querySelectorAll('.jr-road-band'));
  // Clouds: copies of clouds.svg scattered at random. Each gets its own slot across the screen (so they never
  // bunch up), a random height in the sky band, and a random size; smaller ones read as further away, so they
  // are fainter and drift more slowly
  var sky = section.querySelector('.jr-sky');
  var CLOUD_COUNT = 9, SKY_TOP = 420, SKY_BOTTOM = 560;    // sky band in world units (ground = 700)
  var clouds = [];
  for (var ci = 0; ci < CLOUD_COUNT; ci++) {
    var depth = Math.random();                              // 0 = far away, 1 = close
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    el.setAttribute('href', 'assets/images/journey/clouds.svg');
    el.setAttribute('width', 223); el.setAttribute('height', 27);
    el.setAttribute('opacity', (0.2 + depth * 0.55 + Math.random() * 0.15).toFixed(2));
    sky.appendChild(el);
    clouds.push({ el: el, x: (ci + Math.random() * 0.8) / CLOUD_COUNT, y: SKY_TOP + Math.random() * (SKY_BOTTOM - SKY_TOP),
                  k: 0.15 + depth * 0.35, size: 0.6 + depth * 0.7 });
  }
  var chapters = Array.prototype.slice.call(section.querySelectorAll('.jr-chapter'));
  var num = document.getElementById('jrNum'), bar = document.getElementById('jrBar');
  var hint = section.querySelector('.jr-hint');
  var header = document.querySelector('.site-header');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Truck art is thin-truck.svg (156 x 72) drawn at 1.9x (keep in step with about.html); its wheels have a radius of about 8.8 there
  var GROUND = 700, TRUCK_SCALE = 1.9, TRUCK_LEN = 156 * TRUCK_SCALE, WHEEL_R = 8.78 * TRUCK_SCALE;
  var FADE_OVER = 0.6;                           // share of a drive over which the drawing left behind fades out
  var HOLD = 0.45;                               // scroll spent resting at each drawing, relative to one drive between drawings
  var CLOUD_W = 223, CLOUD_SCALE = 1.55, BREEZE = 8;  // cloud art width and base scale, and how fast clouds drift on their own (px/s)
  // Background colour for each chapter; it finishes changing as that chapter's drawing arrives in place
  // Garage: brand sea teal · Warehouse: deep pine · City: dusk plum · Port: ocean blue · Today: warm espresso (echoes the orange flag)
  var COLORS = ['#0b3a44', '#1f3d36', '#36294a', '#12385a', '#3b2a22'];

  // Each drawing: its paths, where it starts in the world, and a lookup of how far along each path
  // the drawing has to be to reach a given x (so lines draw left to right as the pen passes)
  var arts = Array.prototype.slice.call(section.querySelectorAll('.jr-art')).map(function (g) {
    var x0 = parseFloat(g.getAttribute('data-x')) || 0;
    g.setAttribute('transform', 'translate(' + x0 + ' 0)');
    var paths = Array.prototype.slice.call(g.querySelectorAll('path')).map(function (p) {
      var len = p.getTotalLength(), steps = 120, table = [], maxX = -Infinity;
      for (var i = 0; i <= steps; i++) {
        var l = len * i / steps;
        maxX = Math.max(maxX, p.getPointAtLength(l).x + x0);
        table.push([maxX, l]);
      }
      return { el: p, len: len, table: table };
    });
    var right = Math.max.apply(null, paths.map(function (p) { return p.table[p.table.length - 1][0]; }));
    return { el: g, x0: x0, right: right, paths: paths };
  });
  var END = arts.length ? arts[arts.length - 1].right + 160 : 2000;

  function drawnLength(path, x) {
    var t = path.table;
    if (x <= t[0][0]) return 0;
    for (var i = 1; i < t.length; i++) {
      if (t[i][0] >= x) {
        var a = t[i - 1], b = t[i], k = (x - a[0]) / ((b[0] - a[0]) || 1);
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return path.len;
  }

  function mix(c1, c2, k) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - k) + ((b >> 16) & 255) * k);
    var g = Math.round(((a >> 8) & 255) * (1 - k) + ((b >> 8) & 255) * k);
    var bl = Math.round((a & 255) * (1 - k) + (b & 255) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  var L = {}, active = -1, ticking = false, pinned = null, camX = 0, breeze = 0, inView = false, lastT = 0;

  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight, narrow = w < 861;
    L.w = w; L.h = h;
    L.s = Math.min(h / 900, w / (narrow ? 700 : 1000));          // world units -> px
    // Rear of the truck on screen: lined up with the left edge of the chapter label / title, nudged a little to the right
    var copyLeft = chapters[0].getBoundingClientRect().left - stage.getBoundingClientRect().left;
    L.truckScreen = copyLeft + (narrow ? 12 : 32);
    L.tipScreen = w + 40;                                          // drawing happens just off the right edge, so art slides in whole
    L.lead = (L.tipScreen - L.truckScreen) / L.s;                  // pen distance ahead of the truck
    L.ty = h * (narrow ? 0.8 : 0.78) - GROUND * L.s;               // ground line sits ~78% down
    // The road is always there, edge to edge: it runs well past both screen edges at every point of the journey
    L.startX = -2 * L.w / L.s - 2000;
    // Stops: where the truck is when each drawing rests with its right edge on the right edge of the copy grid
    // (the description column). On narrow screens a drawing may not fit there, so the truck stops short of it instead
    var gridRight = chapters[0].getBoundingClientRect().right - stage.getBoundingClientRect().left;
    L.stops = arts.map(function (a) { return Math.min(a.right - (gridRight - L.truckScreen) / L.s, a.x0 - TRUCK_LEN - 40); });
    var gl = END + 2 * L.w / L.s + 2000;
    ground.setAttribute('d', 'M' + L.startX + ' ' + GROUND + ' H' + gl);
    L.groundLen = gl - L.startX;
    arts.forEach(function (a) {
      a.paths.forEach(function (q) { var d = q.len * L.s + 1; q.el.style.strokeDasharray = d + ' ' + d; });
    });
    roadBands.forEach(function (b) { b.setAttribute('x', L.startX); b.setAttribute('width', L.groundLen); });
    update();
  }

  function update() {
    ticking = false;
    var r = section.getBoundingClientRect();
    var span = section.offsetHeight - L.h;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;

    // Scroll runs: rest at drawing 1, drive, rest at drawing 2, drive, ... rest at the last drawing.
    // seg = the drawing we are at or leaving, t = 0..1 through the drive to the next one (0 while resting)
    var n = L.stops.length, u = p * (n * HOLD + n - 1), seg = 0, t = 0;
    for (; seg < n; seg++) {
      if (u < HOLD || seg === n - 1) break;
      u -= HOLD;
      if (u < 1) { t = u; break; }
      u -= 1;
    }
    var ease = t * t * (3 - 2 * t);              // ease in and out, so each drawing settles into place
    var tx = seg < n - 1 ? L.stops[seg] + (L.stops[seg + 1] - L.stops[seg]) * ease : L.stops[n - 1];   // truck rear, world x
    var penX = tx + L.lead;                      // pen tip, world x (just off the right edge)
    camX = L.truckScreen - tx * L.s;
    world.setAttribute('transform', 'translate(' + camX + ' ' + L.ty + ') scale(' + L.s + ')');


    arts.forEach(function (a, i) {
      // Once the truck drives on, the drawing it leaves behind fades out over the first part of the drive
      // (and fades back in when scrolling back); the last drawing never leaves
      var gone = i < n - 1 ? (tx - L.stops[i]) / ((L.stops[i + 1] - L.stops[i]) * FADE_OVER) : 0;
      a.el.style.opacity = Math.min(1, Math.max(0, 1 - gone)).toFixed(3);
      // Strokes are non-scaling, so dashes are measured in screen pixels: scale path lengths by L.s to match
      if (penX < a.x0 - 20 && !reduce) { a.paths.forEach(function (q) { q.el.style.strokeDashoffset = q.len * L.s + 1; }); return; }
      a.paths.forEach(function (q) { q.el.style.strokeDashoffset = (q.len - (reduce && penX >= a.x0 ? q.len : drawnLength(q, penX))) * L.s; });
    });

    // The truck keeps its place on screen (the camera follows it); the wheels turn by the distance covered
    truck.setAttribute('transform', 'translate(' + tx + ' ' + GROUND + ')');
    var spin = ((tx / WHEEL_R) * 180 / Math.PI) % 360;
    wheels.forEach(function (wh) {
      wh.setAttribute('transform', 'rotate(' + spin.toFixed(1) + ' ' + wh.getAttribute('data-cx') + ' ' + wh.getAttribute('data-cy') + ')');
    });
    placeClouds();

    // Colour: hold this chapter's colour, then blend over the end of the drive so the next colour lands as its
    // drawing arrives. The chapter copy switches halfway through that blend
    var next = Math.min(seg + 1, n - 1);
    var k = t < 0.6 ? 0 : (t - 0.6) / 0.4;
    var c = k >= 0.5 ? next : seg;
    if (c !== active) {
      active = c;
      chapters.forEach(function (el, j) { el.classList.toggle('is-active', j === c); });
      num.textContent = (c < 9 ? '0' : '') + (c + 1);
    }
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    hint.style.opacity = p > 0.96 ? 0 : 1;

    var bg = mix(COLORS[seg % COLORS.length], COLORS[next % COLORS.length], k);
    section.style.backgroundColor = bg;
    section.style.setProperty('--jr-bg', bg);

    // Hide the site header while the journey fills the screen
    var isPinned = r.top <= 1 && r.bottom >= L.h - 1;
    if (header && isPinned !== pinned) { pinned = isPinned; header.classList.toggle('is-journey', isPinned); }
  }

  // Clouds: slower than the road for depth, plus a gentle breeze; each wraps around once it leaves the left edge
  function placeClouds() {
    clouds.forEach(function (c) {
      var size = c.size * L.s * CLOUD_SCALE, cw = CLOUD_W * size, span = L.w + cw * 2;
      var x = (c.x * span + camX * c.k - breeze * c.k * 3) % span;
      if (x < 0) x += span;
      c.el.setAttribute('transform', 'translate(' + (x - cw).toFixed(1) + ' ' + (L.ty + c.y * L.s).toFixed(1) + ') scale(' + size.toFixed(3) + ')');
    });
  }

  // Breeze only runs while the section is on screen
  function drift(t) {
    if (!inView) { lastT = 0; return; }
    if (lastT) breeze += Math.min(0.1, (t - lastT) / 1000) * BREEZE;
    lastT = t;
    placeClouds();
    window.requestAnimationFrame(drift);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var was = inView;
      inView = entries[0].isIntersecting;
      if (inView && !was) window.requestAnimationFrame(drift);
    }).observe(section);
  }

  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { window.requestAnimationFrame(layout); });
  layout();
})();

/* ---------- Support page: contact form validation ---------- */
(function () {
  'use strict';
  var form = document.getElementById('supportForm');
  if (!form) return;
  var msg = document.getElementById('supportMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    form.querySelectorAll('[required]').forEach(function (el) {
      var v = el.value.trim();
      var ok = el.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : v !== '';
      el.classList.toggle('has-error', !ok);
      if (!ok) bad.push(el);
    });
    msg.classList.toggle('is-ok', !bad.length);
    if (bad.length) {
      msg.textContent = 'Please fill in your first name, a valid email and a message.';
      bad[0].focus();
      return;
    }
    // TODO: connect to the support inbox / ticketing service
    msg.textContent = 'Thanks! Your message is ready to send (not connected yet).';
    form.reset();
  });
  form.addEventListener('input', function (e) { e.target.classList.remove('has-error'); });
})();

/* ---------- Network globe: top of a slowly rotating globe, hub pins with cards, drifting clouds ---------- */
(function () {
  'use strict';
  var stage = document.getElementById('globe');
  if (!stage) return;
  var canvas = stage.querySelector('.globe-canvas');
  var ctx = canvas.getContext('2d');
  var RAD = Math.PI / 180;
  var TILT = -15 * RAD;   // seen from slightly below the equator, so the parallels arch over the top
  var SPEED = 5;          // degrees per second; the surface moves left to right
  var LON0 = 72 * RAD;    // start with India facing the viewer
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hubs = Array.prototype.map.call(stage.querySelectorAll('.globe-hub'), function (el) {
    return { el: el, lat: +el.dataset.lat * RAD, lon: +el.dataset.lon * RAD };
  });
  var clouds = Array.prototype.map.call(stage.querySelectorAll('.globe-clouds img'), function (el) {
    return { el: el, d: +el.dataset.d, x: +el.dataset.x, base: +el.dataset.w, w: 0, speed: +el.dataset.speed };
  });

  var W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var top = W < 700 ? 56 : 80;
    R = Math.min(W * (W < 700 ? .54 : .32), (H - top) / .85);
    cx = W / 2; cy = top + R;
    stage.style.setProperty('--globe-r', R + 'px');
    stage.style.setProperty('--globe-top', top + 'px');
    // Clouds shrink on narrow screens; card sizes are cached for the overlap check
    var scale = Math.max(.5, Math.min(1, W / 1280));
    clouds.forEach(function (c) { c.w = c.base * scale; c.el.style.width = c.w + 'px'; });
    hubs.forEach(function (h) { h.w = h.el.offsetWidth; h.h = h.el.offsetHeight; });
  }

  // Orthographic projection centred on (TILT, lon0): x right, y up, z towards the viewer
  var sinT = Math.sin(TILT), cosT = Math.cos(TILT);
  function project(lat, lon, lon0) {
    var cl = Math.cos(lat), d = lon - lon0;
    return {
      x: cx + R * cl * Math.sin(d),
      y: cy - R * (cosT * Math.sin(lat) - sinT * cl * Math.cos(d)),
      z: sinT * Math.sin(lat) + cosT * cl * Math.cos(d)
    };
  }

  // Trace a polyline, lifting the pen wherever it passes behind the globe
  function line(points) {
    var pen = false;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.z > 0) { if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; }
      else pen = false;
    }
  }

  function draw(lon0, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Disc, lit from the upper left
    var g = ctx.createRadialGradient(cx - R * .35, cy - R * .45, R * .1, cx - R * .1, cy - R * .1, R * 1.15);
    g.addColorStop(0, '#fbf9f7'); g.addColorStop(.55, '#f5f1ee'); g.addColorStop(.85, '#ebe5e0'); g.addColorStop(1, '#e0d8d2');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();

    // Graticule every 20 degrees
    ctx.beginPath();
    var lat, lon, pts;
    for (lon = -180; lon < 180; lon += 20) {
      pts = [];
      for (lat = -90; lat <= 90; lat += 3) pts.push(project(lat * RAD, lon * RAD, lon0));
      line(pts);
    }
    for (lat = -80; lat <= 80; lat += 20) {
      pts = [];
      for (lon = -180; lon <= 180; lon += 3) pts.push(project(lat * RAD, lon * RAD, lon0));
      line(pts);
    }
    ctx.strokeStyle = 'rgba(39, 39, 39, .42)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(39, 39, 39, .7)'; ctx.lineWidth = 1.25; ctx.stroke();

    // Pins with a soft pulsing halo; cards fade in as their pin turns towards the viewer.
    // Front-most hubs claim their card space first; a card that would overlap one of them waits its turn.
    var pulse = (Math.sin(t / 600) + 1) / 2;
    var shown = [];
    hubs.map(function (h) { return { h: h, p: project(h.lat, h.lon, lon0) }; })
      .sort(function (m, n) { return n.p.z - m.p.z; })
      .forEach(function (m) {
      var h = m.h, p = m.p;
      var a = Math.max(0, Math.min(1, (p.z - .15) / .25));
      if (p.y > H - 48) a = 0;   // pin has sunk into the bottom fade
      var box = { x: p.x - h.w / 2 - 6, y: p.y - 16 - h.h - 6, w: h.w + 12, h: h.h + 12 };
      var card = a > 0 && !shown.some(function (b) { return box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h; });
      if (card) shown.push(box);
      if (a > 0) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 10 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(253, 82, 2, ' + (.16 * a) + ')'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(253, 82, 2, ' + a + ')'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, ' + a + ')'; ctx.stroke();
      }
      h.el.style.opacity = card ? a : 0;
      h.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%, calc(-100% - 16px))';
    });

    // Clouds drift right along a lane across the globe, poking just past the rim at each end,
    // and fade at the ends of the lane so they never pop in or out
    clouds.forEach(function (c) {
      var y = cy - R + c.d * R;
      var half = R * Math.sqrt(1 - (1 - c.d) * (1 - c.d)) + c.w * .3;
      var len = half * 2;
      var pos = ((c.x * len + c.speed * t / 1000) % len + len) % len;
      var edge = Math.min(pos, len - pos);
      c.el.style.opacity = Math.min(1, edge / (c.w * .8)).toFixed(3);
      c.el.style.transform = 'translate(' + (cx - half + pos).toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%, -50%)';
    });
  }

  // Animation clock that only advances while the globe is on screen
  var elapsed = 0, last = 0, running = false, raf = 0;
  function render() { draw(LON0 - SPEED * RAD * elapsed / 1000, elapsed); }
  function frame(now) {
    elapsed += Math.min(now - last, 100);
    last = now;
    render();
    if (running) raf = requestAnimationFrame(frame);
  }
  function play() { if (running || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function pause() { running = false; cancelAnimationFrame(raf); }

  resize();
  render();
  if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); render(); }).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) play(); else pause(); }).observe(stage);
  } else play();
})();

/* ---------- Solutions rail: pinned section; heading squashes away, then cards slide right to left ---------- */
(function () {
  'use strict';
  var rail = document.querySelector('.sol-rail');
  if (!rail) return;
  var pin = rail.querySelector('.sol-rail-pin');
  var head = rail.querySelector('.sol-rail-head');
  var viewport = rail.querySelector('.sol-rail-viewport');
  var track = rail.querySelector('.sol-rail-track');
  if (!pin || !head || !viewport || !track) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var headH = 0, squash = 0, travel = 0, top = 0, padTop = 0, ticking = false;

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  function reset() {
    rail.classList.remove('is-pinned');
    rail.style.height = '';
    rail.style.marginBottom = '';
    pin.style.height = '';
    track.style.transform = '';
  }

  // Measure everything with the heading at full size, then fix the pin's height so it stays put while the heading shrinks.
  // The section gets taller by the squash distance plus the row's sideways travel, which is how long it stays pinned
  function measure() {
    reset();
    if (reduce.matches) return;
    var cs = getComputedStyle(rail);
    top = parseFloat(cs.getPropertyValue('--sol-top')) || 0;
    padTop = parseFloat(cs.paddingTop) || 0;
    headH = head.offsetHeight;
    squash = Math.max(headH * 1.4, 240);
    travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
    var pinH = pin.offsetHeight;
    pin.style.height = pinH + 'px';
    rail.style.height = (padTop + pinH + squash + travel + (parseFloat(cs.paddingBottom) || 0)) + 'px';
    // Once the heading has squashed away, the bottom of the pin (below the cards) is empty: pull the next section
    // up over it so the gap after the cards is just the section's bottom padding
    rail.style.marginBottom = -Math.max(0, pinH - viewport.offsetHeight) + 'px';
    rail.classList.add('is-pinned');
    update();
  }

  function update() {
    ticking = false;
    if (reduce.matches) return;
    // How far the page has scrolled since the pin stuck under the header
    var d = top - rail.getBoundingClientRect().top - padTop;
    var e = ease(clamp(d / squash));
    rail.style.setProperty('--sol-head', (headH * (1 - e)).toFixed(1) + 'px');
    rail.style.setProperty('--sol-head-scale', (1 - .55 * e).toFixed(3));
    rail.style.setProperty('--sol-head-fade', clamp(1 - e * 1.25).toFixed(3));
    var x = Math.min(Math.max(d - squash, 0), travel);
    track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px, 0, 0)';
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  var resizeTimer;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 150); });
  if (reduce.addEventListener) reduce.addEventListener('change', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();
})();

/* ---------- How it works: orange marker runs down the dashed line, lighting each step in turn, then starts over ---------- */
(function () {
  'use strict';
  var list = document.getElementById('hiwSteps');
  if (!list || !window.SVGElement) return;
  var steps = [].slice.call(list.querySelectorAll('.hiw-step'));
  var nums = steps.map(function (s) { return s.querySelector('.hiw-num'); });
  if (steps.length < 2 || nums.indexOf(null) !== -1) return;

  var NS = 'http://www.w3.org/2000/svg';
  var HOLD = 2000;     // ms a step stays lit before the marker leaves it
  var TRAVEL = 1200;   // ms for the marker to run to the next step
  var GAP = 6;         // px between a circle edge and where the marker starts / stops

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'hiw-line');
  svg.setAttribute('aria-hidden', 'true');
  var track = document.createElementNS(NS, 'line');
  track.setAttribute('class', 'hiw-line-track');
  var dot = document.createElementNS(NS, 'rect');
  dot.setAttribute('class', 'hiw-line-dot');
  dot.setAttribute('width', 4); dot.setAttribute('height', 8);
  dot.setAttribute('opacity', 0);
  svg.appendChild(track); svg.appendChild(dot);
  list.insertBefore(svg, list.firstChild);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var centres = [], x = 0, r = 0;
  var active = 0, phase = 'hold', phaseStart = 0, raf = 0, visible = false;

  // Circle centres relative to the list; the dashed line runs from the first to the last
  function measure() {
    var box = list.getBoundingClientRect();
    centres = nums.map(function (n) {
      var b = n.getBoundingClientRect();
      x = b.left + b.width / 2 - box.left;
      r = b.height / 2;
      return b.top + b.height / 2 - box.top;
    });
    track.setAttribute('x1', x); track.setAttribute('x2', x);
    track.setAttribute('y1', centres[0]); track.setAttribute('y2', centres[centres.length - 1]);
    dot.setAttribute('x', x - 2);
  }

  function setActive(i) {
    active = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
  }

  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  function frame(now) {
    raf = 0;
    if (!phaseStart) phaseStart = now;
    var t = now - phaseStart;
    if (phase === 'hold') {
      dot.setAttribute('opacity', 0);
      if (t >= HOLD) {
        if (active < steps.length - 1) phase = 'travel';
        else setActive(0);   // after the last step, start again from 1
        phaseStart = now;
      }
    } else {
      var k = Math.min(t / TRAVEL, 1);
      var y0 = centres[active] + r + GAP, y1 = centres[active + 1] - r - GAP - 8;
      dot.setAttribute('y', y0 + (y1 - y0) * ease(k));
      dot.setAttribute('opacity', Math.min(1, k / .12, (1 - k) / .12).toFixed(3));
      if (k >= 1) { setActive(active + 1); phase = 'hold'; phaseStart = now; }
    }
    if (visible && !reduce.matches) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reduce.matches || !visible) return;
    phaseStart = 0;   // resume the current phase from its beginning
    raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  // Only run while the section is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: .2 }).observe(list);
  } else { visible = true; }

  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 150); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) stop(); else start(); });
  measure();
  start();
})();
