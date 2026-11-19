/* ==========================================================================
   বন্ধুর বাজার – Supabase সংযোগ (কোনো বাইরের লাইব্রেরি ছাড়া, শুধু fetch)
   এখানে শুধু পাবলিক "anon" key ব্যবহার হয়। গোপন কোনো key এখানে নেই।
   ========================================================================== */
(function () {
  "use strict";
  var S = window.BB_SUPABASE || {};
  var CFG = window.BB_CONFIG;
  var CACHE_KEY = "bb_catalog_v1";
  var CACHE_MS = 2 * 60 * 1000;

  var configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(S.url || "") && (S.anonKey || "").length > 20;
  var base = configured ? S.url.replace(/\/+$/, "") : "";

  function headers(extra) {
    var h = { apikey: S.anonKey, "Content-Type": "application/json" };
    /* পুরনো anon key (JWT, "eyJ...") হলে Bearer লাগে; নতুন sb_publishable_ key JWT নয়, তাই শুধু apikey */
    if (/^eyJ/.test(S.anonKey || "")) h.Authorization = "Bearer " + S.anonKey;
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }

  function timeoutFetch(url, opts, ms) {
    if (typeof AbortController === "undefined") return fetch(url, opts);
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, ms || 15000);
    opts.signal = ctl.signal;
    return fetch(url, opts).then(
      function (r) { clearTimeout(t); return r; },
      function (e) { clearTimeout(t); throw e; }
    );
  }

  function get(path) {
    return timeoutFetch(base + "/rest/v1/" + path, { headers: headers() }, 12000).then(function (r) {
      if (!r.ok) throw new Error("http_" + r.status);
      return r.json();
    });
  }

  /* RPC: ব্যর্থ হলে { ok:false, code:"..." } ফেরত দেয় (code = "bb:" ছাড়া অংশ) */
  function rpc(name, body) {
    if (!configured) return Promise.resolve({ ok: false, code: "not_configured" });
    return timeoutFetch(base + "/rest/v1/rpc/" + name, { method: "POST", headers: headers(), body: JSON.stringify(body || {}) }, 20000)
      .then(function (r) {
        return r.json().then(
          function (j) { return { status: r.status, json: j }; },
          function () { return { status: r.status, json: null }; }
        );
      })
      .then(function (x) {
        if (x.status >= 200 && x.status < 300) return { ok: true, data: x.json };
        var msg = (x.json && (x.json.message || x.json.error)) || "";
        var m = /bb:([a-z_]+)(?::\s*(.*))?/.exec(msg);
        return { ok: false, code: m ? m[1] : "server", arg: m && m[2] ? m[2] : "", status: x.status, detail: m ? "" : (x.status + ": " + String(msg || JSON.stringify(x.json) || "").slice(0, 160)) };
      })
      .catch(function () { return { ok: false, code: "network" }; });
  }

  /* ---------- ডাটাবেসের সারি → সাইটের ফরম্যাট ---------- */
  function mapProduct(r) {
    return {
      id: r.id, name: r.name, category: r.category, price: Number(r.price),
      offerPrice: r.offer_price == null ? null : Number(r.offer_price),
      unit: r.unit, sizes: (r.sizes || [1]).map(Number), image: r.image || "",
      short: r.short || "", description: r.description || "", features: r.features || [],
      popular: !!r.popular, isNew: !!r.is_new, inStock: r.in_stock !== false,
    };
  }

  function applyCatalog(c) {
    var P = window.BB_PRODUCTS;
    if (c.products && c.products.length) {
      P.length = 0;
      c.products.forEach(function (r) { P.push(mapProduct(r)); });
    }
    if (c.categories && c.categories.length)
      CFG.categories = c.categories.map(function (r) {
        return { id: r.id, name: r.name, icon: r.icon || "", desc: r.description || "" };
      });
    if (c.slides && c.slides.length)
      CFG.heroSlides = c.slides.map(function (r) {
        return {
          image: r.image, mobileImage: r.mobile_image, title: r.title, subtitle: r.subtitle,
          buttonText: r.button_text, buttonLink: r.button_link, theme: r.theme, art: r.art,
        };
      });
    if (c.faqs) CFG.faqs = c.faqs.map(function (r) { return { q: r.question, a: r.answer }; });
    if (c.districts && c.districts.length) CFG.districts = c.districts.map(function (r) { return r.name; });
    var st = {};
    (c.settings || []).forEach(function (r) { st[r.key] = r.value; });
    if (st.delivery) {
      var d = st.delivery;
      CFG.delivery = {
        insideDistrict: d.inside_district || "ঢাকা",
        insideCharge: d.inside_charge == null || d.inside_charge === "" ? null : Number(d.inside_charge),
        outsideCharge: d.outside_charge == null || d.outside_charge === "" ? null : Number(d.outside_charge),
        freeAbove: Number(d.free_above) || 0,
        districtCharges: d.district_charges || {},
        note: CFG.delivery && CFG.delivery.note ? CFG.delivery.note : "সারা বাংলাদেশে ডেলিভারি করা হয়।",
      };
    }
    if (st.payment) {
      var p = st.payment;
      CFG.payment = {
        codEnabled: p.cod_enabled !== false, bkashEnabled: p.bkash_enabled !== false,
        bkashNumber: p.bkash_number || "01602975419", bkashType: p.bkash_type || "Personal",
        bkashMethod: p.bkash_method || "Send Money",
      };
    }
    if (st.texts) {
      if (st.texts.topbar) CFG.topbarText = st.texts.topbar;
      if (st.texts.slogan) CFG.slogan = st.texts.slogan;
    }
    if (st.contact) {
      var k = st.contact;
      if (k.whatsapp) CFG.whatsappNumber = k.whatsapp;
      if (k.whatsapp_display) CFG.whatsappDisplay = k.whatsapp_display;
      if (k.facebook_url) CFG.facebookUrl = k.facebook_url;
      if (k.facebook_name) CFG.facebookName = k.facebook_name;
      if (k.email) CFG.email = k.email;
    }
  }

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && Date.now() - o.t < CACHE_MS ? o.c : null;
    } catch (e) { return null; }
  }
  function writeCache(c) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), c: c })); } catch (e) {}
  }

  var readyPromise = null;
  /* ক্যাটালগ লোড; ব্যর্থ হলে (বা Supabase না থাকলে) config.js/products.js-এর নমুনা তথ্যই চলে */
  function ready() {
    if (readyPromise) return readyPromise;
    if (!configured) {
      CFG.dbConnected = false;
      return (readyPromise = Promise.resolve(false));
    }
    var cached = readCache();
    if (cached) {
      applyCatalog(cached);
      CFG.dbConnected = true;
      return (readyPromise = Promise.resolve(true));
    }
    readyPromise = Promise.all([
      get("products?select=*&active=eq.true&order=sort.asc,created_at.asc"),
      get("categories?select=*&active=eq.true&order=sort.asc"),
      get("slides?select=*&active=eq.true&order=sort.asc"),
      get("faqs?select=*&active=eq.true&order=sort.asc"),
      get("settings?select=key,value"),
      get("districts?select=name&order=sort.asc,name.asc"),
    ]).then(
      function (r) {
        var c = { products: r[0], categories: r[1], slides: r[2], faqs: r[3], settings: r[4], districts: r[5] };
        writeCache(c);
        applyCatalog(c);
        CFG.dbConnected = true;
        return true;
      },
      function () {
        CFG.dbConnected = false;
        return false;
      }
    );
    return readyPromise;
  }

  window.BBAPI = {
    configured: configured,
    base: base,
    anonKey: S.anonKey,
    ready: ready,
    rpc: rpc,
    get: get,
    headers: headers,
    timeoutFetch: timeoutFetch,
    clearCache: function () { try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {} },
  };
})();
