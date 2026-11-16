/* ==========================================================================
   বন্ধুর বাজার – মূল কোড (কার্ট, হেডার, ফুটার, সাহায্যকারী ফাংশন)
   সাধারণত এই ফাইল বদলানোর দরকার নেই।
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.BB_CONFIG;
  var PRODUCTS = window.BB_PRODUCTS || [];
  var CART_KEY = "bb_cart_v1";
  var ORDER_KEY = "bb_last_order_v1";

  /* ---------------- ছোট সাহায্যকারী ---------------- */
  var BN = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  function toBn(n) {
    return String(n).replace(/[0-9]/g, function (d) {
      return BN[+d];
    });
  }
  function money(n) {
    return CFG.currency + " " + toBn(Math.round(n).toLocaleString("en-US"));
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function param(name) {
    try {
      return new URLSearchParams(window.location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }
  function store(key, val) {
    try {
      if (val === undefined) {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
      if (val === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      /* প্রাইভেট মোডে LocalStorage বন্ধ থাকতে পারে */
      return null;
    }
  }

  /* ---------------- পণ্য ---------------- */
  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function getCategory(id) {
    for (var i = 0; i < CFG.categories.length; i++) if (CFG.categories[i].id === id) return CFG.categories[i];
    return { id: id, name: id, icon: "🛒", desc: "" };
  }
  function sizesOf(p) {
    return p.sizes && p.sizes.length ? p.sizes : [1];
  }
  function sizeLabel(p, size) {
    var unit = p.unit || "কেজি";
    if (unit === "কেজি") {
      if (size < 1) return toBn(Math.round(size * 1000)) + " গ্রাম";
      return toBn(size) + " কেজি";
    }
    return toBn(size) + " " + unit;
  }
  function priceFor(p, size) {
    return Math.round(p.price * size);
  }
  /* কার্ড ও সর্টের জন্য ডিফল্ট দাম (১ কেজি/১ ইউনিট) */
  function basePriceLabel(p) {
    return money(p.price) + " / " + (p.unit || "কেজি");
  }

  /* ---------------- ছবি (না থাকলে প্লেসহোল্ডার) ---------------- */
  function placeholder(p) {
    var cat = getCategory(p.category);
    var name = p.name.length > 22 ? p.name.slice(0, 21) + "…" : p.name;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#FFF9ED"/><stop offset="1" stop-color="#F6E3B4"/></linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#g)"/>' +
      '<text x="200" y="215" font-size="130" text-anchor="middle">' + cat.icon + "</text>" +
      '<text x="200" y="310" font-size="26" text-anchor="middle" fill="#14532D" font-family="sans-serif">' +
      esc(name) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function imgTag(p, cls) {
    return (
      '<img class="' + (cls || "") + '" src="' + esc(p.image || "") + '" alt="' + esc(p.name) +
      '" loading="lazy" data-ph="' + esc(p.id) + '">'
    );
  }
  /* ছবি লোড না হলে প্লেসহোল্ডার বসাও */
  document.addEventListener(
    "error",
    function (e) {
      var t = e.target;
      if (t && t.tagName === "IMG" && t.dataset && t.dataset.ph && !t.dataset.phDone) {
        var p = getProduct(t.dataset.ph);
        if (p) {
          t.dataset.phDone = "1";
          t.src = placeholder(p);
        }
      }
    },
    true
  );

  /* ---------------- কার্ট ---------------- */
  var Cart = {
    items: function () {
      var raw = store(CART_KEY);
      if (!Array.isArray(raw)) return [];
      /* মুছে ফেলা পণ্য বা ভুল তথ্য বাদ দাও */
      return raw.filter(function (it) {
        return it && getProduct(it.id) && it.qty > 0 && sizesOf(getProduct(it.id)).indexOf(it.size) !== -1;
      });
    },
    save: function (items) {
      store(CART_KEY, items);
      Cart.refreshBadge();
      document.dispatchEvent(new CustomEvent("bb:cart"));
    },
    add: function (id, size, qty) {
      var p = getProduct(id);
      if (!p || p.inStock === false) return false;
      size = Number(size);
      qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
      var items = Cart.items();
      var found = false;
      items.forEach(function (it) {
        if (it.id === id && it.size === size) {
          it.qty = Math.min(99, it.qty + qty);
          found = true;
        }
      });
      if (!found) items.push({ id: id, size: size, qty: qty });
      Cart.save(items);
      return true;
    },
    setQty: function (id, size, qty) {
      var items = Cart.items();
      items = items
        .map(function (it) {
          if (it.id === id && it.size === size) it.qty = Math.max(0, Math.min(99, qty));
          return it;
        })
        .filter(function (it) {
          return it.qty > 0;
        });
      Cart.save(items);
    },
    remove: function (id, size) {
      Cart.save(
        Cart.items().filter(function (it) {
          return !(it.id === id && it.size === size);
        })
      );
    },
    clear: function () {
      Cart.save([]);
    },
    count: function () {
      return Cart.items().reduce(function (s, it) {
        return s + it.qty;
      }, 0);
    },
    /* লাইন আইটেমসহ বিস্তারিত */
    lines: function () {
      return Cart.items().map(function (it) {
        var p = getProduct(it.id);
        var unitPrice = priceFor(p, it.size);
        return { product: p, size: it.size, qty: it.qty, unitPrice: unitPrice, total: unitPrice * it.qty };
      });
    },
    subtotal: function () {
      return Cart.lines().reduce(function (s, l) {
        return s + l.total;
      }, 0);
    },
    refreshBadge: function () {
      var n = Cart.count();
      var els = document.querySelectorAll("[data-cart-count]");
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = toBn(n);
        els[i].hidden = n === 0;
      }
    },
  };

  /* ---------------- ডেলিভারি ও WhatsApp ---------------- */
  function deliveryCharge(district, subtotal) {
    var d = CFG.delivery;
    if (d.freeAbove > 0 && subtotal >= d.freeAbove) return 0;
    if (!district) return d.outsideCharge;
    return district === d.insideDistrict ? d.insideCharge : d.outsideCharge;
  }
  function waLink(text) {
    return "https://wa.me/" + CFG.whatsappNumber + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function buildOrderMessage(order) {
    var line = "━━━━━━━━━━━━━━";
    var msg = [];
    msg.push("🛒 *নতুন অর্ডার – " + CFG.siteName + "*");
    if (order.id) msg.push("🧾 *অর্ডার নম্বর:* " + toBn(order.id));
    msg.push(line);
    msg.push("👤 *নাম:* " + order.name);
    msg.push("📞 *মোবাইল:* " + toBn(order.phone));
    msg.push("📍 *ঠিকানা:* " + order.address);
    msg.push("🏘️ *উপজেলা:* " + order.upazila);
    msg.push("🗺️ *জেলা:* " + order.district);
    msg.push(line);
    msg.push("📦 *অর্ডারকৃত পণ্য:*");
    order.items.forEach(function (it, i) {
      msg.push(
        toBn(i + 1) + ". " + it.name + " (" + it.sizeLabel + ") × " + toBn(it.qty) +
          "\n    " + money(it.unitPrice) + " × " + toBn(it.qty) + " = " + money(it.total)
      );
    });
    msg.push(line);
    msg.push("পণ্যের মূল্য: " + money(order.subtotal));
    msg.push("ডেলিভারি চার্জ: " + (order.delivery === 0 ? "ফ্রি" : money(order.delivery)));
    msg.push("💰 *সর্বমোট: " + money(order.total) + "*");
    if (order.note) {
      msg.push(line);
      msg.push("📝 *নোট:* " + order.note);
    }
    msg.push(line);
    msg.push("অর্ডারটি কনফার্ম করার অনুরোধ রইল। ধন্যবাদ! 🙏");
    return msg.join("\n");
  }
  function buildSingleProductMessage(p, size, qty) {
    var total = priceFor(p, size) * qty;
    return [
      "আসসালামু আলাইকুম, আমি " + CFG.siteName + " থেকে অর্ডার করতে চাই।",
      "",
      "📦 পণ্য: " + p.name,
      "⚖️ পরিমাণ: " + sizeLabel(p, size) + " × " + toBn(qty),
      "💰 মূল্য: " + money(total) + " (ডেলিভারি চার্জ আলাদা)",
      "",
      "দয়া করে অর্ডারটি কনফার্ম করুন।",
    ].join("\n");
  }

  /* ---------------- বার্তা (Toast) ---------------- */
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById("bb-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bb-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2200);
  }

  /* ---------------- SEO / Meta ---------------- */
  function setMeta(opts) {
    function set(sel, attr, val) {
      var el = document.querySelector(sel);
      if (el && val) el.setAttribute(attr, val);
    }
    if (opts.title) {
      document.title = opts.title;
      set('meta[property="og:title"]', "content", opts.title);
    }
    if (opts.description) {
      set('meta[name="description"]', "content", opts.description);
      set('meta[property="og:description"]', "content", opts.description);
    }
    if (opts.image) set('meta[property="og:image"]', "content", opts.image);
  }

  /* ---------------- আইকন (SVG) ---------------- */
  var ICON = {
    fb: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8c-.3 0-1.3-.2-2.4-.2-2.5 0-4.1 1.5-4.1 4.2v2.7H7.6v3.3h2.8V22h3.1z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.5-.7-2.4-1.3-3.4-2.9-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.4-1 2.3.1 1.1.5 2.1 1.2 3 1.4 1.8 3 3 5.2 3.8.7.2 1.2.3 1.7.2.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 11.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 7H6"/></svg>',
  };

  /* ---------------- হেডার / ফুটার ---------------- */
  var NAV = [
    { href: "index.html", label: "হোম", page: "home" },
    { href: "shop.html", label: "শপ", page: "shop" },
    { href: "categories.html", label: "ক্যাটাগরি", page: "categories" },
    { href: "about.html", label: "আমাদের সম্পর্কে", page: "about" },
    { href: "contact.html", label: "যোগাযোগ", page: "contact" },
  ];

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var cur = document.body.getAttribute("data-page");
    var nav = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.page === cur ? ' class="active" aria-current="page"' : "") + ">" + n.label + "</a>";
    }).join("");
    host.innerHTML =
      '<div class="topbar"><div class="container">🚚 সারা বাংলাদেশে ডেলিভারি &nbsp;•&nbsp; ' + esc(CFG.slogan) + "</div></div>" +
      '<div class="header-main"><div class="container header-inner">' +
      '<button class="menu-btn" id="menuBtn" aria-label="মেনু খুলুন" aria-expanded="false" aria-controls="mainNav"><span></span><span></span><span></span></button>' +
      '<a class="brand" href="index.html" aria-label="' + esc(CFG.siteName) + ' – হোম">' +
      '<img src="' + esc(CFG.logo) + '" alt="' + esc(CFG.siteName) + ' লোগো" width="44" height="44">' +
      (CFG.showNameBesideLogo ? '<span class="brand-name">' + esc(CFG.siteName) + "</span>" : "") +
      "</a>" +
      '<nav class="main-nav" id="mainNav" aria-label="প্রধান মেনু">' + nav + "</nav>" +
      '<div class="header-actions">' +
      '<a class="icon-btn" href="' + esc(CFG.facebookUrl) + '" target="_blank" rel="noopener" aria-label="Facebook পেজ">' + ICON.fb + "</a>" +
      '<a class="icon-btn" href="' + waLink("") + '" target="_blank" rel="noopener" aria-label="WhatsApp-এ যোগাযোগ">' + ICON.wa + "</a>" +
      '<a class="icon-btn cart-btn" href="cart.html" aria-label="কার্ট">' + ICON.cart + '<span class="badge" data-cart-count hidden>০</span></a>' +
      "</div></div></div>";

    var btn = document.getElementById("menuBtn");
    var navEl = document.getElementById("mainNav");
    btn.addEventListener("click", function () {
      var open = navEl.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    var links = NAV.map(function (n) {
      return '<li><a href="' + n.href + '">' + n.label + "</a></li>";
    }).join("");
    var cats = CFG.categories
      .map(function (c) {
        return '<li><a href="shop.html?cat=' + encodeURIComponent(c.id) + '">' + esc(c.name) + "</a></li>";
      })
      .join("");
    host.innerHTML =
      '<div class="container footer-grid">' +
      '<div><div class="footer-brand"><img src="' + esc(CFG.logo) + '" alt="" width="40" height="40"><strong>' + esc(CFG.siteName) + "</strong></div>" +
      "<p>" + esc(CFG.slogan) + "</p><p>" + esc(CFG.delivery.note) + "</p>" +
      '<div class="footer-social">' +
      '<a class="icon-btn" href="' + esc(CFG.facebookUrl) + '" target="_blank" rel="noopener" aria-label="Facebook পেজ">' + ICON.fb + "</a>" +
      '<a class="icon-btn" href="' + waLink("") + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + ICON.wa + "</a></div></div>" +
      '<div><h4>দ্রুত লিংক</h4><ul>' + links + '<li><a href="cart.html">কার্ট</a></li><li><a href="checkout.html">চেকআউট</a></li></ul></div>' +
      '<div><h4>ক্যাটাগরি</h4><ul>' + cats + "</ul></div>" +
      '<div><h4>যোগাযোগ</h4><ul>' +
      '<li>WhatsApp: <a href="' + waLink("") + '" target="_blank" rel="noopener">' + toBn(CFG.whatsappDisplay) + "</a></li>" +
      '<li>Facebook: <a href="' + esc(CFG.facebookUrl) + '" target="_blank" rel="noopener">' + esc(CFG.facebookName) + "</a></li></ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><div class="container">© ' + toBn(new Date().getFullYear()) + " " + esc(CFG.siteName) + " (" + esc(CFG.siteNameEn) + "). সর্বস্বত্ব সংরক্ষিত।</div></div>";

    /* ভাসমান WhatsApp বাটন */
    if (!document.getElementById("waFloat")) {
      var a = document.createElement("a");
      a.id = "waFloat";
      a.className = "wa-float";
      a.href = waLink("আসসালামু আলাইকুম, আমি " + CFG.siteName + " থেকে কিছু জানতে চাই।");
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", "WhatsApp-এ মেসেজ করুন");
      a.innerHTML = ICON.wa.replace('width="20" height="20"', 'width="30" height="30"');
      document.body.appendChild(a);
    }
  }

  /* ---------------- পণ্য কার্ড ---------------- */
  function productCard(p) {
    var defSize = sizesOf(p)[sizesOf(p).length - 1];
    var out = p.inStock === false;
    var badges = "";
    if (out) badges += '<span class="tag tag-out">স্টক নেই</span>';
    else {
      if (p.isNew) badges += '<span class="tag tag-new">নতুন</span>';
      if (p.popular) badges += '<span class="tag tag-pop">জনপ্রিয়</span>';
    }
    return (
      '<article class="card product-card">' +
      '<a class="card-img" href="product.html?id=' + encodeURIComponent(p.id) + '" aria-label="' + esc(p.name) + ' বিস্তারিত">' +
      imgTag(p) + '<div class="tags">' + badges + "</div></a>" +
      '<div class="card-body">' +
      '<div class="card-cat">' + esc(getCategory(p.category).name) + "</div>" +
      '<h3 class="card-title"><a href="product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a></h3>" +
      '<p class="card-short">' + esc(p.short || "") + "</p>" +
      '<div class="card-price">' + basePriceLabel(p) + "</div>" +
      '<div class="card-actions">' +
      '<a class="btn btn-outline btn-sm" href="product.html?id=' + encodeURIComponent(p.id) + '">বিস্তারিত</a>' +
      (out
        ? '<button class="btn btn-sm" disabled>স্টক নেই</button>'
        : '<button class="btn btn-sm" data-add="' + esc(p.id) + '" data-size="' + defSize + '">কার্টে রাখুন</button>') +
      "</div>" +
      (out
        ? ""
        : '<a class="wa-link" target="_blank" rel="noopener" href="' + waLink(buildSingleProductMessage(p, defSize, 1)) + '">' + ICON.wa + " WhatsApp-এ অর্ডার</a>") +
      "</div></article>"
    );
  }

  /* কার্ড বা অন্য জায়গার "data-add" বাটনের ক্লিক */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-add]");
    if (!btn || btn.hasAttribute("data-add-custom")) return;
    var p = getProduct(btn.getAttribute("data-add"));
    var size = Number(btn.getAttribute("data-size"));
    if (p && Cart.add(p.id, size, 1)) toast("✔ " + p.name + " (" + sizeLabel(p, size) + ") কার্টে যোগ হয়েছে");
  });

  /* ---------------- চালু করো ---------------- */
  function init() {
    renderHeader();
    renderFooter();
    /* data-wa / data-fb দেওয়া সব লিংকে config.js-এর নম্বর ও Facebook লিংক বসাও */
    Array.prototype.forEach.call(document.querySelectorAll("[data-wa]"), function (a) {
      a.href = waLink("");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-fb]"), function (a) {
      a.href = CFG.facebookUrl;
    });
    Cart.refreshBadge();
    document.addEventListener("bb:cart", Cart.refreshBadge);
    window.addEventListener("storage", Cart.refreshBadge);
    window.BB_READY = true;
    document.dispatchEvent(new CustomEvent("bb:ready"));
  }

  window.BB = {
    CFG: CFG,
    PRODUCTS: PRODUCTS,
    ORDER_KEY: ORDER_KEY,
    toBn: toBn,
    money: money,
    esc: esc,
    param: param,
    store: store,
    getProduct: getProduct,
    getCategory: getCategory,
    sizesOf: sizesOf,
    sizeLabel: sizeLabel,
    priceFor: priceFor,
    basePriceLabel: basePriceLabel,
    placeholder: placeholder,
    imgTag: imgTag,
    Cart: Cart,
    deliveryCharge: deliveryCharge,
    waLink: waLink,
    buildOrderMessage: buildOrderMessage,
    buildSingleProductMessage: buildSingleProductMessage,
    toast: toast,
    setMeta: setMeta,
    ICON: ICON,
    productCard: productCard,
    init: init,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
