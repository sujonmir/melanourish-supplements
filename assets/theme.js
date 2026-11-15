/* MelaNourish mockup scripts → assets/theme.js
   Each block is a self-contained module that maps to a theme JS component.
   In the real theme the cart module talks to Shopify's AJAX API (/cart/add.js,
   /cart/change.js) and re-renders the drawer with the Section Rendering API. */
(function () {
  'use strict';

  function money(n) { return '$' + n.toFixed(2); }

  /* ------------------------------------------------------------
     header: mobile drawer menu (left sidebar)
     ------------------------------------------------------------ */
  var toggle = document.querySelector('[data-menu-toggle]');
  var nav = document.getElementById('main-nav');
  var navClose = document.querySelector('[data-menu-close]');
  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && navClose) navClose.focus();
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); if (!nav.classList.contains('is-open')) toggle.focus(); });
    if (navClose) navClose.addEventListener('click', function () { setNav(false); toggle.focus(); });
    var navOverlay = document.querySelector('[data-nav-overlay]');
    if (navOverlay) navOverlay.addEventListener('click', function () { setNav(false); toggle.focus(); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    nav.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setNav(false); toggle.focus(); } });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (m) {
      if (m.matches) { nav.classList.remove('is-open'); document.body.classList.remove('nav-open'); }
    });
  }

  /* ------------------------------------------------------------
     cart drawer (right sidebar)
     ------------------------------------------------------------ */
  var FREE_SHIPPING = 50;
  var SUB_DISCOUNT = 0.15;
  var CATALOG = {
    'daily-glow': { title: "Daily Glow Women's Multivitamin", price: 32, bottle: '#5B2A3C', bg: '#F3DCE3' },
    'd3-k2': { title: 'Sunshine Vitamin D3 + K2', price: 24, bottle: '#E59A2F', bg: '#FCE7C4' }
  };

  var drawer = document.querySelector('[data-cart-drawer]');
  var itemsEl = document.querySelector('[data-cart-items]');
  var countEls = document.querySelectorAll('[data-cart-count]');
  var drawerCount = document.querySelector('[data-cart-drawer-count]');
  var openBtn = document.querySelector('[data-cart-open]');
  var upsell = document.querySelector('[data-cart-upsell]');

  // Demo cart starts with one subscription item so the drawer shows its full layout.
  // Kept in sessionStorage so it carries between the two mockup pages.
  var cart = null;
  try { cart = JSON.parse(sessionStorage.getItem('mn-cart')); } catch (e) { cart = null; }
  if (!Array.isArray(cart)) cart = [{ id: 'daily-glow', sub: true, plan: 30, qty: 1 }];
  function persist() { try { sessionStorage.setItem('mn-cart', JSON.stringify(cart)); } catch (e) {} }

  function unitPrice(line) { var p = CATALOG[line.id].price; return line.sub ? p * (1 - SUB_DISCOUNT) : p; }

  function itemHTML(line, i) {
    var p = CATALOG[line.id];
    var meta = line.sub
      ? '<svg aria-hidden="true"><use href="#i-refresh"/></svg>Every ' + line.plan + ' days · 15% off'
      : 'One-time purchase';
    var compare = line.sub ? '<s>' + money(p.price * line.qty) + '</s>' : '';
    return '<li class="cart-item">' +
      '<span class="bottle-art" style="--art-bg:' + p.bg + '" aria-hidden="true"><span class="bottle" style="--bottle:' + p.bottle + '"></span></span>' +
      '<div><p class="cart-item__title">' + p.title + '</p><p class="cart-item__meta">' + meta + '</p>' +
        '<div class="mini-qty"><button type="button" aria-label="Decrease quantity" data-line-minus="' + i + '">−</button>' +
        '<span>' + line.qty + '</span>' +
        '<button type="button" aria-label="Increase quantity" data-line-plus="' + i + '">+</button></div></div>' +
      '<div class="cart-item__price"><span>' + compare + money(unitPrice(line) * line.qty) + '</span>' +
        '<button class="cart-item__remove" type="button" data-line-remove="' + i + '">Remove</button></div>' +
      '</li>';
  }

  function renderCart(bump) {
    if (!drawer) return;
    var count = 0, total = 0, full = 0;
    cart.forEach(function (l) { count += l.qty; total += unitPrice(l) * l.qty; full += CATALOG[l.id].price * l.qty; });
    itemsEl.innerHTML = cart.map(itemHTML).join('');
    drawer.classList.toggle('is-empty', cart.length === 0);
    countEls.forEach(function (c) {
      c.textContent = count;
      if (bump) { c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump'); }
    });
    if (openBtn) openBtn.setAttribute('aria-label', 'Open cart, ' + count + ' items');
    drawerCount.textContent = count;

    var saved = full - total;
    document.querySelector('[data-cart-subtotal]').textContent = money(full);
    document.querySelector('[data-cart-save]').textContent = '−' + money(saved);
    document.querySelector('[data-cart-save-row]').hidden = saved <= 0;
    document.querySelector('[data-cart-total]').textContent = money(total);

    var left = FREE_SHIPPING - total;
    document.querySelector('[data-ship-text]').innerHTML = left > 0
      ? 'You’re <strong>' + money(left) + '</strong> away from free shipping'
      : '<strong>You’ve unlocked free shipping!</strong>';
    document.querySelector('[data-ship-fill]').style.width = Math.min(100, total / FREE_SHIPPING * 100) + '%';
    document.querySelector('[data-cart-ship]').textContent = left > 0 ? 'Calculated at checkout' : 'Free';

    upsell.hidden = cart.some(function (l) { return l.id === 'd3-k2'; });
  }

  var lastFocus = null;
  function setCart(open) {
    if (!drawer) return;
    if (open) { lastFocus = document.activeElement; if (nav && nav.classList.contains('is-open')) setNav(false); }
    drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('cart-open', open);
    if (open) drawer.querySelector('[data-cart-close]').focus();
    else if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function addLine(id, sub, plan, qty) {
    var found = cart.filter(function (l) { return l.id === id && l.sub === sub && (!sub || l.plan === plan); })[0];
    if (found) found.qty = Math.min(9, found.qty + qty);
    else cart.push({ id: id, sub: sub, plan: plan, qty: qty });
    persist(); renderCart(true);
  }

  if (drawer) {
    if (openBtn) openBtn.addEventListener('click', function (e) { e.preventDefault(); setCart(true); });
    drawer.querySelectorAll('[data-cart-close]').forEach(function (b) { b.addEventListener('click', function () { setCart(false); }); });
    document.querySelector('[data-cart-overlay]').addEventListener('click', function () { setCart(false); });
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') setCart(false); });

    itemsEl.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var i;
      if (b.hasAttribute('data-line-plus')) { i = +b.getAttribute('data-line-plus'); cart[i].qty = Math.min(9, cart[i].qty + 1); }
      else if (b.hasAttribute('data-line-minus')) { i = +b.getAttribute('data-line-minus'); cart[i].qty -= 1; if (cart[i].qty < 1) cart.splice(i, 1); }
      else if (b.hasAttribute('data-line-remove')) { cart.splice(+b.getAttribute('data-line-remove'), 1); }
      else return;
      persist(); renderCart(true);
      drawer.querySelector('[data-cart-close]').focus();
    });

    document.querySelector('[data-upsell-add]').addEventListener('click', function () { addLine('d3-k2', false, 0, 1); });
    document.querySelector('[data-checkout]').addEventListener('click', function () {
      document.querySelector('[data-checkout-msg]').textContent = 'Mockup only: this goes to Shopify checkout in the live store.';
    });
    renderCart(false);
  }

  /* ------------------------------------------------------------
     search overlay (full screen, predictive)
     ------------------------------------------------------------ */
  var PRODUCTS = [
    { t: "Daily Glow Women's Multivitamin", type: 'Multivitamin', k: 'multi energy vitamin d iron b12 daily', p: 32, b: '#5B2A3C', bg: '#F3DCE3' },
    { t: 'Sunshine Vitamin D3 + K2', type: 'Vitamin D', k: 'vitamin d d3 k2 bones immunity mood sun', p: 24, b: '#E59A2F', bg: '#FCE7C4' },
    { t: 'Iron Strong + Vitamin C', type: 'Iron', k: 'iron energy fatigue tired vitamin c anemia', p: 22, b: '#6F8A6A', bg: '#DDE7DA' },
    { t: 'Crown Hair, Skin & Nails', type: 'Beauty', k: 'hair skin nails biotin beauty growth collagen', p: 28, b: '#B65A6E', bg: '#F3DCE3' },
    { t: 'Calm Magnesium Glycinate', type: 'Sleep & stress', k: 'magnesium sleep stress calm cramps relax', p: 26, b: '#3E5B6E', bg: '#DDE7DA' },
    { t: 'Balance Ashwagandha', type: 'Stress', k: 'ashwagandha stress hormones balance mood adaptogen', p: 25, b: '#8A5A2B', bg: '#FCE7C4' },
    { t: 'Gut Ease Probiotic', type: 'Gut health', k: 'probiotic gut bloating digestion', p: 34, b: '#5B2A3C', bg: '#F3DCE3' },
    { t: 'Omega-3 Fish Oil', type: 'Omega-3', k: 'omega fish oil heart brain skin', p: 30, b: '#C9852A', bg: '#DDE7DA' }
  ];
  var search = document.querySelector('[data-search]');
  var sOpen = document.querySelector('[data-search-open]');
  var sInput = document.querySelector('[data-search-input]');

  function esc(str) { return str.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(title, q) {
    var safe = esc(title);
    if (!q) return safe;
    var i = title.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return safe;
    return esc(title.slice(0, i)) + '<mark>' + esc(title.slice(i, i + q.length)) + '</mark>' + esc(title.slice(i + q.length));
  }
  function resultHTML(pr, q) {
    return '<li><a class="search-result" href="product.html">' +
      '<span class="bottle-art" style="--art-bg:' + pr.bg + '" aria-hidden="true"><span class="bottle" style="--bottle:' + pr.b + '"></span></span>' +
      '<span><span class="search-result__type">' + pr.type + '</span>' +
      '<span class="search-result__title">' + highlight(pr.t, q) + '</span>' +
      '<span class="search-result__price">' + money(pr.p) + ' <small>· ' + money(pr.p * (1 - SUB_DISCOUNT)) + ' subscribed</small></span></span>' +
      '</a></li>';
  }
  function runSearch() {
    var q = sInput.value.trim();
    var list = q
      ? PRODUCTS.filter(function (pr) {
          var words = (pr.t + ' ' + pr.type + ' ' + pr.k).toLowerCase().split(/[^a-z0-9]+/);
          return q.toLowerCase().split(/\s+/).every(function (w) { return words.some(function (x) { return x.indexOf(w) === 0; }); });
        })
      : PRODUCTS.slice(0, 4);
    search.querySelectorAll('[data-search-default]').forEach(function (el) { el.hidden = !!q; });
    search.querySelector('[data-search-clear]').hidden = !q;
    search.querySelector('[data-search-heading]').textContent = q ? 'Products' : 'Trending now';
    var count = search.querySelector('[data-search-count]');
    count.hidden = !q;
    count.textContent = list.length + (list.length === 1 ? ' result' : ' results') + ' for \u201c' + q + '\u201d';
    search.querySelector('[data-search-results]').innerHTML = list.map(function (pr) { return resultHTML(pr, q); }).join('');
    search.querySelector('[data-search-empty]').hidden = !(q && !list.length);
    search.querySelector('[data-search-all]').hidden = !(q && list.length);
  }
  var searchReturn = null;
  function setSearch(open) {
    if (!search) return;
    if (open) {
      searchReturn = document.activeElement;
      if (nav && nav.classList.contains('is-open')) setNav(false);
      if (typeof setCart === 'function' && drawer && drawer.classList.contains('is-open')) setCart(false);
    }
    search.classList.toggle('is-open', open);
    document.body.classList.toggle('search-open', open);
    if (open) setTimeout(function () { sInput.focus(); }, 60);
    else if (searchReturn && searchReturn.focus) searchReturn.focus();
  }
  if (search && sOpen) {
    sOpen.addEventListener('click', function () { setSearch(true); });
    search.querySelector('[data-search-close]').addEventListener('click', function () { setSearch(false); });
    search.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSearch(false); });
    sInput.addEventListener('input', runSearch);
    search.querySelector('[data-search-form]').addEventListener('submit', function (e) { e.preventDefault(); runSearch(); });
    search.querySelector('[data-search-clear]').addEventListener('click', function () { sInput.value = ''; runSearch(); sInput.focus(); });
    search.querySelectorAll('[data-search-term]').forEach(function (b) {
      b.addEventListener('click', function () { sInput.value = b.getAttribute('data-search-term'); runSearch(); sInput.focus(); });
    });
    search.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) { search.classList.remove('is-open'); document.body.classList.remove('search-open'); }
    });
    runSearch();
  }

  /* ------------------------------------------------------------
     newsletter form (Shopify: {% form 'customer' %})
     ------------------------------------------------------------ */
  var nl = document.querySelector('[data-newsletter-form]');
  if (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = nl.querySelector('input[type="email"]');
      var msg = nl.querySelector('[data-form-message]');
      if (!input.value || !input.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
      msg.textContent = 'Thanks! This is a mockup, so nothing was sent.';
      input.value = '';
    });
  }

  /* ------------------------------------------------------------
     product form: purchase type (selling plans), quantity, add to cart
     ------------------------------------------------------------ */
  var form = document.querySelector('[data-product-form]');
  if (!form) return;

  var PRICE = CATALOG['daily-glow'].price;
  var details = form.querySelector('[data-subscription-details]');
  var plan = form.querySelector('[data-selling-plan]');
  var qty = form.querySelector('[data-qty]');
  var atc = form.querySelector('[data-atc]');
  var stickyPrice = document.querySelector('[data-sticky-price]');

  function isSub() { return form.querySelector('[data-purchase-type]:checked').value === 'subscription'; }
  function q() { var v = parseInt(qty.value, 10); return isNaN(v) || v < 1 ? 1 : Math.min(v, 9); }

  function render() {
    var unit = isSub() ? PRICE * (1 - SUB_DISCOUNT) : PRICE;
    details.hidden = !isSub();
    atc.textContent = (isSub() ? 'Subscribe · ' : 'Add to cart · ') + money(unit * q());
    if (stickyPrice) stickyPrice.textContent = isSub() ? 'Subscribe & save · ' + money(unit) + ' every ' + plan.value + ' days' : 'One-time · ' + money(unit);
  }

  form.querySelectorAll('[data-purchase-type]').forEach(function (r) { r.addEventListener('change', render); });
  plan.addEventListener('change', render);
  qty.addEventListener('input', render);
  form.querySelector('[data-qty-minus]').addEventListener('click', function () { qty.value = Math.max(1, q() - 1); render(); });
  form.querySelector('[data-qty-plus]').addEventListener('click', function () { qty.value = Math.min(9, q() + 1); render(); });

  function addToCart() {
    addLine('daily-glow', isSub(), isSub() ? +plan.value : 0, q());
    setCart(true);
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); addToCart(); });

  // gallery thumbnails
  document.querySelectorAll('[data-thumb]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-thumb]').forEach(function (b) { b.setAttribute('aria-current', 'false'); });
      btn.setAttribute('aria-current', 'true');
    });
  });

  // sticky add to cart (shows once the main button scrolls away)
  var sticky = document.querySelector('[data-sticky-atc]');
  var stickyBtn = document.querySelector('[data-sticky-button]');
  if (sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var show = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      stickyBtn.tabIndex = show ? 0 : -1;
    }).observe(atc);
    stickyBtn.addEventListener('click', addToCart);
  }

  render();
})();
