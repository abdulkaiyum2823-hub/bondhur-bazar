/* ==========================================================================
   বন্ধুর বাজার – প্রতিটি পেজের কোড
   ========================================================================== */
(function () {
  "use strict";
  var B = window.BB;
  var CFG = B.CFG;
  var Cart = B.Cart;
  var esc = B.esc;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };

  var DISTRICTS = [
    "ঢাকা","গাজীপুর","নারায়ণগঞ্জ","নরসিংদী","মানিকগঞ্জ","মুন্সিগঞ্জ","কিশোরগঞ্জ","টাঙ্গাইল","ফরিদপুর","গোপালগঞ্জ","মাদারীপুর","রাজবাড়ী","শরীয়তপুর",
    "চট্টগ্রাম","কক্সবাজার","কুমিল্লা","ফেনী","ব্রাহ্মণবাড়িয়া","নোয়াখালী","লক্ষ্মীপুর","চাঁদপুর","খাগড়াছড়ি","রাঙ্গামাটি","বান্দরবান",
    "রাজশাহী","নওগাঁ","নাটোর","চাঁপাইনবাবগঞ্জ","পাবনা","বগুড়া","জয়পুরহাট","সিরাজগঞ্জ",
    "খুলনা","বাগেরহাট","সাতক্ষীরা","যশোর","ঝিনাইদহ","মাগুরা","নড়াইল","কুষ্টিয়া","চুয়াডাঙ্গা","মেহেরপুর",
    "বরিশাল","ঝালকাঠি","পটুয়াখালী","পিরোজপুর","বরগুনা","ভোলা",
    "সিলেট","মৌলভীবাজার","হবিগঞ্জ","সুনামগঞ্জ",
    "রংপুর","দিনাজপুর","গাইবান্ধা","কুড়িগ্রাম","লালমনিরহাট","নীলফামারী","পঞ্চগড়","ঠাকুরগাঁও",
    "ময়মনসিংহ","জামালপুর","শেরপুর","নেত্রকোণা",
  ];

  function grid(el, list, emptyMsg) {
    if (!el) return;
    el.innerHTML = list.length
      ? list.map(B.productCard).join("")
      : '<p class="empty">' + (emptyMsg || "কোনো পণ্য পাওয়া যায়নি।") + "</p>";
  }
  function absUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return (CFG.siteUrl || "") + path;
  }

  /* ============================ হোম ============================ */
  function pageHome() {
    initSlider();
    var catGrid = $("#catGrid");
    if (catGrid)
      catGrid.innerHTML = CFG.categories
        .map(function (c) {
          return (
            '<a class="cat-card" href="shop.html?cat=' + encodeURIComponent(c.id) + '">' +
            '<span class="cat-icon" aria-hidden="true">' + c.icon + "</span>" +
            "<strong>" + esc(c.name) + "</strong><small>" + esc(c.desc || "") + "</small></a>"
          );
        })
        .join("");

    grid($("#popularGrid"), B.PRODUCTS.filter(function (p) { return p.popular; }).slice(0, 8));
    grid($("#newGrid"), B.PRODUCTS.filter(function (p) { return p.isNew; }).slice(0, 4), "শীঘ্রই নতুন পণ্য আসছে।");

    var f = $("#featureGrid");
    if (f)
      f.innerHTML = CFG.features
        .map(function (x) {
          return '<div class="feature"><div class="feature-icon" aria-hidden="true">' + x.icon + "</div><h3>" + esc(x.title) + "</h3><p>" + esc(x.text) + "</p></div>";
        })
        .join("");
    var w = $("#whyList");
    if (w) w.innerHTML = CFG.whyUs.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }


  /* ============================ হোমপেজ স্লাইডার ============================ */
  function initSlider() {
    var host = $("#heroSlider");
    var slides = CFG.heroSlides || [];
    if (!host || !slides.length) {
      if (host) host.hidden = true;
      return;
    }
    var n = slides.length;
    var delay = CFG.sliderInterval || 5000;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var html = '<div class="slides">';
    slides.forEach(function (s, i) {
      var art = s.art === "logo" ? '<img src="' + esc(CFG.logo) + '" alt="">' : '<span aria-hidden="true">' + esc(s.art || "🛒") + "</span>";
      var pic = "";
      if (s.image) {
        pic = "<picture>" + (s.mobileImage ? '<source media="(max-width: 700px)" srcset="' + esc(s.mobileImage) + '">' : "") +
          '<img class="slide-img" src="' + esc(s.image) + '" alt="' + esc(s.alt || s.title) + '"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + "></picture>";
      }
      html +=
        '<div class="slide' + (i === 0 ? " active" : "") + (s.image ? " has-img" : "") + '" data-theme="' + esc(s.theme || "green") +
        '" role="group" aria-roledescription="slide" aria-label="' + B.toBn(i + 1) + " / " + B.toBn(n) + '"' + (i === 0 ? "" : ' aria-hidden="true"') + ">" +
        '<div class="slide-art" aria-hidden="true">' + art + "</div>" + pic +
        '<div class="slide-shade"></div>' +
        '<div class="container slide-content"><div class="slide-text">' +
        "<h2>" + esc(s.title) + "</h2>" + (s.subtitle ? "<p>" + esc(s.subtitle) + "</p>" : "") +
        (s.buttonText ? '<a class="btn btn-gold btn-lg" href="' + esc(s.buttonLink || "shop.html") + '">' + esc(s.buttonText) + "</a>" : "") +
        "</div></div></div>";
    });
    html += "</div>";
    if (n > 1) {
      html +=
        '<button class="sl-btn sl-prev" type="button" aria-label="আগের ছবি">‹</button>' +
        '<button class="sl-btn sl-next" type="button" aria-label="পরের ছবি">›</button>' +
        '<div class="sl-dots" role="group" aria-label="স্লাইড বেছে নিন">' +
        slides.map(function (s, i) { return '<button type="button" class="sl-dot' + (i === 0 ? " active" : "") + '" data-i="' + i + '" aria-label="স্লাইড ' + B.toBn(i + 1) + '"></button>'; }).join("") +
        '</div><button class="sl-pause" type="button" aria-label="স্লাইড থামান">❚❚</button>';
    }
    host.innerHTML = html;

    /* ছবি লোড না হলে ছবি সরিয়ে রঙিন ডিজাইন দেখাও */
    function dropBroken(img) {
      var slide = img.closest(".slide");
      if (slide) slide.classList.remove("has-img");
      img.remove();
    }
    host.addEventListener("error", function (e) { if (e.target.tagName === "IMG" && e.target.classList.contains("slide-img")) dropBroken(e.target); }, true);
    Array.prototype.forEach.call(host.querySelectorAll(".slide-img"), function (img) {
      if (img.complete && img.naturalWidth === 0) dropBroken(img);
    });
    if (n < 2) return;

    var els = host.querySelectorAll(".slide"), dots = host.querySelectorAll(".sl-dot");
    var cur = 0, timer = null, hover = false, manualPause = reduce, hidden = false;

    function go(i) {
      i = (i + n) % n;
      if (i === cur) return;
      els[cur].classList.remove("active"); els[cur].setAttribute("aria-hidden", "true"); dots[cur].classList.remove("active");
      cur = i;
      els[cur].classList.add("active"); els[cur].removeAttribute("aria-hidden"); dots[cur].classList.add("active");
    }
    function stop() { clearTimeout(timer); timer = null; }
    function schedule() {
      stop();
      if (manualPause || hover || hidden) return;
      timer = setTimeout(function () { go(cur + 1); schedule(); }, delay);
    }
    function user(i) { go(i); schedule(); } /* ক্লিকের পর সময় আবার শুরু */

    host.querySelector(".sl-prev").addEventListener("click", function () { user(cur - 1); });
    host.querySelector(".sl-next").addEventListener("click", function () { user(cur + 1); });
    host.querySelector(".sl-dots").addEventListener("click", function (e) {
      var d = e.target.closest(".sl-dot");
      if (d) user(Number(d.getAttribute("data-i")));
    });
    var pb = host.querySelector(".sl-pause");
    function pbLabel() { pb.textContent = manualPause ? "▶" : "❚❚"; pb.setAttribute("aria-label", manualPause ? "স্লাইড চালু করুন" : "স্লাইড থামান"); }
    pb.addEventListener("click", function () { manualPause = !manualPause; pbLabel(); schedule(); });
    pbLabel();

    /* মাউস ওপরে থাকলে / ফোকাস থাকলে সাময়িক বন্ধ */
    host.addEventListener("mouseenter", function () { hover = true; stop(); });
    host.addEventListener("mouseleave", function () { hover = false; schedule(); });
    host.addEventListener("focusin", function () { hover = true; stop(); });
    host.addEventListener("focusout", function () { hover = false; schedule(); });
    document.addEventListener("visibilitychange", function () { hidden = document.hidden; schedule(); });
    /* কিবোর্ড তীর */
    host.setAttribute("tabindex", "0");
    host.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") user(cur - 1);
      else if (e.key === "ArrowRight") user(cur + 1);
    });
    /* মোবাইলে সোয়াইপ */
    var sx = null, sy = null;
    host.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; hover = true; stop(); }, { passive: true });
    host.addEventListener("touchend", function (e) {
      hover = false;
      if (sx !== null) {
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? cur + 1 : cur - 1); }
      }
      sx = sy = null; schedule();
    }, { passive: true });
    schedule();
  }

  /* ============================ শপ ============================ */
  function pageShop() {
    var qEl = $("#q"), sortEl = $("#sort"), chips = $("#chips"), countEl = $("#count"), gridEl = $("#shopGrid");
    var state = {
      cat: B.param("cat"),
      q: B.param("q"),
      sort: B.param("sort") || "default",
      filter: B.param("filter"), // popular | new
    };

    var chipHtml = '<button class="chip" data-cat="">সব পণ্য</button>';
    CFG.categories.forEach(function (c) {
      chipHtml += '<button class="chip" data-cat="' + esc(c.id) + '">' + c.icon + " " + esc(c.name) + "</button>";
    });
    chips.innerHTML = chipHtml;
    qEl.value = state.q;
    sortEl.value = state.sort;
    if (!sortEl.value) sortEl.value = "default";

    function apply() {
      var q = state.q.trim().toLowerCase();
      var list = B.PRODUCTS.filter(function (p) {
        if (state.cat && p.category !== state.cat) return false;
        if (state.filter === "popular" && !p.popular) return false;
        if (state.filter === "new" && !p.isNew) return false;
        if (q) {
          var hay = (p.name + " " + (p.short || "") + " " + B.getCategory(p.category).name + " " + p.id).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      var s = state.sort;
      list = list.slice();
      if (s === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
      else if (s === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
      else if (s === "popular") list.sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); });
      else if (s === "new") list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });

      grid(gridEl, list, "দুঃখিত, এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি। অন্য নাম বা ক্যাটাগরি চেষ্টা করুন।");
      var label = state.cat ? B.getCategory(state.cat).name : "সব পণ্য";
      if (state.filter === "popular") label += " (জনপ্রিয়)";
      if (state.filter === "new") label += " (নতুন)";
      countEl.textContent = label + " – " + B.toBn(list.length) + "টি পণ্য";

      Array.prototype.forEach.call(chips.children, function (c) {
        var on = c.getAttribute("data-cat") === state.cat;
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      try {
        var u = new URLSearchParams();
        if (state.cat) u.set("cat", state.cat);
        if (state.q) u.set("q", state.q);
        if (state.sort !== "default") u.set("sort", state.sort);
        if (state.filter) u.set("filter", state.filter);
        var qs = u.toString();
        history.replaceState(null, "", "shop.html" + (qs ? "?" + qs : ""));
      } catch (e) {}
    }

    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      state.cat = b.getAttribute("data-cat");
      apply();
    });
    qEl.addEventListener("input", function () { state.q = qEl.value; apply(); });
    sortEl.addEventListener("change", function () { state.sort = sortEl.value; apply(); });
    $("#showFilters").addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) return;
      state.filter = state.filter === b.getAttribute("data-filter") ? "" : b.getAttribute("data-filter");
      Array.prototype.forEach.call($("#showFilters").children, function (x) {
        x.classList.toggle("active", x.getAttribute("data-filter") === state.filter);
      });
      apply();
    });
    Array.prototype.forEach.call($("#showFilters").children, function (x) {
      x.classList.toggle("active", x.getAttribute("data-filter") === state.filter);
    });
    apply();
  }

  /* ============================ ক্যাটাগরি ============================ */
  function pageCategories() {
    var host = $("#catSections");
    $("#catTiles").innerHTML = CFG.categories
      .map(function (c) {
        var n = B.PRODUCTS.filter(function (p) { return p.category === c.id; }).length;
        return (
          '<a class="cat-card" href="#cat-' + esc(c.id) + '"><span class="cat-icon" aria-hidden="true">' + c.icon + "</span><strong>" +
          esc(c.name) + "</strong><small>" + B.toBn(n) + "টি পণ্য</small></a>"
        );
      })
      .join("");
    host.innerHTML = CFG.categories
      .map(function (c) {
        var list = B.PRODUCTS.filter(function (p) { return p.category === c.id; });
        return (
          '<section class="section" id="cat-' + esc(c.id) + '"><div class="section-head"><h2>' + c.icon + " " + esc(c.name) +
          '</h2><a href="shop.html?cat=' + encodeURIComponent(c.id) + '">সব দেখুন →</a></div><div class="grid">' +
          (list.length ? list.map(B.productCard).join("") : '<p class="empty">এই ক্যাটাগরিতে শীঘ্রই পণ্য আসছে।</p>') +
          "</div></section>"
        );
      })
      .join("");
  }

  /* ============================ পণ্যের বিস্তারিত ============================ */
  function pageProduct() {
    var p = B.getProduct(B.param("id"));
    var host = $("#productHost");
    if (!p) {
      host.innerHTML =
        '<div class="notice"><h2>পণ্যটি পাওয়া যায়নি</h2><p>লিংকটি ভুল অথবা পণ্যটি আর নেই।</p><a class="btn" href="shop.html">সব পণ্য দেখুন</a></div>';
      B.setMeta({ title: "পণ্য পাওয়া যায়নি – " + CFG.siteName });
      return;
    }
    B.setMeta({
      title: p.name + " – " + CFG.siteName,
      description: (p.short || p.name) + " " + B.basePriceLabel(p) + "। সারা বাংলাদেশে ডেলিভারি।",
    });
    renderPurchase(host, p, false);

    var rel = B.PRODUCTS.filter(function (x) { return x.category === p.category && x.id !== p.id; }).slice(0, 4);
    if (rel.length < 4)
      rel = rel.concat(
        B.PRODUCTS.filter(function (x) { return x.category !== p.category && x.id !== p.id; }).slice(0, 4 - rel.length)
      );
    grid($("#relatedGrid"), rel);
  }

  /* পণ্য ও ল্যান্ডিং – দুই পেজেই একই কেনার অংশ */
  function renderPurchase(host, p, isLanding) {
    var sizes = B.sizesOf(p);
    var cur = sizes[sizes.length - 1];
    var qty = 1;
    var out = p.inStock === false;
    var cat = B.getCategory(p.category);
    var L = p.landing || {};
    var img = L.image || p.image;
    var feat = (p.features || [])
      .map(function (f) { return "<li>" + esc(f) + "</li>"; })
      .join("");

    host.innerHTML =
      '<div class="pd">' +
      '<div class="pd-media"><img id="pdImg" src="' + esc(img) + '" alt="' + esc(p.name) + '" data-ph="' + esc(p.id) + '"></div>' +
      '<div class="pd-info">' +
      '<div class="crumbs"><a href="index.html">হোম</a> › <a href="shop.html?cat=' + encodeURIComponent(p.category) + '">' + esc(cat.name) + "</a></div>" +
      "<h1>" + esc(isLanding && L.headline ? L.headline : p.name) + "</h1>" +
      (isLanding && L.subheadline ? '<p class="lead">' + esc(L.subheadline) + "</p>" : '<p class="lead">' + esc(p.short || "") + "</p>") +
      '<div class="pd-price" id="pdPrice"></div>' +
      '<div class="pd-label">পরিমাণ বেছে নিন</div>' +
      '<div class="sizes" id="sizes" role="radiogroup" aria-label="পরিমাণ">' +
      sizes.map(function (s) {
        return '<button type="button" class="size" role="radio" data-size="' + s + '">' + B.sizeLabel(p, s) +
          "<small>" + B.money(B.priceFor(p, s)) + "</small></button>";
      }).join("") +
      "</div>" +
      '<div class="pd-label">সংখ্যা</div>' +
      '<div class="qty"><button type="button" id="qMinus" aria-label="কমান">−</button><span id="qVal" aria-live="polite">১</span><button type="button" id="qPlus" aria-label="বাড়ান">+</button></div>' +
      (out
        ? '<p class="out-msg">দুঃখিত, পণ্যটি এখন স্টকে নেই। WhatsApp-এ জানতে চাইতে পারেন।</p>'
        : '<div class="pd-actions">' +
          '<button class="btn" id="addBtn" type="button">কার্টে রাখুন</button>' +
          '<button class="btn btn-gold" id="buyBtn" type="button">এখনই অর্ডার করুন</button>' +
          '<a class="btn btn-wa" id="waBtn" target="_blank" rel="noopener" href="#">' + B.ICON.wa + " WhatsApp-এ অর্ডার</a></div>") +
      (feat ? '<ul class="ticks">' + feat + "</ul>" : "") +
      '<div class="share"><span>শেয়ার করুন:</span> <a target="_blank" rel="noopener" id="shareFb" href="#">' + B.ICON.fb + " Facebook</a> " +
      '<a target="_blank" rel="noopener" id="shareWa" href="#">' + B.ICON.wa + " WhatsApp</a></div>" +
      "</div></div>" +
      '<div class="pd-desc"><h2>পণ্যের বিবরণ</h2><p>' + esc(p.description || p.short || "") + "</p></div>";

    function refresh() {
      $("#pdPrice").innerHTML =
        "<strong>" + B.money(B.priceFor(p, cur) * qty) + "</strong> <small>(" + B.sizeLabel(p, cur) + " × " + B.toBn(qty) + ")</small>";
      Array.prototype.forEach.call($("#sizes").children, function (b) {
        var on = Number(b.getAttribute("data-size")) === cur;
        b.classList.toggle("active", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      $("#qVal").textContent = B.toBn(qty);
      var wa = $("#waBtn");
      if (wa) wa.href = B.waLink(B.buildSingleProductMessage(p, cur, qty));
    }
    $("#sizes").addEventListener("click", function (e) {
      var b = e.target.closest(".size");
      if (!b) return;
      cur = Number(b.getAttribute("data-size"));
      refresh();
    });
    $("#qMinus").addEventListener("click", function () { qty = Math.max(1, qty - 1); refresh(); });
    $("#qPlus").addEventListener("click", function () { qty = Math.min(99, qty + 1); refresh(); });
    var add = $("#addBtn"), buy = $("#buyBtn");
    if (add)
      add.addEventListener("click", function () {
        if (Cart.add(p.id, cur, qty)) B.toast("✔ কার্টে যোগ হয়েছে");
      });
    if (buy)
      buy.addEventListener("click", function () {
        if (Cart.add(p.id, cur, qty)) window.location.href = "checkout.html";
      });

    var pageUrl = window.location.href.split("#")[0];
    $("#shareFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl);
    $("#shareWa").href = "https://wa.me/?text=" + encodeURIComponent(p.name + " – " + pageUrl);
    refresh();
  }

  /* ============================ ল্যান্ডিং পেজ ============================ */
  function pageLanding() {
    var p = B.getProduct(B.param("id"));
    var host = $("#landingHost");
    if (!p) {
      host.innerHTML =
        '<div class="notice"><h2>পেজটি পাওয়া যায়নি</h2><p>লিংকে পণ্যের id ঠিক আছে কি না দেখুন (যেমন: landing.html?id=kalojira-honey)।</p><a class="btn" href="shop.html">সব পণ্য দেখুন</a></div>';
      return;
    }
    var L = p.landing || {};
    B.setMeta({
      title: (L.headline || p.name) + " – " + CFG.siteName,
      description: L.subheadline || p.short || p.description,
    });
    renderPurchase(host, p, true);

    var points = L.points && L.points.length ? L.points : p.features || [];
    $("#landingPoints").innerHTML = points
      .map(function (t) { return '<div class="feature"><div class="feature-icon" aria-hidden="true">✔</div><p>' + esc(t) + "</p></div>"; })
      .join("");
    if (!points.length) $("#landingPointsWrap").hidden = true;

    $("#landingStory").textContent = L.story || p.description || "";
    var contact = $("#landingWa");
    contact.href = B.waLink(B.buildSingleProductMessage(p, B.sizesOf(p)[B.sizesOf(p).length - 1], 1));

    grid(
      $("#landingMore"),
      B.PRODUCTS.filter(function (x) { return x.id !== p.id && x.popular; }).slice(0, 4)
    );
  }

  /* ============================ কার্ট ============================ */
  function pageCart() {
    var host = $("#cartHost");
    function render() {
      var lines = Cart.lines();
      if (!lines.length) {
        host.innerHTML =
          '<div class="notice"><div class="big-ico" aria-hidden="true">🛒</div><h2>আপনার কার্ট খালি</h2><p>পছন্দের পণ্য বেছে নিয়ে কার্টে রাখুন।</p><a class="btn" href="shop.html">কেনাকাটা শুরু করুন</a></div>';
        return;
      }
      var rows = lines
        .map(function (l) {
          var p = l.product;
          return (
            '<div class="cart-row" data-id="' + esc(p.id) + '" data-size="' + l.size + '">' +
            '<a class="cart-img" href="product.html?id=' + encodeURIComponent(p.id) + '">' + B.imgTag(p) + "</a>" +
            '<div class="cart-info"><a class="cart-name" href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a>" +
            '<div class="muted">' + B.sizeLabel(p, l.size) + " • " + B.money(l.unitPrice) + "</div>" +
            '<div class="cart-ctrl"><div class="qty qty-sm"><button type="button" data-act="minus" aria-label="কমান">−</button><span>' + B.toBn(l.qty) +
            '</span><button type="button" data-act="plus" aria-label="বাড়ান">+</button></div>' +
            '<button type="button" class="link-btn" data-act="remove">বাদ দিন</button></div></div>' +
            '<div class="cart-total">' + B.money(l.total) + "</div></div>"
          );
        })
        .join("");
      var sub = Cart.subtotal();
      host.innerHTML =
        '<div class="cart-layout"><div class="cart-list">' + rows +
        '<button type="button" class="link-btn" id="clearCart">সব পণ্য মুছুন</button></div>' +
        '<aside class="summary"><h2>অর্ডারের সারাংশ</h2>' +
        '<div class="sum-row"><span>পণ্যের মূল্য</span><strong>' + B.money(sub) + "</strong></div>" +
        '<div class="sum-row"><span>ডেলিভারি চার্জ</span><span>চেকআউটে জেলা অনুযায়ী যোগ হবে</span></div>' +
        '<div class="sum-row sum-total"><span>মোট (ডেলিভারি ছাড়া)</span><strong>' + B.money(sub) + "</strong></div>" +
        '<a class="btn btn-block" href="checkout.html">চেকআউটে যান</a>' +
        '<a class="btn btn-outline btn-block" href="shop.html">আরও পণ্য দেখুন</a></aside></div>';
    }
    host.addEventListener("click", function (e) {
      var clear = e.target.closest("#clearCart");
      if (clear) {
        if (window.confirm("কার্টের সব পণ্য মুছে ফেলবেন?")) Cart.clear();
        return;
      }
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var row = b.closest(".cart-row");
      var id = row.getAttribute("data-id");
      var size = Number(row.getAttribute("data-size"));
      var cur = Cart.items().filter(function (i) { return i.id === id && i.size === size; })[0];
      if (!cur) return;
      var act = b.getAttribute("data-act");
      if (act === "plus") Cart.setQty(id, size, cur.qty + 1);
      else if (act === "minus") Cart.setQty(id, size, cur.qty - 1);
      else if (act === "remove") Cart.remove(id, size);
    });
    document.addEventListener("bb:cart", render);
    render();
  }

  /* ============================ চেকআউট ============================ */
  function pageCheckout() {
    var host = $("#checkoutHost");
    var lines = Cart.lines();
    if (!lines.length) {
      host.innerHTML =
        '<div class="notice"><div class="big-ico" aria-hidden="true">🛒</div><h2>কার্ট খালি</h2><p>অর্ডার করতে আগে কার্টে পণ্য রাখুন।</p><a class="btn" href="shop.html">পণ্য দেখুন</a></div>';
      return;
    }
    var form = $("#orderForm");
    var dSel = $("#district");
    dSel.innerHTML =
      '<option value="">— জেলা বেছে নিন —</option>' +
      DISTRICTS.map(function (d) { return '<option value="' + d + '">' + d + "</option>"; }).join("");
    $("#paymentNote").textContent = CFG.paymentNote;

    /* আগের তথ্য মনে রাখা (সুবিধার জন্য) */
    var saved = B.store("bb_customer_v1");
    if (saved) {
      ["name", "phone", "address", "district", "upazila"].forEach(function (k) {
        if (saved[k] && form.elements[k]) form.elements[k].value = saved[k];
      });
    }

    function summary() {
      var sub = Cart.subtotal();
      var del = B.deliveryCharge(dSel.value, sub);
      var total = sub + del;
      $("#sumItems").innerHTML = Cart.lines()
        .map(function (l) {
          return '<div class="sum-item"><span>' + esc(l.product.name) + " <small>(" + B.sizeLabel(l.product, l.size) + " × " + B.toBn(l.qty) + ")</small></span><strong>" + B.money(l.total) + "</strong></div>";
        })
        .join("");
      $("#sumSub").textContent = B.money(sub);
      $("#sumDel").textContent = dSel.value ? (del === 0 ? "ফ্রি" : B.money(del)) : B.money(del) + " (জেলা বেছে নিলে নিশ্চিত হবে)";
      $("#sumTotal").textContent = B.money(total);
      return { sub: sub, del: del, total: total };
    }
    dSel.addEventListener("change", summary);
    document.addEventListener("bb:cart", function () {
      if (!Cart.count()) window.location.reload();
      else summary();
    });
    summary();

    function fieldError(name, msg) {
      var el = $("#err-" + name);
      var input = form.elements[name];
      if (el) el.textContent = msg || "";
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }

    function validate() {
      var f = form.elements;
      var name = f.name.value.trim();
      var phone = f.phone.value.replace(/[\s\-]/g, "");
      /* বাংলা সংখ্যা ইংরেজিতে রূপান্তর */
      phone = phone.replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); });
      var address = f.address.value.trim();
      var upazila = f.upazila.value.trim();
      var ok = true;
      var first = null;
      function check(field, cond, msg) {
        var good = fieldError(field, cond ? "" : msg);
        if (!good && !first) first = f[field];
        ok = ok && good;
      }
      check("name", name.length >= 2, "আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।");
      check("phone", /^(?:\+?88)?01[3-9]\d{8}$/.test(phone), "সঠিক মোবাইল নম্বর দিন। যেমন: 01712345678");
      check("address", address.length >= 10, "সম্পূর্ণ ঠিকানা লিখুন – গ্রাম/রাস্তা/বাড়ি নম্বরসহ (কমপক্ষে ১০ অক্ষর)।");
      check("district", !!f.district.value, "জেলা বেছে নিন।");
      check("upazila", upazila.length >= 2, "উপজেলা বা থানার নাম লিখুন।");
      if (first) first.focus();
      /* মোবাইল নম্বর ০১XXXXXXXXX রূপে সাজাই */
      phone = phone.replace(/^\+?88/, "");
      return ok ? { name: name, phone: phone, address: address, upazila: upazila, district: f.district.value, note: f.note.value.trim() } : null;
    }

    /* টাইপ করার সময় ত্রুটি মুছে যাক */
    form.addEventListener("input", function (e) {
      if (e.target.name) fieldError(e.target.name, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = validate();
      if (!data) return;
      var cur = Cart.lines();
      if (!cur.length) return;
      var s = summary();
      var now = new Date();
      var id =
        "BB-" + String(now.getFullYear()).slice(2) + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2) +
        "-" + Math.floor(1000 + Math.random() * 9000);
      var order = {
        id: id,
        name: data.name, phone: data.phone, address: data.address, upazila: data.upazila, district: data.district, note: data.note,
        items: cur.map(function (l) {
          return { id: l.product.id, name: l.product.name, sizeLabel: B.sizeLabel(l.product, l.size), qty: l.qty, unitPrice: l.unitPrice, total: l.total };
        }),
        subtotal: s.sub, delivery: s.del, total: s.total,
        time: now.toISOString(),
      };
      order.waUrl = B.waLink(B.buildOrderMessage(order));

      B.store("bb_customer_v1", { name: data.name, phone: data.phone, address: data.address, district: data.district, upazila: data.upazila });
      B.store(B.ORDER_KEY, order);

      /* WhatsApp খোলো (ক্লিকের সঙ্গে সঙ্গেই, যাতে ব্রাউজার আটকে না দেয়) */
      var w = null;
      try { w = window.open(order.waUrl, "_blank"); } catch (err) {}
      Cart.clear();
      window.location.href = "success.html" + (w ? "" : "?retry=1");
    });
  }

  /* ============================ অর্ডার সফল ============================ */
  function pageSuccess() {
    var host = $("#successHost");
    var o = B.store(B.ORDER_KEY);
    if (!o || !o.items) {
      host.innerHTML =
        '<div class="notice"><div class="big-ico" aria-hidden="true">📦</div><h2>কোনো সাম্প্রতিক অর্ডার নেই</h2><p>নতুন অর্ডার করতে দোকানে যান।</p><a class="btn" href="shop.html">কেনাকাটা শুরু করুন</a></div>';
      return;
    }
    var items = o.items
      .map(function (i) {
        return '<div class="sum-item"><span>' + esc(i.name) + " <small>(" + esc(i.sizeLabel) + " × " + B.toBn(i.qty) + ")</small></span><strong>" + B.money(i.total) + "</strong></div>";
      })
      .join("");
    host.innerHTML =
      '<div class="success-card"><div class="big-ico ok" aria-hidden="true">✅</div>' +
      "<h1>আপনার অর্ডার তৈরি হয়েছে!</h1>" +
      '<p class="lead">অর্ডার নম্বর: <strong>' + esc(B.toBn(o.id)) + "</strong></p>" +
      '<div class="callout"><strong>গুরুত্বপূর্ণ:</strong> অর্ডারটি আমাদের কাছে পৌঁছাতে WhatsApp-এ তৈরি মেসেজটি <b>অবশ্যই “Send” করুন</b>। ' +
      "WhatsApp না খুললে নিচের বাটনে চাপ দিন।</div>" +
      '<a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="' + esc(o.waUrl) + '">' + B.ICON.wa + " WhatsApp-এ অর্ডার পাঠান</a>" +
      '<div class="summary summary-flat"><h2>অর্ডারের বিবরণ</h2>' + items +
      '<div class="sum-row"><span>পণ্যের মূল্য</span><strong>' + B.money(o.subtotal) + "</strong></div>" +
      '<div class="sum-row"><span>ডেলিভারি চার্জ</span><strong>' + (o.delivery === 0 ? "ফ্রি" : B.money(o.delivery)) + "</strong></div>" +
      '<div class="sum-row sum-total"><span>সর্বমোট</span><strong>' + B.money(o.total) + "</strong></div>" +
      '<hr><p><b>নাম:</b> ' + esc(o.name) + "<br><b>মোবাইল:</b> " + esc(B.toBn(o.phone)) + "<br><b>ঠিকানা:</b> " +
      esc(o.address) + ", " + esc(o.upazila) + ", " + esc(o.district) + "</p></div>" +
      '<a class="btn btn-outline" href="shop.html">আরও কেনাকাটা করুন</a></div>';
  }

  /* ============================ যোগাযোগ ============================ */
  function pageContact() {
    $("#waBig").href = B.waLink("আসসালামু আলাইকুম, আমি " + CFG.siteName + " সম্পর্কে জানতে চাই।");
    $("#waNum").textContent = B.toBn(CFG.whatsappDisplay);
    $("#fbBig").href = CFG.facebookUrl;
    $("#fbName").textContent = CFG.facebookName + " (@" + CFG.facebookUsername + ")";
    var form = $("#msgForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = form.elements.name.value.trim();
      var m = form.elements.message.value.trim();
      var ok = true;
      $("#err-cname").textContent = n.length < 2 ? "আপনার নাম লিখুন।" : "";
      $("#err-cmsg").textContent = m.length < 5 ? "আপনার বার্তা লিখুন।" : "";
      ok = n.length >= 2 && m.length >= 5;
      if (!ok) return;
      window.open(B.waLink("নাম: " + n + "\n\n" + m), "_blank");
    });
  }

  /* ============================ আমাদের সম্পর্কে ============================ */
  function pageAbout() {
    $("#aboutText").innerHTML = CFG.aboutText.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    $("#featureGrid").innerHTML = CFG.features
      .map(function (x) {
        return '<div class="feature"><div class="feature-icon" aria-hidden="true">' + x.icon + "</div><h3>" + esc(x.title) + "</h3><p>" + esc(x.text) + "</p></div>";
      })
      .join("");
  }

  /* ============================ অ্যাডমিন হেল্পার (পণ্যের কোড বানায়) ============================ */
  function pageAdmin() {
    var catSel = $("#a_cat");
    catSel.innerHTML = CFG.categories.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + " (" + esc(c.id) + ")</option>"; }).join("");
    var form = $("#adminForm");
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var id = slug(f.id.value);
      var err = $("#a_err");
      err.textContent = "";
      if (!id) { err.textContent = "পণ্যের id ইংরেজি অক্ষর/সংখ্যায় লিখুন (যেমন: lichu-honey)।"; return; }
      if (B.getProduct(id)) { err.textContent = "এই id আগে থেকেই আছে। অন্য id দিন।"; return; }
      if (!f.name.value.trim()) { err.textContent = "পণ্যের নাম লিখুন।"; return; }
      var price = parseFloat(f.price.value);
      if (!(price > 0)) { err.textContent = "সঠিক দাম লিখুন।"; return; }
      var sizes = f.sizes.value.split(",").map(function (x) { return parseFloat(x.trim()); }).filter(function (x) { return x > 0; });
      if (!sizes.length) sizes = [1];
      var obj = {
        id: id, name: f.name.value.trim(), category: f.category.value, price: price, unit: f.unit.value.trim() || "কেজি",
        sizes: sizes, image: "images/products/" + (f.image.value.trim() || id + ".jpg"),
        short: f.short.value.trim(), description: f.description.value.trim(),
        features: f.features.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
        popular: f.popular.checked, isNew: f.isNew.checked, inStock: true,
      };
      var code = "  " + JSON.stringify(obj, null, 2).replace(/\n/g, "\n  ") + ",";
      $("#a_out").value = code;
      $("#a_result").hidden = false;
      $("#a_link").textContent = "landing.html?id=" + id;
    });
    $("#a_copy").addEventListener("click", function () {
      var ta = $("#a_out");
      ta.select();
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value);
        else document.execCommand("copy");
        B.toast("কপি হয়েছে");
      } catch (e) { B.toast("লেখাটি চেপে ধরে কপি করুন"); }
    });
  }

  var PAGES = {
    home: pageHome, shop: pageShop, categories: pageCategories, product: pageProduct, landing: pageLanding,
    cart: pageCart, checkout: pageCheckout, success: pageSuccess, contact: pageContact, about: pageAbout, admin: pageAdmin,
  };

  function run() {
    var page = document.body.getAttribute("data-page");
    if (PAGES[page]) PAGES[page]();
  }
  if (window.BB_READY) run();
  else document.addEventListener("bb:ready", run);
})();
