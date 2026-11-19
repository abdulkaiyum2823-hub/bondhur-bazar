/* ==========================================================================
   বন্ধুর বাজার – অ্যাডমিন (মূল অংশ: লগইন, ডাটাবেস/স্টোরেজ API, ZIP, CSV/XLSX)
   - শুধু পাবলিক publishable key ব্যবহার হয়। পাসওয়ার্ড/গোপন key কোথাও সংরক্ষিত নয়।
   - প্রবেশাধিকার ডাটাবেসই ঠিক করে (is_admin() + RLS); এই পাতা শুধু ইন্টারফেস।
   ========================================================================== */
(function () {
  "use strict";
  var S = window.BB_SUPABASE || {};
  var BASE = (S.url || "").replace(/\/+$/, "");
  var KEY = S.anonKey || "";
  var SKEY = "bb_admin_sess_v1";
  var BUCKET = "product-images";
  var A = (window.BBADMIN = {});

  /* ---------- ছোট সহায়ক ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var BN = "০১২৩৪৫৬৭৮৯";
  function bn(x) { return String(x).replace(/[0-9]/g, function (d) { return BN[+d]; }); }
  function taka(n) { return "৳ " + bn(Math.round(Number(n) || 0).toLocaleString("en-US")); }
  function dt(s) {
    try { return bn(new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })); }
    catch (e) { return s; }
  }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 3200);
  }
  function download(name, blobOrParts, type) {
    var b = blobOrParts instanceof Blob ? blobOrParts : new Blob(blobOrParts, { type: type || "application/octet-stream" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function stamp() {
    var d = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
    return d.slice(0, 10) + "_" + d.slice(11, 16).replace(":", "-");
  }
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- সেশন ---------- */
  var sess = null;
  function loadSess() { try { sess = JSON.parse(sessionStorage.getItem(SKEY) || "null"); } catch (e) { sess = null; } }
  function saveSess() { try { sessionStorage.setItem(SKEY, JSON.stringify(sess)); } catch (e) {} }
  function clearSess() { sess = null; try { sessionStorage.removeItem(SKEY); } catch (e) {} }

  function rawFetch(url, opts, ms) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms || 30000) : null;
    if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) { if (t) clearTimeout(t); return r; }, function (e) { if (t) clearTimeout(t); throw e; });
  }
  function hdr(extra) {
    var h = { apikey: KEY };
    if (sess && sess.access) h.Authorization = "Bearer " + sess.access;
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }

  function signIn(email, password) {
    return rawFetch(BASE + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.access_token) throw new Error("login_failed");
        sess = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: (j.user && j.user.email) || email };
        saveSess();
      });
    });
  }
  function refresh() {
    if (!sess || !sess.refresh) return Promise.reject(new Error("no_session"));
    return rawFetch(BASE + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: sess.refresh }),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok || !j.access_token) { clearSess(); throw new Error("expired"); }
        sess.access = j.access_token; sess.refresh = j.refresh_token; sess.exp = Date.now() + (j.expires_in || 3600) * 1000; saveSess();
      });
    });
  }
  function signOut() {
    var p = sess ? rawFetch(BASE + "/auth/v1/logout", { method: "POST", headers: hdr() }, 8000).catch(function () {}) : Promise.resolve();
    clearSess();
    return p;
  }

  /* টোকেন মেয়াদ কাছাকাছি হলে আগেই নবায়ন; ৪০১ পেলে একবার নবায়ন করে আবার চেষ্টা */
  function authed(url, opts, ms) {
    var ensure = sess && sess.exp - Date.now() < 60000 ? refresh() : Promise.resolve();
    return ensure.then(function () {
      opts.headers = hdr(opts.headers);
      return rawFetch(url, opts, ms);
    }).then(function (r) {
      if (r.status !== 401) return r;
      return refresh().then(function () { opts.headers = hdr(opts.headers); return rawFetch(url, opts, ms); });
    });
  }
  function jsonOrText(r) { return r.text().then(function (t) { try { return t ? JSON.parse(t) : null; } catch (e) { return t; } }); }
  function failMsg(r, j) {
    var m = j && (j.message || j.error_description || j.error || j.hint) || "";
    if (r.status === 401 || r.status === 403) return "অনুমতি নেই বা সেশন শেষ। আবার লগইন করুন। " + m;
    if (/violates foreign key/i.test(m)) return "এটি অন্য তথ্যে ব্যবহৃত হচ্ছে (যেমন ক্যাটাগরিতে পণ্য আছে), তাই মোছা যাচ্ছে না।";
    if (/duplicate key/i.test(m)) return "এই আইডি/নাম আগে থেকেই আছে।";
    if (/violates check constraint/i.test(m)) return "কোনো মান নিয়ম মানছে না (দাম, আইডি বা দৈর্ঘ্য দেখুন): " + m;
    return "ত্রুটি (" + r.status + "): " + m;
  }
  function db(method, path, body, extraHeaders) {
    var h = { "Content-Type": "application/json" };
    for (var k in extraHeaders || {}) h[k] = extraHeaders[k];
    return authed(BASE + "/rest/v1/" + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body) }).then(function (r) {
      return jsonOrText(r).then(function (j) {
        if (!r.ok) throw new Error(failMsg(r, j));
        return j;
      });
    });
  }
  A.select = function (path) { return db("GET", path); };
  /* সব সারি পড়া (পাতায় পাতায়) */
  A.selectAll = function (table, query) {
    var out = [], size = 1000;
    function page(from) {
      return authed(BASE + "/rest/v1/" + table + "?" + (query || "select=*"), { method: "GET", headers: { Range: from + "-" + (from + size - 1), "Range-Unit": "items" } })
        .then(function (r) { return jsonOrText(r).then(function (j) {
          if (!r.ok) throw new Error(failMsg(r, j));
          out = out.concat(j || []);
          return (j || []).length === size ? page(from + size) : out;
        }); });
    }
    return page(0);
  };
  A.insert = function (table, row) { return db("POST", table, row, { Prefer: "return=representation" }); };
  A.upsert = function (table, rows, conflict) {
    return db("POST", table + (conflict ? "?on_conflict=" + conflict : ""), rows, { Prefer: "resolution=merge-duplicates,return=minimal" });
  };
  A.patch = function (table, filter, body) { return db("PATCH", table + "?" + filter, body, { Prefer: "return=representation" }); };
  A.del = function (table, filter) { return db("DELETE", table + "?" + filter, null, { Prefer: "return=representation" }); };
  A.rpc = function (name, body) { return db("POST", "rpc/" + name, body || {}); };

  /* ---------- Storage (ছবি) ---------- */
  A.publicUrl = function (name) { return BASE + "/storage/v1/object/public/" + BUCKET + "/" + name.split("/").map(encodeURIComponent).join("/"); };
  A.upload = function (name, blob) {
    return authed(BASE + "/storage/v1/object/" + BUCKET + "/" + name.split("/").map(encodeURIComponent).join("/"), {
      method: "POST", headers: { "Content-Type": blob.type || "application/octet-stream", "x-upsert": "true", "cache-control": "31536000" }, body: blob,
    }, 90000).then(function (r) {
      return jsonOrText(r).then(function (j) { if (!r.ok) throw new Error("ছবি আপলোড ব্যর্থ: " + (j && (j.message || j.error) || r.status)); return A.publicUrl(name); });
    });
  };
  A.listImages = function () {
    var out = [];
    function page(prefix, offset) {
      return authed(BASE + "/storage/v1/object/list/" + BUCKET, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: prefix, limit: 100, offset: offset, sortBy: { column: "name", order: "asc" } }),
      }).then(function (r) { return jsonOrText(r).then(function (j) {
        if (!r.ok) throw new Error("ছবির তালিকা পড়া যায়নি");
        var chain = Promise.resolve();
        (j || []).forEach(function (o) {
          if (o.id === null || o.id === undefined) { chain = chain.then(function () { return page((prefix ? prefix + "/" : "") + o.name, 0); }); }
          else out.push({ name: (prefix ? prefix + "/" : "") + o.name, size: (o.metadata && o.metadata.size) || 0, type: (o.metadata && o.metadata.mimetype) || "" });
        });
        return chain.then(function () { return (j || []).length === 100 ? page(prefix, offset + 100) : null; });
      }); });
    }
    return page("", 0).then(function () { return out; });
  };
  A.deleteImage = function (name) {
    return authed(BASE + "/storage/v1/object/" + BUCKET, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [name] }) });
  };

  /* ছবি ছোট করা: সর্বোচ্চ ১৪০০px, ~৯০০KB-র নিচে (বিনামূল্যের স্টোরেজ বাঁচাতে) */
  A.compress = function (file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("শুধু JPG, PNG বা WebP ছবি দিন।"));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1400, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
        var ctx = c.getContext("2d");
        var keepAlpha = file.type === "image/png";
        if (!keepAlpha) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var type = keepAlpha ? "image/webp" : "image/jpeg", q = 0.86, LIMIT = 900 * 1024;
        (function attempt() {
          c.toBlob(function (b) {
            if (!b) return reject(new Error("ছবি প্রস্তুত করা যায়নি"));
            if (b.size > LIMIT && q > 0.4) { q -= 0.12; return attempt(); }
            if (b.size > 1048000) return reject(new Error("ছবি অনেক বড়; ছোট ছবি দিন।"));
            resolve(b);
          }, type, q);
        })();
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("ছবি পড়া যায়নি")); };
      img.src = url;
    });
  };
  A.imageName = function (prefix, blob) { return prefix + "/" + uid() + (blob.type === "image/webp" ? ".webp" : blob.type === "image/png" ? ".png" : ".jpg"); };

  /* ---------- ZIP (কম্প্রেশন ছাড়া "stored") লেখা ও পড়া ---------- */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xffffffff; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function u16(n) { return [n & 255, (n >> 8) & 255]; }
  function u32(n) { return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255]; }
  /* files: [{name, data:Uint8Array}] → Blob */
  A.zip = function (files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      var lh = new Uint8Array([0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(name.length), u16(0)));
      parts.push(lh, name, f.data);
      central.push({ name: name, crc: crc, sz: sz, off: offset });
      offset += lh.length + name.length + sz;
    });
    var cdStart = offset, cdSize = 0;
    central.forEach(function (c) {
      var h = new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c.crc), u32(c.sz), u32(c.sz), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)));
      parts.push(h, c.name); cdSize += h.length + c.name.length;
    });
    parts.push(new Uint8Array([0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(central.length), u16(central.length), u32(cdSize), u32(cdStart), u16(0))));
    return new Blob(parts, { type: "application/zip" });
  };
  /* ZIP → Promise<[{name, data:Uint8Array}]> (stored ও deflate সমর্থিত) */
  A.unzip = function (buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf), dec = new TextDecoder();
    var i = u8.length - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) return Promise.reject(new Error("এটি বৈধ ZIP ফাইল নয়"));
    var n = dv.getUint16(i + 10, true), p = dv.getUint32(i + 16, true), jobs = [];
    for (var k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) return Promise.reject(new Error("ZIP নষ্ট"));
      var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      var ln = dv.getUint16(lo + 26, true), le = dv.getUint16(lo + 28, true), ds = lo + 30 + ln + le;
      jobs.push({ name: name, method: method, raw: u8.subarray(ds, ds + csz) });
      p += 46 + nl + el + cl;
    }
    return Promise.all(jobs.map(function (j) {
      if (j.method === 0) return { name: j.name, data: j.raw };
      if (j.method === 8 && typeof DecompressionStream !== "undefined") {
        var ds = new DecompressionStream("deflate-raw");
        return new Response(new Blob([j.raw]).stream().pipeThrough(ds)).arrayBuffer().then(function (b) { return { name: j.name, data: new Uint8Array(b) }; });
      }
      throw new Error("এই ZIP-এর ধরন সমর্থিত নয়");
    }));
  };

  /* ---------- CSV ও XLSX ---------- */
  function cellText(v) {
    var s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; /* স্প্রেডশিটে ফর্মুলা ইনজেকশন ঠেকাতে */
  }
  A.csv = function (header, rows) {
    function q(v) { var s = cellText(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    return "﻿" + [header].concat(rows).map(function (r) { return r.map(q).join(","); }).join("\r\n");
  };
  function colName(i) { var s = ""; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function x(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ""); }
  /* সত্যিকারের .xlsx (Excel/Google Sheets/LibreOffice-এ খোলে) */
  A.xlsx = function (sheetName, header, rows) {
    var all = [header].concat(rows), sheetRows = all.map(function (r, ri) {
      return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
        var ref = colName(ci) + (ri + 1);
        if (typeof v === "number" && isFinite(v) && ri > 0) return '<c r="' + ref + '"><v>' + v + "</v></c>";
        return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + x(ri === 0 ? v : cellText(v)) + "</t></is></c>";
      }).join("") + "</row>";
    }).join("");
    var enc = new TextEncoder();
    function f(name, text) { return { name: name, data: enc.encode(text) }; }
    var head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return A.zip([
      f("[Content_Types].xml", head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
      f("_rels/.rels", head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      f("xl/workbook.xml", head + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + x(sheetName.slice(0, 30)) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      f("xl/_rels/workbook.xml.rels", head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
      f("xl/worksheets/sheet1.xml", head + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheetRows + "</sheetData></worksheet>"),
    ]).slice(0, undefined, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  };

  A.esc = esc; A.$ = $; A.$$ = $$; A.bn = bn; A.taka = taka; A.dt = dt; A.toast = toast; A.download = download;
  A.stamp = stamp; A.slug = slug; A.uid = uid; A.BASE = BASE; A.BUCKET = BUCKET; A.crc32 = crc32;
  A.getEmail = function () { return sess && sess.email; };

  /* ---------- লগইন ও কাঠামো ---------- */
  var app = $("#app"), idleT = null;
  function idleReset() {
    clearTimeout(idleT);
    idleT = setTimeout(function () { signOut().then(function () { showLogin("নিরাপত্তার জন্য ৩০ মিনিট নিষ্ক্রিয় থাকায় লগআউট হয়েছে।"); }); }, 30 * 60 * 1000);
  }
  ["click", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { if (sess) idleReset(); }, { passive: true }); });

  function showLogin(msg) {
    clearTimeout(idleT);
    app.innerHTML = '<div class="login"><div class="card"><h2>অ্যাডমিন লগইন</h2><p class="muted">বন্ধুর বাজার – শুধু অনুমোদিত অ্যাডমিনের জন্য।</p>' +
      (msg ? '<div class="warnb">' + esc(msg) + "</div>" : "") +
      '<form id="lf" autocomplete="on"><label for="em">ইমেইল</label><input id="em" type="email" autocomplete="username" required>' +
      '<label for="pw">পাসওয়ার্ড</label><input id="pw" type="password" autocomplete="current-password" required>' +
      '<div id="lerr" class="err" hidden></div><p><button class="btn" id="lb" type="submit">লগইন</button></p></form>' +
      '<p class="muted">পাসওয়ার্ড এই ওয়েবসাইটের কোডে বা কোথাও সংরক্ষিত হয় না।</p></div></div>';
    $("#lf").addEventListener("submit", function (e) {
      e.preventDefault();
      var b = $("#lb"), er = $("#lerr"); b.disabled = true; er.hidden = true; b.textContent = "অপেক্ষা করুন…";
      signIn($("#em").value.trim().toLowerCase(), $("#pw").value).then(function () {
        return A.rpc("is_admin").then(function (ok) {
          if (ok !== true) { return signOut().then(function () { throw new Error("denied"); }); }
        });
      }).then(function () { $("#pw").value = ""; start(); }).catch(function (err) {
        b.disabled = false; b.textContent = "লগইন"; $("#pw").value = "";
        er.textContent = err.message === "denied" ? "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।" : "ইমেইল বা পাসওয়ার্ড সঠিক নয়, অথবা নেটওয়ার্ক সমস্যা।";
        er.hidden = false;
      });
    });
  }

  function start() {
    idleReset();
    app.innerHTML = '<div class="a-head"><b>বন্ধুর বাজার – অ্যাডমিন<small>' + esc(sess.email) + '</small></b><a class="btn sm gold" href="index.html" target="_blank" rel="noopener">সাইট</a> <button class="btn sm sec" id="lo" style="background:#fff">লগআউট</button></div>' +
      '<nav class="a-tabs" id="tabs"></nav><main class="a-main" id="panel"></main>';
    $("#lo").addEventListener("click", function () { signOut().then(function () { showLogin("লগআউট হয়েছে।"); }); });
    A.startTabs($("#tabs"), $("#panel"));
  }
  A.relogin = function (m) { signOut().then(function () { showLogin(m); }); };

  function boot() {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(BASE) || KEY.length < 20) { app.innerHTML = '<p class="err" style="margin:20px">Supabase সংযোগ সেট করা নেই।</p>'; return; }
    loadSess();
    if (!sess) return showLogin();
    A.rpc("is_admin").then(function (ok) { if (ok === true) start(); else { clearSess(); showLogin(); } })
      .catch(function () { clearSess(); showLogin(); });
  }
  window.addEventListener("DOMContentLoaded", function () { if (A.startTabs) boot(); else window.addEventListener("load", boot); });
})();
