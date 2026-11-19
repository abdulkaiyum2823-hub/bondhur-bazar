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

    var offers = B.PRODUCTS.filter(function (p) { return B.hasOffer(p) && p.inStock !== false; }).slice(0, 8);
    var offerSec = $("#offerSection");
    if (offerSec) {
      offerSec.hidden = !offers.length;
      grid($("#offerGrid"), offers);
    }
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
        if (state.filter === "offer" && !B.hasOffer(p)) return false;
        if (q) {
          var hay = (p.name + " " + (p.short || "") + " " + B.getCategory(p.category).name + " " + p.id).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      var s = state.sort;
      list = list.slice();
      if (s === "price-asc") list.sort(function (a, b) { return B.unitBase(a) - B.unitBase(b); });
      else if (s === "price-desc") list.sort(function (a, b) { return B.unitBase(b) - B.unitBase(a); });
      else if (s === "popular") list.sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); });
      else if (s === "new") list.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); });

      grid(gridEl, list, "দুঃখিত, এই অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি। অন্য নাম বা ক্যাটাগরি চেষ্টা করুন।");
      var label = state.cat ? B.getCategory(state.cat).name : "সব পণ্য";
      if (state.filter === "popular") label += " (জনপ্রিয়)";
      if (state.filter === "new") label += " (নতুন)";
      if (state.filter === "offer") label += " (অফার)";
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
      '<div class="pd-title"><h1>' + esc(isLanding && L.headline ? L.headline : p.name) + "</h1>" + B.heartBtn(p.id) + "</div>" +
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
        "<strong>" + B.money(B.priceFor(p, cur) * qty) + "</strong> " +
        (B.hasOffer(p) ? '<del class="price-old">' + B.money(B.regularPriceFor(p, cur) * qty) + "</del> " : "") +
        "<small>(" + B.sizeLabel(p, cur) + " × " + B.toBn(qty) + ")</small>";
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
    B.Wish.refresh();
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

  /* ---------- সাধারণ: মডাল ---------- */
  function openModal(html, onClose) {
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal" role="dialog" aria-modal="true" tabindex="-1">' + html + "</div>";
    document.body.appendChild(back);
    document.body.classList.add("modal-open");
    var box = back.firstChild;
    var prev = document.activeElement;
    function close() {
      document.removeEventListener("keydown", key);
      back.remove();
      document.body.classList.remove("modal-open");
      if (prev && prev.focus) prev.focus();
      if (onClose) onClose();
    }
    function key(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", key);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    setTimeout(function () { box.focus(); }, 30);
    return { el: box, close: close };
  }

  var ERR = {
    invalid_name: "নাম সঠিক নয়।", invalid_phone: "মোবাইল নম্বর সঠিক নয়।", invalid_district: "জেলা সঠিক নয়।",
    invalid_upazila: "উপজেলা সঠিক নয়।", invalid_address: "ঠিকানা সঠিক নয় (কমপক্ষে ১০ অক্ষর)।",
    invalid_note: "নোট খুব বড় (সর্বোচ্চ ৫০০ অক্ষর)।", invalid_items: "কার্টের পণ্যে সমস্যা আছে। কার্ট দেখে আবার চেষ্টা করুন।",
    product_missing: "কার্টের কোনো পণ্য এখন আর পাওয়া যাচ্ছে না। কার্ট দেখে নিন।",
    out_of_stock: "পণ্যটি এখন স্টকে নেই", invalid_size: "পণ্যের পরিমাণ সঠিক নয়",
    delivery_not_set: "ডেলিভারি চার্জ এখনো নির্ধারিত নয়, তাই bKash পেমেন্ট এখন নেওয়া যাচ্ছে না। ক্যাশ অন ডেলিভারি বেছে নিন।",
    payment_disabled: "এই পেমেন্ট পদ্ধতি এখন বন্ধ আছে। অন্য পদ্ধতি বেছে নিন।", invalid_payment: "পেমেন্ট পদ্ধতি বেছে নিন।",
    invalid_txn: "bKash TrxID সঠিক নয় (৬–২০টি ইংরেজি অক্ষর/সংখ্যা)।", invalid_sender: "যে নম্বর থেকে টাকা পাঠিয়েছেন তা সঠিক নয়।",
    too_many_orders: "অল্প সময়ে অনেক অর্ডার হয়ে গেছে। কিছুক্ষণ পর আবার চেষ্টা করুন, বা WhatsApp-এ জানান।",
    busy: "এখন সার্ভার ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।", invalid: "অর্ডার তৈরি করা যায়নি। তথ্য দেখে আবার চেষ্টা করুন।",
    network: "ইন্টারনেট সংযোগে সমস্যা। সংযোগ দেখে আবার চেষ্টা করুন (অর্ডার তৈরি হয়ে থাকলে ডুপ্লিকেট এড়াতে আগে অর্ডার ট্র্যাক পেজ দেখুন)।",
    server: "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।",
  };
  function errText(r) {
    var t = ERR[r.code] || ERR.server;
    if (r.detail) t += " [কারিগরি তথ্য – " + r.detail + "]";
    return r.arg && (r.code === "out_of_stock" || r.code === "invalid_size") ? t + ": " + r.arg : t;
  }

  var STATUS = {
    pending: "অর্ডার গৃহীত – কনফার্মেশনের অপেক্ষায়", payment_pending: "bKash পেমেন্ট যাচাইয়ের অপেক্ষায়", paid: "পেমেন্ট নিশ্চিত",
    processing: "প্রস্তুত করা হচ্ছে", shipped: "ডেলিভারির জন্য পাঠানো হয়েছে", delivered: "ডেলিভারি সম্পন্ন", cancelled: "বাতিল",
  };
  var PAYSTAT = {
    pending: "পেমেন্ট বাকি (ডেলিভারির সময় দিবেন)", pending_verification: "যাচাইয়ের অপেক্ষায় (Pending Verification)",
    paid: "পরিশোধিত", rejected: "যাচাইয়ে মেলেনি", refunded: "ফেরত দেওয়া হয়েছে",
  };

  function bn(n) { return B.toBn(n); }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
    } catch (e) { return iso; }
  }
  function delText(del, pending) {
    return pending ? "পরে জানানো হবে" : del === 0 ? "ফ্রি" : B.money(del);
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
    var districts = CFG.districts || DISTRICTS;
    dSel.innerHTML =
      '<option value="">— জেলা বেছে নিন —</option>' +
      districts.map(function (d) { return '<option value="' + esc(d) + '">' + esc(d) + "</option>"; }).join("");
    var live = !!CFG.dbConnected;
    var PAY = CFG.payment || {};
    $("#offlineNote").hidden = live;
    $("#payBox").hidden = !live;
    $("#paymentNote").textContent = live
      ? "পেমেন্ট পদ্ধতি বেছে অর্ডার করুন। অর্ডারের পর আমরা আপনার সঙ্গে যোগাযোগ করে কনফার্ম করব।"
      : "";
    $("#submitBtn").textContent = live ? "অর্ডার পর্যালোচনা করুন" : "WhatsApp-এ অর্ডার পাঠান";

    var saved = B.store("bb_customer_v1");
    if (saved)
      ["name", "phone", "address", "district", "upazila"].forEach(function (k) {
        if (saved[k] && form.elements[k]) form.elements[k].value = saved[k];
      });

    /* পেমেন্ট বিকল্প */
    var codOpt = $("#payCod"), bkOpt = $("#payBkash");
    codOpt.closest(".pay-opt").hidden = PAY.codEnabled === false;
    bkOpt.closest(".pay-opt").hidden = PAY.bkashEnabled === false;
    if (PAY.codEnabled === false && PAY.bkashEnabled !== false) bkOpt.checked = true;
    $("#bkNum").textContent = bn(PAY.bkashNumber || "01602975419");
    $("#bkType").textContent = (PAY.bkashType || "Personal") + " – " + (PAY.bkashMethod || "Send Money");
    $("#bkCopy").addEventListener("click", function () { copyText(PAY.bkashNumber || "01602975419"); });

    function method() { return bkOpt.checked ? "bkash" : "cod"; }

    function summary() {
      var sub = Cart.subtotal();
      var di = B.deliveryInfo(dSel.value, sub);
      var del = di.known ? di.charge : 0;
      var total = sub + del;
      $("#sumItems").innerHTML = Cart.lines()
        .map(function (l) {
          return '<div class="sum-item"><span>' + esc(l.product.name) + " <small>(" + B.sizeLabel(l.product, l.size) + " × " + B.toBn(l.qty) + ")</small></span><strong>" + B.money(l.total) + "</strong></div>";
        }).join("");
      $("#sumSub").textContent = B.money(sub);
      var delEl = $("#sumDel");
      if (!dSel.value) delEl.textContent = "জেলা বেছে নিলে জানা যাবে";
      else if (!di.known) delEl.textContent = "অর্ডারের পর জানানো হবে";
      else delEl.textContent = di.charge === 0 ? "ফ্রি" : B.money(di.charge);
      $("#sumTotal").textContent = B.money(total) + (dSel.value && !di.known ? " + ডেলিভারি" : "");
      /* bKash শুধু ডেলিভারি চার্জ জানা থাকলে */
      var needDel = !di.known;
      $("#bkDelivery").hidden = !(live && bkOpt.checked && needDel);
      $("#bkFields").hidden = !(bkOpt.checked && !needDel);
      $("#bkAmount").textContent = B.money(total);
      return { sub: sub, di: di, del: del, total: total };
    }
    dSel.addEventListener("change", summary);
    form.addEventListener("change", function (e) { if (e.target.name === "pay") summary(); });
    document.addEventListener("bb:cart", function () {
      if (!Cart.count()) window.location.reload(); else summary();
    });
    summary();

    function fieldError(name, msg) {
      var el = $("#err-" + name);
      var input = form.elements[name];
      if (el) el.textContent = msg || "";
      if (input && input.setAttribute) input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }
    function normPhone(v) {
      v = String(v || "").replace(/[\s\-]/g, "").replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); });
      return v.replace(/^\+?88/, "");
    }

    function validate() {
      var f = form.elements;
      var name = f.name.value.trim(), phone = normPhone(f.phone.value), address = f.address.value.trim(), upazila = f.upazila.value.trim();
      var ok = true, first = null;
      function check(field, cond, msg) {
        var good = fieldError(field, cond ? "" : msg);
        if (!good && !first) first = f[field];
        ok = ok && good;
      }
      check("name", name.length >= 2, "আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।");
      check("phone", /^01[3-9]\d{8}$/.test(phone), "সঠিক মোবাইল নম্বর দিন। যেমন: 01712345678");
      check("address", address.length >= 10, "সম্পূর্ণ ঠিকানা লিখুন – গ্রাম/রাস্তা/বাড়ি নম্বরসহ (কমপক্ষে ১০ অক্ষর)।");
      check("district", !!f.district.value, "জেলা বেছে নিন।");
      check("upazila", upazila.length >= 2, "উপজেলা বা থানার নাম লিখুন।");
      var data = { name: name, phone: phone, address: address, upazila: upazila, district: f.district.value, note: f.note.value.trim(), payment_method: "cod" };
      if (live) {
        data.payment_method = method();
        if (data.payment_method === "bkash") {
          var s = summary();
          if (!s.di.known) { ok = false; B.toast("bKash-এর জন্য আগে ডেলিভারি চার্জ জানা দরকার"); }
          var txn = f.bkTxn.value.replace(/\s/g, "").toUpperCase();
          var sender = normPhone(f.bkSender.value);
          check("bkTxn", /^[A-Z0-9]{6,20}$/.test(txn), "bKash-এর TrxID লিখুন (৬–২০টি ইংরেজি অক্ষর/সংখ্যা)।");
          check("bkSender", /^01[3-9]\d{8}$/.test(sender), "যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি লিখুন।");
          data.bkash_txn = txn; data.bkash_sender = sender;
        }
      }
      if (first) first.focus();
      return ok ? data : null;
    }

    form.addEventListener("input", function (e) { if (e.target.name) fieldError(e.target.name, ""); });

    var busy = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var data = validate();
      if (!data) return;
      var s = summary();
      if (!live) return legacyWhatsApp(data, s);
      review(data, s);
    });

    /* Supabase চালু না থাকলে পুরনো পদ্ধতি: শুধু WhatsApp মেসেজ (ডাটাবেসে সেভ হয় না) */
    function legacyWhatsApp(data, s) {
      var m = ["🛒 *নতুন অর্ডার – " + CFG.siteName + "*", "", "👤 নাম: " + data.name, "📞 মোবাইল: " + data.phone,
        "📍 ঠিকানা: " + data.address + ", " + data.upazila + ", " + data.district, "", "📦 পণ্য:"];
      Cart.lines().forEach(function (l, i) {
        m.push((i + 1) + ". " + l.product.name + " (" + B.sizeLabel(l.product, l.size) + ") × " + l.qty + " = " + B.money(l.total));
      });
      m.push("", "পণ্যের মূল্য: " + B.money(s.sub), "ডেলিভারি চার্জ: " + (s.di.known ? delText(s.di.charge) : "পরে জানানো হবে"));
      if (data.note) m.push("📝 নোট: " + data.note);
      B.store("bb_customer_v1", { name: data.name, phone: data.phone, address: data.address, district: data.district, upazila: data.upazila });
      window.open(B.waLink(m.join("\n")), "_blank");
    }

    function review(data, s) {
      var rows = Cart.lines().map(function (l) {
        return '<div class="sum-item"><span>' + esc(l.product.name) + " <small>(" + B.sizeLabel(l.product, l.size) + " × " + bn(l.qty) + ")</small></span><strong>" + B.money(l.total) + "</strong></div>";
      }).join("");
      var bk = data.payment_method === "bkash"
        ? "<p><b>bKash TrxID:</b> " + esc(data.bkash_txn) + "<br><b>যে নম্বর থেকে পাঠানো:</b> " + esc(bn(data.bkash_sender)) +
          '<br><small class="muted">আমরা নিজে হাতে পেমেন্ট মিলিয়ে দেখব; যাচাই না হওয়া পর্যন্ত স্ট্যাটাস “যাচাইয়ের অপেক্ষায়” থাকবে।</small></p>'
        : "";
      var m = openModal(
        "<h2>অর্ডার পর্যালোচনা</h2>" + rows +
        '<div class="sum-row"><span>পণ্যের মূল্য</span><strong>' + B.money(s.sub) + "</strong></div>" +
        '<div class="sum-row"><span>ডেলিভারি চার্জ</span><strong>' + delText(s.del, !s.di.known) + "</strong></div>" +
        '<div class="sum-row sum-total"><span>সর্বমোট</span><strong>' + B.money(s.total) + (s.di.known ? "" : " + ডেলিভারি") + "</strong></div>" +
        (s.di.known ? "" : '<p class="hint">ডেলিভারি চার্জ আমরা অর্ডারের পর আপনাকে জানাব।</p>') +
        "<hr><p><b>নাম:</b> " + esc(data.name) + "<br><b>মোবাইল:</b> " + esc(bn(data.phone)) + "<br><b>ঠিকানা:</b> " +
        esc(data.address) + ", " + esc(data.upazila) + ", " + esc(data.district) + "<br><b>পেমেন্ট:</b> " + esc(B.payLabel(data.payment_method)) + "</p>" + bk +
        '<p class="err" id="modalErr" role="alert"></p>' +
        '<div class="modal-actions"><button type="button" class="btn btn-outline" id="mEdit">তথ্য বদলান</button>' +
        '<button type="button" class="btn btn-lg" id="mOk">অর্ডার নিশ্চিত করুন</button></div>'
      );
      m.el.querySelector("#mEdit").addEventListener("click", m.close);
      var ok = m.el.querySelector("#mOk");
      ok.addEventListener("click", function () {
        if (busy) return;
        busy = true;
        ok.disabled = true;
        ok.innerHTML = '<span class="spinner" aria-hidden="true"></span> অর্ডার তৈরি হচ্ছে…';
        var payload = {
          name: data.name, phone: data.phone, address: data.address, upazila: data.upazila, district: data.district, note: data.note,
          payment_method: data.payment_method, website: form.elements.website.value,
          expected_total: s.total,
          items: Cart.items().map(function (it) { return { id: it.id, size: it.size, qty: it.qty }; }),
        };
        if (data.payment_method === "bkash") { payload.bkash_txn = data.bkash_txn; payload.bkash_sender = data.bkash_sender; }
        window.BBAPI.rpc("place_order", payload).then(function (r) {
          if (!r.ok) {
            busy = false;
            ok.disabled = false;
            ok.textContent = "আবার চেষ্টা করুন";
            if (r.code === "price_changed") {
              window.BBAPI.clearCache();
              m.el.querySelector("#modalErr").textContent = "ইতিমধ্যে কোনো পণ্যের দাম বা ডেলিভারি চার্জ বদলেছে। পেজটি নতুন করে লোড হচ্ছে, দামটি দেখে আবার অর্ডার করুন।";
              setTimeout(function () { window.location.reload(); }, 2800);
              return;
            }
            m.el.querySelector("#modalErr").textContent = errText(r);
            return;
          }
          var o = r.data;
          B.store("bb_customer_v1", { name: data.name, phone: data.phone, address: data.address, district: data.district, upazila: data.upazila });
          B.store(B.ORDER_KEY, {
            id: o.order_id, createdAt: o.created_at, phone: data.phone, name: data.name, address: data.address, upazila: data.upazila, district: data.district,
            paymentMethod: o.payment_method, paymentStatus: o.payment_status, orderStatus: o.order_status,
            bkashTxn: data.bkash_txn || "", bkashSender: data.bkash_sender || "",
            items: o.items, subtotal: o.subtotal, delivery: o.delivery, deliveryPending: o.delivery_pending, total: o.total,
          });
          Cart.clear();
          window.location.href = "success.html";
        });
      });
    }
  }

  function copyText(t) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { B.toast("কপি হয়েছে"); }, function () { B.toast("কপি করা যায়নি"); });
      else {
        var ta = document.createElement("textarea");
        ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); B.toast("কপি হয়েছে");
      }
    } catch (e) { B.toast("কপি করা যায়নি – লেখাটি চেপে ধরে কপি করুন"); }
  }

  /* ============================ অর্ডার সফল ============================ */
  function pageSuccess() {
    var host = $("#successHost");
    var o = B.store(B.ORDER_KEY);
    if (!o || !o.items || !o.id) {
      host.innerHTML =
        '<div class="notice"><div class="big-ico" aria-hidden="true">📦</div><h2>কোনো সাম্প্রতিক অর্ডার নেই</h2><p>নতুন অর্ডার করতে দোকানে যান, অথবা পুরনো অর্ডারের অবস্থা দেখতে ট্র্যাক করুন।</p><a class="btn" href="shop.html">কেনাকাটা শুরু করুন</a> <a class="btn btn-outline" href="track.html">অর্ডার ট্র্যাক করুন</a></div>';
      return;
    }
    var items = o.items.map(function (i) {
      var p = B.getProduct(i.id);
      var lbl = p ? B.sizeLabel(p, Number(i.size)) : String(i.size);
      return '<div class="sum-item"><span>' + esc(i.name) + " <small>(" + esc(lbl) + " × " + bn(i.qty) + ")</small></span><strong>" + B.money(i.total) + "</strong></div>";
    }).join("");
    var msg = B.buildOrderMessage(o);
    var bk = o.paymentMethod === "bkash"
      ? '<div class="callout">আপনার bKash পেমেন্ট এখন <b>“যাচাইয়ের অপেক্ষায় (Pending Verification)”</b>। আমরা নিজে হাতে মিলিয়ে দেখে অর্ডার নিশ্চিত করব – এটি স্বয়ংক্রিয়ভাবে যাচাই হয় না।</div>'
      : "";
    host.innerHTML =
      '<div class="success-card"><div class="check-anim" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg></div>' +
      "<h1>আপনার অর্ডার গ্রহণ করা হয়েছে!</h1>" +
      '<div class="oid-box"><span>আপনার অর্ডার নম্বর</span><strong id="oid">' + esc(o.id) + '</strong><button type="button" class="btn btn-sm btn-outline" id="copyOid">কপি করুন</button></div>' +
      '<p class="muted">এই নম্বরটি ও অর্ডারে দেওয়া মোবাইল নম্বর দিয়ে যেকোনো সময় অর্ডারের অবস্থা দেখতে পারবেন। নম্বরটি সংরক্ষণ করুন।</p>' + bk +
      '<div class="callout"><strong>দ্রুত কনফার্মেশনের জন্য:</strong> নিচের বাটনে WhatsApp খুলে তৈরি মেসেজটি আপনি নিজে “Send” করুন। (অর্ডার আমাদের সিস্টেমে ইতিমধ্যে সেভ হয়েছে; মেসেজ পাঠানো ঐচ্ছিক।)</div>' +
      '<a class="btn btn-wa btn-lg" target="_blank" rel="noopener" href="' + esc(B.waLink(msg)) + '">' + B.ICON.wa + " WhatsApp-এ মেসেজ পাঠান</a> " +
      '<a class="btn btn-outline btn-lg" href="track.html?id=' + encodeURIComponent(o.id) + '">অর্ডার ট্র্যাক করুন</a>' +
      '<div class="summary summary-flat"><h2>অর্ডারের বিবরণ</h2>' + items +
      '<div class="sum-row"><span>পণ্যের মূল্য</span><strong>' + B.money(o.subtotal) + "</strong></div>" +
      '<div class="sum-row"><span>ডেলিভারি চার্জ</span><strong>' + delText(o.delivery, o.deliveryPending) + "</strong></div>" +
      '<div class="sum-row sum-total"><span>সর্বমোট</span><strong>' + B.money(o.total) + (o.deliveryPending ? " + ডেলিভারি" : "") + "</strong></div>" +
      '<div class="sum-row"><span>পেমেন্ট</span><span>' + esc(B.payLabel(o.paymentMethod)) + " – " + esc(PAYSTAT[o.paymentStatus] || "") + "</span></div>" +
      (o.deliveryPending ? '<p class="hint">ডেলিভারি চার্জ নির্ধারণ করে আমরা আপনাকে জানাব।</p>' : "") +
      '<hr><p><b>নাম:</b> ' + esc(o.name) + "<br><b>মোবাইল:</b> " + esc(bn(o.phone)) + "<br><b>ঠিকানা:</b> " +
      esc(o.address) + ", " + esc(o.upazila) + ", " + esc(o.district) + "</p></div>" +
      '<a class="btn btn-outline" href="shop.html">আরও কেনাকাটা করুন</a></div>';
    $("#copyOid").addEventListener("click", function () { copyText(o.id); });
  }

  /* ============================ অর্ডার ট্র্যাকিং ============================ */
  function pageTrack() {
    var form = $("#trackForm"), out = $("#trackOut"), btn = $("#trackBtn");
    var last = B.store(B.ORDER_KEY);
    var qid = B.param("id") || (last && last.id) || "";
    form.elements.oid.value = qid;
    if (last && last.phone && (!B.param("id") || B.param("id") === last.id)) form.elements.phone.value = last.phone;
    if (!CFG.dbConnected) {
      out.innerHTML = '<div class="notice"><p>অনলাইন ট্র্যাকিং এখনো চালু হয়নি। অর্ডারের অবস্থা জানতে WhatsApp-এ যোগাযোগ করুন।</p></div>';
      btn.disabled = true;
      return;
    }
    var busy = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var oid = form.elements.oid.value.trim().toUpperCase();
      var phone = form.elements.phone.value.replace(/[\s\-]/g, "").replace(/[০-৯]/g, function (d) { return "০১২৩৪৫৬৭৮৯".indexOf(d); }).replace(/^\+?88/, "");
      $("#err-oid").textContent = /^BB-\d{6}-[A-Z0-9]{6}$/.test(oid) ? "" : "অর্ডার নম্বর এভাবে লিখুন: BB-261118-K7M2PX";
      $("#err-tphone").textContent = /^01[3-9]\d{8}$/.test(phone) ? "" : "সঠিক মোবাইল নম্বর দিন।";
      if ($("#err-oid").textContent || $("#err-tphone").textContent) return;
      busy = true; btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> খোঁজা হচ্ছে…';
      window.BBAPI.rpc("track_order", { p_order_id: oid, p_phone: phone }).then(function (r) {
        busy = false; btn.disabled = false; btn.textContent = "অর্ডার খুঁজুন";
        if (!r.ok) { out.innerHTML = '<div class="notice err-box">' + esc(r.code === "network" ? ERR.network : ERR.server) + "</div>"; return; }
        var d = r.data;
        if (!d || !d.ok) {
          var m = d && d.error === "too_many_attempts"
            ? "অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।"
            : d && d.error === "invalid" ? "অর্ডার নম্বর বা মোবাইল নম্বরের ফরম্যাট সঠিক নয়।"
            : "এই অর্ডার নম্বর ও মোবাইল নম্বরের সঙ্গে মেলে এমন কোনো অর্ডার পাওয়া যায়নি। দুটোই ঠিক আছে কি না দেখুন।";
          out.innerHTML = '<div class="notice err-box">' + esc(m) + "</div>";
          return;
        }
        renderTrack(d.order);
      });
    });
    if (qid && form.elements.phone.value) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));

    function renderTrack(o) {
      var steps = ["অর্ডার গৃহীত", "পেমেন্ট নিশ্চিত", "প্রস্তুত হচ্ছে", "পাঠানো হয়েছে", "ডেলিভারি সম্পন্ন"];
      var idx = { pending: 0, payment_pending: 0, paid: 1, processing: 2, shipped: 3, delivered: 4 }[o.order_status];
      var tl;
      if (o.order_status === "cancelled") tl = '<div class="callout cancelled">এই অর্ডারটি বাতিল করা হয়েছে।</div>';
      else
        tl = '<ol class="timeline">' + steps.map(function (s, i) {
          var cls = i < idx ? "done" : i === idx ? "now" : "";
          /* COD-তে "পেমেন্ট নিশ্চিত" ধাপ ডেলিভারির সময়; তাই COD-তে ঐ ধাপ হালকা দেখাই */
          if (i === 1 && o.payment_method === "cod" && idx < 1) cls = "skip";
          return '<li class="' + cls + '"><span class="dot"></span>' + esc(s) + "</li>";
        }).join("") + "</ol>";
      var items = o.items.map(function (i) {
        return '<div class="sum-item"><span>' + esc(i.name) + " <small>(" + bn(i.size) + " " + esc(i.unit || "") + " × " + bn(i.qty) + ")</small></span><strong>" + B.money(i.total) + "</strong></div>";
      }).join("");
      out.innerHTML =
        '<div class="track-card"><h2>অর্ডার ' + esc(o.order_id) + "</h2>" +
        '<p class="muted">অর্ডারের সময়: ' + esc(fmtDate(o.created_at)) + " • সর্বশেষ আপডেট: " + esc(fmtDate(o.updated_at)) + "</p>" +
        '<p class="status-now">' + esc(STATUS[o.order_status] || o.order_status) + "</p>" + tl +
        '<div class="sum-row"><span>পেমেন্ট পদ্ধতি</span><strong>' + esc(B.payLabel(o.payment_method)) + "</strong></div>" +
        '<div class="sum-row"><span>পেমেন্ট অবস্থা</span><strong>' + esc(PAYSTAT[o.payment_status] || o.payment_status) + "</strong></div>" +
        "<hr>" + items +
        '<div class="sum-row"><span>পণ্যের মূল্য</span><strong>' + B.money(o.subtotal) + "</strong></div>" +
        '<div class="sum-row"><span>ডেলিভারি চার্জ</span><strong>' + delText(Number(o.delivery), o.delivery_pending) + "</strong></div>" +
        '<div class="sum-row sum-total"><span>সর্বমোট</span><strong>' + B.money(Number(o.total)) + (o.delivery_pending ? " + ডেলিভারি" : "") + "</strong></div>" +
        '<p class="hint">কোনো প্রশ্ন থাকলে <a target="_blank" rel="noopener" href="' + esc(B.waLink("আসসালামু আলাইকুম, আমার অর্ডার নম্বর " + o.order_id + " সম্পর্কে জানতে চাই।")) + '">WhatsApp-এ জানান</a>।</p></div>';
      try { out.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
    }
  }

  /* ============================ সাধারণ প্রশ্ন ============================ */
  function pageFaq() {
    var list = CFG.faqs || [];
    $("#faqList").innerHTML = list.length
      ? list.map(function (f) {
          return '<details class="faq"><summary>' + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
        }).join("")
      : '<p class="empty">শীঘ্রই প্রশ্নোত্তর যোগ হবে।</p>';
    $("#faqWa").href = B.waLink("আসসালামু আলাইকুম, আমার একটি প্রশ্ন আছে।");
  }

  /* ============================ পছন্দের তালিকা ============================ */
  function pageWishlist() {
    var gridEl = $("#wishGrid");
    function render() {
      var ids = B.Wish.ids();
      var list = ids.map(B.getProduct).filter(Boolean);
      grid(gridEl, list, "");
      if (!list.length)
        gridEl.innerHTML = '<div class="notice" style="grid-column:1/-1"><div class="big-ico" aria-hidden="true">♡</div><h2>পছন্দের তালিকা খালি</h2><p>পণ্যের কার্ডের হৃদয় চিহ্নে চাপ দিয়ে পছন্দের পণ্য এখানে রাখুন। (তালিকাটি শুধু এই ডিভাইসে সংরক্ষিত থাকে।)</p><a class="btn" href="shop.html">পণ্য দেখুন</a></div>';
      B.Wish.refresh();
    }
    document.addEventListener("bb:wish", render);
    render();
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

  var PAGES = {
    home: pageHome, shop: pageShop, categories: pageCategories, product: pageProduct, landing: pageLanding,
    cart: pageCart, checkout: pageCheckout, success: pageSuccess, contact: pageContact, about: pageAbout,
    track: pageTrack, faq: pageFaq, wishlist: pageWishlist,
  };

  function run() {
    var page = document.body.getAttribute("data-page");
    if (PAGES[page]) PAGES[page]();
  }
  if (window.BB_READY) run();
  else document.addEventListener("bb:ready", run);
})();
