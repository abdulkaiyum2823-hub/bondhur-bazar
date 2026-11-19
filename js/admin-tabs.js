/* বন্ধুর বাজার – অ্যাডমিনের ট্যাবগুলো (অর্ডার, পণ্য, ক্যাটাগরি, স্লাইডার, FAQ, সেটিংস, রিপোর্ট, ব্যাকআপ, ব্যবহার) */
(function () {
  "use strict";
  var A = window.BBADMIN, esc = A.esc, $ = A.$, $$ = A.$$, bn = A.bn, taka = A.taka, dt = A.dt, toast = A.toast;
  var panel = null;

  var ST = { pending: "নতুন – কনফার্মেশন বাকি", payment_pending: "bKash যাচাই বাকি", paid: "পেমেন্ট নিশ্চিত", processing: "প্রস্তুত হচ্ছে", shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারি সম্পন্ন", cancelled: "বাতিল" };
  var PS = { pending: "পেমেন্ট বাকি (COD)", pending_verification: "যাচাইয়ের অপেক্ষা", paid: "পরিশোধিত", rejected: "যাচাইয়ে মেলেনি", refunded: "ফেরত" };
  var PM = { cod: "ক্যাশ অন ডেলিভারি", bkash: "bKash (Send Money)" };

  function opts(map, sel) { return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(map[k]) + "</option>"; }).join(""); }
  function badge(v, map) { return '<span class="badge b-' + esc(v) + '">' + esc(map[v] || v) + "</span>"; }
  function busy(btn, on, txt) { if (!btn) return; btn.disabled = on; if (txt) { if (on) { btn._t = btn.textContent; btn.textContent = txt; } else if (btn._t) btn.textContent = btn._t; } }
  function showErr(box, e) { box.textContent = e.message || String(e); box.hidden = false; box.className = "err"; }
  function modal(html) {
    var m = document.createElement("div"); m.className = "modal"; m.innerHTML = "<div>" + html + "</div>";
    document.body.appendChild(m);
    m.addEventListener("mousedown", function (e) { if (e.target === m && !m.dataset.lock) close(); });
    function close() { m.remove(); }
    m.close = close; return m;
  }
  function confirmBox(msg) { return window.confirm(msg); }

  /* ============================== ট্যাব কাঠামো ============================== */
  var TABS = [
    ["orders", "অর্ডার", tabOrders], ["products", "পণ্য", function (p) { crud(p, PRODUCTS); }],
    ["categories", "ক্যাটাগরি", function (p) { crud(p, CATEGORIES); }], ["slides", "স্লাইডার/ব্যানার", function (p) { crud(p, SLIDES); }],
    ["settings", "ডেলিভারি ও সেটিংস", tabSettings], ["faqs", "FAQ", function (p) { crud(p, FAQS); }],
    ["reports", "রিপোর্ট", tabReports], ["backup", "ব্যাকআপ/রিস্টোর", tabBackup], ["usage", "ব্যবহার ও সতর্কতা", tabUsage],
  ];
  A.startTabs = function (nav, main) {
    panel = main;
    nav.innerHTML = TABS.map(function (t) { return '<button data-t="' + t[0] + '">' + t[1] + "</button>"; }).join("");
    function go(id) {
      $$("button", nav).forEach(function (b) { b.classList.toggle("on", b.dataset.t === id); });
      try { sessionStorage.setItem("bb_admin_tab", id); } catch (e) {}
      main.innerHTML = '<p class="muted">লোড হচ্ছে…</p>';
      var t = TABS.filter(function (x) { return x[0] === id; })[0];
      try { t[2](main); } catch (e) { main.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }
    }
    nav.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) go(b.dataset.t); });
    var last = "orders"; try { last = sessionStorage.getItem("bb_admin_tab") || "orders"; } catch (e) {}
    go(TABS.some(function (t) { return t[0] === last; }) ? last : "orders");
  };
  function handleAuth(e) { if (/সেশন শেষ|অনুমতি নেই/.test(e.message || "")) A.relogin("সেশন শেষ হয়েছে, আবার লগইন করুন।"); }

  /* ============================== অর্ডার ============================== */
  var ORDERS = [];
  function itemsText(o) { return (o.items || []).map(function (i) { return i.name + " (" + i.size + " " + (i.unit || "") + " × " + i.qty + ")"; }).join("; "); }
  var ORDER_HEAD = ["Order ID", "তারিখ", "নাম", "ফোন", "জেলা", "উপজেলা", "ঠিকানা", "পণ্য", "পণ্যমূল্য", "ডেলিভারি চার্জ", "ডেলিভারি চার্জ বাকি?", "মোট", "পেমেন্ট পদ্ধতি", "bKash TrxID", "bKash প্রেরক নম্বর", "পেমেন্ট অবস্থা", "অর্ডার অবস্থা", "নোট"];
  function orderRow(o) {
    return [o.order_id, dt(o.created_at), o.name, o.phone, o.district, o.upazila, o.address, itemsText(o), Number(o.subtotal), Number(o.delivery), o.delivery_pending ? "হ্যাঁ" : "না", Number(o.total),
      PM[o.payment_method] || o.payment_method, o.bkash_txn || "", o.bkash_sender || "", PS[o.payment_status] || o.payment_status, ST[o.order_status] || o.order_status, o.note || ""];
  }
  function exportBar(prefix, getHead, getRows, sheet) {
    return '<span class="row"><button class="btn sm sec" data-x="csv">CSV</button><button class="btn sm sec" data-x="xlsx">Excel (.xlsx)</button></span>';
  }
  function bindExport(root, prefix, getHead, getRows, sheet) {
    $$("[data-x]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var h = getHead(), r = getRows();
        if (!r.length) return toast("এক্সপোর্ট করার মতো তথ্য নেই");
        if (b.dataset.x === "csv") A.download(prefix + "_" + A.stamp() + ".csv", [A.csv(h, r)], "text/csv;charset=utf-8");
        else A.download(prefix + "_" + A.stamp() + ".xlsx", A.xlsx(sheet, h, r));
      });
    });
  }

  function tabOrders(p) {
    p.innerHTML = '<div class="card"><div class="row"><h2 class="grow" style="margin:0">অর্ডার</h2><button class="btn sm sec" id="rl">রিফ্রেশ</button></div>' +
      '<div class="row"><input type="search" id="q" class="grow" placeholder="Order ID / নাম / ফোন খুঁজুন"><select id="fs" class="grow"><option value="">সব অর্ডার অবস্থা</option>' + opts(ST) + '</select><select id="fp" class="grow"><option value="">সব পেমেন্ট অবস্থা</option>' + opts(PS) + '</select></div>' +
      '<div class="row"><label class="chk" style="margin:0"><input type="checkbox" id="fd"> শুধু ডেলিভারি চার্জ বাকি</label><span class="grow"></span>' + exportBar() + '</div><div id="sum" class="muted"></div></div><div id="ol"></div>';
    var list = $("#ol", p);
    function filtered() {
      var q = $("#q", p).value.trim().toLowerCase(), s = $("#fs", p).value, ps = $("#fp", p).value, d = $("#fd", p).checked;
      return ORDERS.filter(function (o) {
        return (!s || o.order_status === s) && (!ps || o.payment_status === ps) && (!d || o.delivery_pending) &&
          (!q || (o.order_id + " " + o.name + " " + o.phone).toLowerCase().indexOf(q) >= 0);
      });
    }
    function draw() {
      var f = filtered();
      $("#sum", p).textContent = "মোট " + bn(f.length) + "টি অর্ডার দেখাচ্ছে (লোড হয়েছে " + bn(ORDERS.length) + "টি)";
      list.innerHTML = f.length ? f.map(function (o) {
        return '<div class="card ol" data-id="' + esc(o.id) + '"><div><b>' + esc(o.order_id) + "</b><br>" + esc(o.name) + " · " + esc(o.phone) + '<br><span class="muted">' + dt(o.created_at) + " · " + esc(o.district) + "</span><br>" +
          badge(o.order_status, ST) + " " + badge(o.payment_status, PS) + (o.delivery_pending ? ' <span class="badge b-pending">ডেলিভারি চার্জ বাকি</span>' : "") + '</div><div class="r"><b>' + taka(o.total) + "</b><br><span class=\"muted\">" + esc(PM[o.payment_method] || "") + "</span></div></div>";
      }).join("") : '<div class="card muted">কোনো অর্ডার নেই।</div>';
    }
    function load() {
      list.innerHTML = '<p class="muted">লোড হচ্ছে…</p>';
      return A.selectAll("orders", "select=*&order=created_at.desc").then(function (r) { ORDERS = r; draw(); }).catch(function (e) { handleAuth(e); list.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; });
    }
    ["q", "fs", "fp", "fd"].forEach(function (id) { $("#" + id, p).addEventListener("input", draw); $("#" + id, p).addEventListener("change", draw); });
    $("#rl", p).addEventListener("click", load);
    bindExport(p, "orders", function () { return ORDER_HEAD; }, function () { return filtered().map(orderRow); }, "Orders");
    list.addEventListener("click", function (e) { var c = e.target.closest(".ol"); if (c) orderModal(ORDERS.filter(function (o) { return o.id === c.dataset.id; })[0], function () { draw(); }); });
    load();
  }

  function orderModal(o, done) {
    if (!o) return;
    var items = (o.items || []).map(function (i) { return "<tr><td>" + esc(i.name) + " <span class=\"muted\">(" + esc(i.size) + " " + esc(i.unit || "") + ")</span></td><td class=\"n\">× " + bn(i.qty) + '</td><td class="n">' + taka(i.total) + "</td></tr>"; }).join("");
    var m = modal('<h2>' + esc(o.order_id) + '</h2><p class="muted">' + dt(o.created_at) + "</p>" +
      '<div class="kv"><b>নাম</b><span>' + esc(o.name) + "</span><b>মোবাইল</b><span><a href=\"tel:" + esc(o.phone) + '">' + esc(o.phone) + "</a></span><b>জেলা</b><span>" + esc(o.district) + "</span><b>উপজেলা</b><span>" + esc(o.upazila) + "</span><b>ঠিকানা</b><span>" + esc(o.address) + "</span>" +
      (o.note ? "<b>নোট</b><span>" + esc(o.note) + "</span>" : "") + "<b>পেমেন্ট</b><span>" + esc(PM[o.payment_method]) + "</span>" +
      (o.payment_method === "bkash" ? "<b>TrxID</b><span><b>" + esc(o.bkash_txn) + "</b></span><b>প্রেরক নম্বর</b><span>" + esc(o.bkash_sender) + "</span>" : "") + "</div>" +
      '<div class="tw"><table class="t" style="margin-top:10px">' + items + '<tr><td colspan="2">পণ্যমূল্য</td><td class="n">' + taka(o.subtotal) + '</td></tr><tr><td colspan="2">ডেলিভারি</td><td class="n">' + (o.delivery_pending ? "বাকি" : taka(o.delivery)) + '</td></tr><tr><td colspan="2"><b>মোট</b></td><td class="n"><b>' + taka(o.total) + "</b></td></tr></table></div>" +
      (o.payment_method === "bkash" && o.payment_status === "pending_verification" ? '<div class="warnb">bKash-এ নিজের অ্যাপে TrxID <b>' + esc(o.bkash_txn) + "</b> ও টাকার পরিমাণ মিলিয়ে তারপর “পরিশোধিত” করুন। সাইট নিজে থেকে যাচাই করে না।</div>" : "") +
      '<label>ডেলিভারি চার্জ (টাকা) <small>– বসালে মোট নিজে নিজে হিসাব হবে</small></label><input type="number" min="0" id="dc" value="' + (o.delivery_pending ? "" : esc(o.delivery)) + '" placeholder="' + (o.delivery_pending ? "এখনো ঠিক হয়নি" : "") + '">' +
      '<div class="grid2"><div><label>অর্ডার অবস্থা</label><select id="os">' + opts(ST, o.order_status) + '</select></div><div><label>পেমেন্ট অবস্থা</label><select id="ps">' + opts(PS, o.payment_status) + "</select></div></div>" +
      '<div id="me" hidden></div><div class="row" style="margin-top:12px"><button class="btn" id="sv">সেভ করুন</button><a class="btn sec" id="wa" target="_blank" rel="noopener">গ্রাহককে WhatsApp</a><button class="btn sec" id="cl">বন্ধ</button><span class="grow"></span><button class="btn warn sm" id="dl">অর্ডার মুছুন</button></div>');
    function wa() {
      var d = Number($("#dc", m).value), has = $("#dc", m).value !== "" && isFinite(d);
      var t = "আসসালামু আলাইকুম " + o.name + ", বন্ধুর বাজারে আপনার অর্ডার " + o.order_id + "।\nপণ্যমূল্য: " + o.subtotal + " টাকা\n" +
        (has ? "ডেলিভারি চার্জ: " + d + " টাকা\nমোট: " + (Number(o.subtotal) + d) + " টাকা" : "ডেলিভারি চার্জ আমরা জানাব।") + "\nঅবস্থা দেখতে: অর্ডার ট্র্যাক পেজে Order ID ও আপনার মোবাইল নম্বর দিন।";
      $("#wa", m).href = "https://wa.me/88" + o.phone + "?text=" + encodeURIComponent(t);
    }
    wa(); $("#dc", m).addEventListener("input", wa);
    $("#cl", m).addEventListener("click", m.close);
    $("#sv", m).addEventListener("click", function () {
      var b = this, box = $("#me", m), body = { order_status: $("#os", m).value, payment_status: $("#ps", m).value };
      var dv = $("#dc", m).value;
      if (dv !== "") {
        var n = Number(dv); if (!isFinite(n) || n < 0) return showErr(box, new Error("ডেলিভারি চার্জ সঠিক সংখ্যা দিন"));
        body.delivery = n; body.total = Number(o.subtotal) + n; body.delivery_pending = false;
      }
      if (body.payment_status === "paid" && body.order_status === "payment_pending") body.order_status = "paid";
      busy(b, true, "সেভ হচ্ছে…"); box.hidden = true;
      A.patch("orders", "id=eq." + o.id, body).then(function (r) {
        if (!r || !r.length) throw new Error("সেভ হয়নি (অনুমতি বা তথ্য সমস্যা)");
        Object.assign(o, r[0]); toast("সেভ হয়েছে"); m.close(); done();
      }).catch(function (e) { busy(b, false); handleAuth(e); showErr(box, e); });
    });
    $("#dl", m).addEventListener("click", function () {
      if (!confirmBox("অর্ডার " + o.order_id + " স্থায়ীভাবে মুছে যাবে। নিশ্চিত?")) return;
      A.del("orders", "id=eq." + o.id).then(function () {
        ORDERS = ORDERS.filter(function (x) { return x.id !== o.id; }); toast("অর্ডার মোছা হয়েছে"); m.close(); done();
      }).catch(function (e) { showErr($("#me", m), e); });
    });
  }

  /* ============================== সাধারণ CRUD ============================== */
  var CATS_CACHE = [];
  var PRODUCTS = {
    table: "products", title: "পণ্য", pk: "id", order: "sort.asc,created_at.asc", add: "নতুন পণ্য",
    row: function (r) { return (r.image ? '<img class="thumb" src="' + esc(r.image) + '" alt="">' : '<div class="thumb"></div>') + '<div class="grow"><b>' + esc(r.name) + '</b><br><span class="muted">' + esc(r.category) + " · " + taka(r.price) + (r.offer_price != null ? " → অফার " + taka(r.offer_price) : "") + "/" + esc(r.unit) + "</span><br>" +
      (r.in_stock ? '<span class="badge b-paid">স্টকে আছে</span>' : '<span class="badge b-cancelled">স্টক নেই</span>') + (r.active ? "" : ' <span class="badge">লুকানো</span>') + "</div>"; },
    quick: [["in_stock", "স্টক"], ["active", "দেখানো"]],
    pre: function () { return A.select("categories?select=id,name&order=sort.asc").then(function (c) { CATS_CACHE = c; }); },
    fields: [
      { k: "id", label: "পণ্যের আইডি", type: "text", createOnly: true, hint: "ইংরেজি ছোট হাতের অক্ষর/সংখ্যা ও ড্যাশ, যেমন: mustard-honey (পরে বদলানো যাবে না)", req: true },
      { k: "name", label: "পণ্যের নাম", type: "text", req: true },
      { k: "category", label: "ক্যাটাগরি", type: "select", opts: function () { return CATS_CACHE.map(function (c) { return [c.id, c.name]; }); }, req: true },
      { k: "price", label: "প্রতি ১ ইউনিটের দাম (টাকা)", type: "number", req: true, hint: "যেমন মধু প্রতি ১ কেজির দাম" },
      { k: "offer_price", label: "অফার দাম (ঐচ্ছিক)", type: "number", hint: "অবশ্যই আসল দামের চেয়ে কম। ফাঁকা = অফার নেই" },
      { k: "unit", label: "একক", type: "text", def: "কেজি" },
      { k: "sizes", label: "পরিমাণের বিকল্প (কেজিতে, কমা দিয়ে)", type: "sizes", def: "1", hint: "যেমন: 0.5, 1, 2" },
      { k: "image", label: "পণ্যের ছবি", type: "image", prefix: "products", hint: "আসল ছবি আপলোড করুন; নিজে ছোট হয়ে যাবে" },
      { k: "short", label: "ছোট বর্ণনা", type: "text" },
      { k: "description", label: "বিস্তারিত বর্ণনা", type: "textarea" },
      { k: "features", label: "বৈশিষ্ট্য (প্রতি লাইনে একটি)", type: "lines" },
      { k: "popular", label: "জনপ্রিয় পণ্য", type: "check" }, { k: "is_new", label: "নতুন পণ্য", type: "check" },
      { k: "in_stock", label: "স্টকে আছে", type: "check", def: true }, { k: "active", label: "সাইটে দেখান", type: "check", def: true },
      { k: "sort", label: "ক্রম (ছোট সংখ্যা আগে)", type: "number", def: 0 },
    ],
  };
  var CATEGORIES = {
    table: "categories", title: "ক্যাটাগরি", pk: "id", order: "sort.asc", add: "নতুন ক্যাটাগরি",
    row: function (r) { return '<div class="grow"><b>' + esc(r.icon) + " " + esc(r.name) + '</b> <span class="muted">(' + esc(r.id) + ")</span>" + (r.active ? "" : ' <span class="badge">লুকানো</span>') + "<br><span class=\"muted\">" + esc(r.description) + "</span></div>"; },
    fields: [
      { k: "id", label: "আইডি", type: "text", createOnly: true, req: true, hint: "ইংরেজি ছোট হাতের, যেমন: honey" },
      { k: "name", label: "নাম", type: "text", req: true }, { k: "icon", label: "আইকন (ইমোজি, ঐচ্ছিক)", type: "text" },
      { k: "description", label: "বর্ণনা", type: "text" }, { k: "sort", label: "ক্রম", type: "number", def: 0 }, { k: "active", label: "সাইটে দেখান", type: "check", def: true },
    ],
  };
  var SLIDES = {
    table: "slides", title: "স্লাইডার/ব্যানার", pk: "id", order: "sort.asc", add: "নতুন স্লাইড",
    row: function (r) { return (r.image ? '<img class="thumb" style="width:90px" src="' + esc(r.image) + '" alt="">' : '<div class="thumb"></div>') + '<div class="grow"><b>' + esc(r.title) + '</b><br><span class="muted">' + esc(r.subtitle) + "</span>" + (r.active ? "" : ' <span class="badge">লুকানো</span>') + "</div>"; },
    fields: [
      { k: "title", label: "শিরোনাম", type: "text" }, { k: "subtitle", label: "উপশিরোনাম", type: "text" },
      { k: "image", label: "ব্যানার ছবি (কম্পিউটার/বড় স্ক্রিন)", type: "image", prefix: "banners" },
      { k: "mobile_image", label: "মোবাইলের ব্যানার ছবি (ঐচ্ছিক)", type: "image", prefix: "banners" },
      { k: "button_text", label: "বাটনের লেখা", type: "text", def: "Shop Now" }, { k: "button_link", label: "বাটনের লিংক", type: "text", def: "shop.html", hint: "যেমন shop.html বা shop.html?cat=honey" },
      { k: "theme", label: "রঙের থিম (ছবি না থাকলে)", type: "select", opts: function () { return ["green", "gold", "brown", "olive", "dark"].map(function (x) { return [x, x]; }); }, def: "green" },
      { k: "sort", label: "ক্রম", type: "number", def: 0 }, { k: "active", label: "সাইটে দেখান", type: "check", def: true },
    ],
  };
  var FAQS = {
    table: "faqs", title: "সাধারণ প্রশ্ন (FAQ)", pk: "id", order: "sort.asc", add: "নতুন প্রশ্ন",
    row: function (r) { return '<div class="grow"><b>' + esc(r.question) + '</b><br><span class="muted">' + esc(r.answer.slice(0, 120)) + "</span>" + (r.active ? "" : ' <span class="badge">লুকানো</span>') + "</div>"; },
    fields: [
      { k: "question", label: "প্রশ্ন", type: "text", req: true }, { k: "answer", label: "উত্তর", type: "textarea", req: true },
      { k: "sort", label: "ক্রম", type: "number", def: 0 }, { k: "active", label: "সাইটে দেখান", type: "check", def: true },
    ],
  };

  function crud(p, C) {
    var rows = [];
    p.innerHTML = '<div class="card"><div class="row"><h2 class="grow" style="margin:0">' + esc(C.title) + '</h2><button class="btn" id="ad">+ ' + esc(C.add) + '</button></div></div><div id="cl"></div>';
    var list = $("#cl", p);
    function draw() {
      list.innerHTML = rows.length ? rows.map(function (r) {
        var q = (C.quick || []).map(function (x) { return '<button class="btn sm sec" data-q="' + x[0] + '" data-id="' + esc(r[C.pk]) + '">' + esc(x[1]) + (r[x[0]] ? " বন্ধ করুন" : " চালু করুন") + "</button>"; }).join(" ");
        return '<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">' + C.row(r) + '</div><div class="row"><button class="btn sm" data-e="' + esc(r[C.pk]) + '">সম্পাদনা</button> ' + q + ' <button class="btn sm warn" data-d="' + esc(r[C.pk]) + '">মুছুন</button></div></div>';
      }).join("") : '<div class="card muted">এখনো কিছু নেই।</div>';
    }
    function load() {
      return (C.pre ? C.pre() : Promise.resolve()).then(function () { return A.selectAll(C.table, "select=*&order=" + C.order); })
        .then(function (r) { rows = r; draw(); }).catch(function (e) { handleAuth(e); list.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; });
    }
    $("#ad", p).addEventListener("click", function () { form(C, null, load); });
    list.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var find = function (id) { return rows.filter(function (r) { return String(r[C.pk]) === id; })[0]; };
      if (b.dataset.e) form(C, find(b.dataset.e), load);
      else if (b.dataset.d) {
        var r = find(b.dataset.d);
        if (confirmBox("“" + (r.name || r.title || r.question || r.id) + "” মুছে ফেলবেন? এটি ফেরানো যাবে না (ব্যাকআপ থেকে ফেরানো যায়)।"))
          A.del(C.table, C.pk + "=eq." + encodeURIComponent(b.dataset.d)).then(function () { toast("মোছা হয়েছে"); load(); }).catch(function (er) { handleAuth(er); toast(er.message); });
      } else if (b.dataset.q) {
        var r2 = find(b.dataset.id), body = {}; body[b.dataset.q] = !r2[b.dataset.q];
        A.patch(C.table, C.pk + "=eq." + encodeURIComponent(b.dataset.id), body).then(load).catch(function (er) { toast(er.message); });
      }
    });
    load();
  }

  function form(C, row, done) {
    var isNew = !row;
    var html = '<h2>' + esc(isNew ? C.add : C.title + " সম্পাদনা") + '</h2><form id="ff">';
    C.fields.forEach(function (f) {
      var v = row ? row[f.k] : f.def;
      if (f.createOnly && !isNew) { html += "<label>" + esc(f.label) + '</label><input type="text" value="' + esc(v) + '" disabled>'; return; }
      var hint = f.hint ? " <small>– " + esc(f.hint) + "</small>" : "";
      if (f.type === "check") html += '<label class="chk"><input type="checkbox" name="' + f.k + '"' + (v ? " checked" : "") + "> " + esc(f.label) + "</label>";
      else if (f.type === "textarea") html += "<label>" + esc(f.label) + hint + '</label><textarea name="' + f.k + '">' + esc(v || "") + "</textarea>";
      else if (f.type === "lines") html += "<label>" + esc(f.label) + hint + '</label><textarea name="' + f.k + '">' + esc((v || []).join("\n")) + "</textarea>";
      else if (f.type === "sizes") html += "<label>" + esc(f.label) + hint + '</label><input type="text" name="' + f.k + '" value="' + esc(Array.isArray(v) ? v.join(", ") : v || "1") + '">';
      else if (f.type === "select") html += "<label>" + esc(f.label) + hint + '</label><select name="' + f.k + '">' + f.opts().map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
      else if (f.type === "image") html += "<label>" + esc(f.label) + hint + '</label><input type="file" accept="image/jpeg,image/png,image/webp" data-img="' + f.k + '"><input type="hidden" name="' + f.k + '" value="' + esc(v || "") + '"><div class="pv" data-pv="' + f.k + '">' + (v ? '<img class="prev" src="' + esc(v) + '" alt="">' : "") + "</div>" + (v ? '<button type="button" class="btn sm sec" data-rm="' + f.k + '">ছবি সরান</button>' : "");
      else html += "<label>" + esc(f.label) + hint + '</label><input type="' + (f.type === "number" ? "number" : "text") + '"' + (f.type === "number" ? ' step="any" inputmode="decimal"' : "") + ' name="' + f.k + '" value="' + esc(v == null ? "" : v) + '">';
    });
    html += '<div id="fe" hidden></div><div class="row" style="margin-top:14px"><button class="btn" id="fs" type="submit">সেভ করুন</button><button class="btn sec" type="button" id="fc">বাতিল</button></div></form>';
    var m = modal(html); m.dataset.lock = "1";
    $("#fc", m).addEventListener("click", m.close);
    var uploading = 0;
    $$("[data-img]", m).forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = inp.files[0]; if (!f) return; var key = inp.dataset.img, fld = C.fields.filter(function (x) { return x.k === key; })[0], pv = $('[data-pv="' + key + '"]', m);
        pv.innerHTML = '<span class="muted">ছবি ছোট করে আপলোড হচ্ছে…</span>'; uploading++; $("#fs", m).disabled = true;
        A.compress(f).then(function (blob) { return A.upload(A.imageName(fld.prefix, blob), blob); }).then(function (url) {
          $('input[name="' + key + '"]', m).value = url; pv.innerHTML = '<img class="prev" src="' + esc(url) + '" alt=""><div class="muted">আপলোড হয়েছে ✔ (সেভ করলে সংযুক্ত হবে)</div>';
        }).catch(function (e) { pv.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; inp.value = ""; handleAuth(e); }).then(function () { uploading--; if (!uploading) $("#fs", m).disabled = false; });
      });
    });
    $$("[data-rm]", m).forEach(function (b) { b.addEventListener("click", function () { $('input[name="' + b.dataset.rm + '"]', m).value = ""; $('[data-pv="' + b.dataset.rm + '"]', m).innerHTML = ""; b.remove(); }); });
    $("#ff", m).addEventListener("submit", function (ev) {
      ev.preventDefault();
      var body = {}, box = $("#fe", m);
      try {
        C.fields.forEach(function (f) {
          if (f.createOnly && !isNew) return;
          var el = $('[name="' + f.k + '"]', m), v;
          if (f.type === "check") v = el.checked;
          else if (f.type === "number") { v = el.value.trim() === "" ? null : Number(el.value); if (v !== null && !isFinite(v)) throw new Error(f.label + ": সঠিক সংখ্যা দিন"); if (f.req && v === null) throw new Error(f.label + " দিতে হবে"); if (v === null && f.def !== undefined && f.k !== "offer_price") v = f.def; }
          else if (f.type === "sizes") { v = el.value.split(",").map(function (s) { return Number(s.trim()); }).filter(function (n) { return n > 0; }); if (!v.length || v.some(function (n) { return !isFinite(n); })) throw new Error("পরিমাণের বিকল্প সঠিকভাবে দিন (যেমন 0.5, 1, 2)"); }
          else if (f.type === "lines") v = el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
          else { v = el.value.trim(); if (f.req && !v) throw new Error(f.label + " দিতে হবে"); }
          body[f.k] = v;
        });
        if (isNew && C.table === "products" && !/^[a-z0-9][a-z0-9-]{1,60}$/.test(body.id)) throw new Error("পণ্যের আইডি: ইংরেজি ছোট হাতের অক্ষর/সংখ্যা/ড্যাশ (২-৬১ অক্ষর)");
        if (isNew && C.table === "categories" && !/^[a-z0-9][a-z0-9-]{0,40}$/.test(body.id)) throw new Error("ক্যাটাগরি আইডি: ইংরেজি ছোট হাতের অক্ষর/সংখ্যা/ড্যাশ");
        if (body.offer_price != null && body.price != null && body.offer_price >= body.price) throw new Error("অফার দাম আসল দামের চেয়ে কম হতে হবে");
      } catch (e) { return showErr(box, e); }
      var b = $("#fs", m); busy(b, true, "সেভ হচ্ছে…"); box.hidden = true;
      (isNew ? A.insert(C.table, body) : A.patch(C.table, C.pk + "=eq." + encodeURIComponent(row[C.pk]), body)).then(function (r) {
        if (!r || !r.length) throw new Error("সেভ হয়নি");
        toast("সেভ হয়েছে"); m.close(); done();
      }).catch(function (e) { busy(b, false); handleAuth(e); showErr(box, e); });
    });
  }

  /* ============================== সেটিংস ============================== */
  function tabSettings(p) {
    Promise.all([A.select("settings?select=key,value"), A.select("districts?select=name&order=sort.asc,name.asc")]).then(function (r) {
      var S = {}; r[0].forEach(function (x) { S[x.key] = x.value; });
      var D = S.delivery || {}, P = S.payment || {}, K = S.contact || {}, T = S.texts || {}, dn = r[1].map(function (x) { return x.name; });
      var dcLines = Object.keys(D.district_charges || {}).map(function (k) { return k + "=" + D.district_charges[k]; }).join("\n");
      p.innerHTML =
        '<div class="card"><h2>ডেলিভারি চার্জ</h2><p class="muted">এখানে না বসানো পর্যন্ত গ্রাহক চার্জ দেখবে না; অর্ডারে “পরে জানানো হবে” থাকবে এবং bKash অর্ডার বন্ধ থাকবে। কোনো অনুমানের চার্জ বসে না।</p>' +
        '<label>নিজ জেলা (এখানে "ভেতরের চার্জ" প্রযোজ্য)</label><select id="d_in">' + dn.map(function (n) { return '<option' + (n === (D.inside_district || "ঢাকা") ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select>" +
        '<div class="grid2"><div><label>ভেতরের চার্জ (৳)</label><input type="number" min="0" id="d_ic" value="' + (D.inside_charge == null ? "" : esc(D.inside_charge)) + '" placeholder="ফাঁকা = ঠিক হয়নি"></div><div><label>বাইরের চার্জ (৳)</label><input type="number" min="0" id="d_oc" value="' + (D.outside_charge == null ? "" : esc(D.outside_charge)) + '" placeholder="ফাঁকা = ঠিক হয়নি"></div></div>' +
        '<label>ফ্রি ডেলিভারি (এই টাকার বেশি অর্ডারে) <small>– ০ = বন্ধ</small></label><input type="number" min="0" id="d_fr" value="' + esc(D.free_above || 0) + '">' +
        '<label>জেলাভিত্তিক আলাদা চার্জ <small>– প্রতি লাইনে: জেলা=চার্জ (যেমন চট্টগ্রাম=100)। ফাঁকা রাখলে ওপরের নিয়ম</small></label><textarea id="d_dc">' + esc(dcLines) + '</textarea><div id="e1" hidden></div><p><button class="btn" id="s1">ডেলিভারি সেভ</button></p></div>' +
        '<div class="card"><h2>পেমেন্ট</h2><label class="chk"><input type="checkbox" id="p_cod"' + (P.cod_enabled !== false ? " checked" : "") + '> ক্যাশ অন ডেলিভারি চালু</label><label class="chk"><input type="checkbox" id="p_bk"' + (P.bkash_enabled !== false ? " checked" : "") + '> bKash (Personal, Send Money) চালু</label>' +
        '<label>bKash নম্বর</label><input type="text" id="p_no" value="' + esc(P.bkash_number || "01602975419") + '"><p class="muted">bKash পেমেন্ট নিজে যাচাই হয় না; গ্রাহকের দেওয়া TrxID আপনি bKash অ্যাপে মিলিয়ে অর্ডারে “পরিশোধিত” করবেন।</p><div id="e2" hidden></div><p><button class="btn" id="s2">পেমেন্ট সেভ</button></p></div>' +
        '<div class="card"><h2>যোগাযোগ</h2><label>WhatsApp নম্বর (কান্ট্রি কোডসহ)</label><input type="text" id="k_wa" value="' + esc(K.whatsapp || "") + '"><label>WhatsApp দেখানোর নম্বর</label><input type="text" id="k_wd" value="' + esc(K.whatsapp_display || "") + '">' +
        '<label>Facebook পেজ লিংক</label><input type="url" id="k_fu" value="' + esc(K.facebook_url || "") + '"><label>Facebook নাম</label><input type="text" id="k_fn" value="' + esc(K.facebook_name || "") + '"><label>ইমেইল (সাইটে দেখানোর)</label><input type="text" id="k_em" value="' + esc(K.email || "") + '"><div id="e3" hidden></div><p><button class="btn" id="s3">যোগাযোগ সেভ</button></p></div>' +
        '<div class="card"><h2>সাইটের লেখা</h2><label>ওপরের সবুজ বারের লেখা <small>– ফাঁকা = ডিফল্ট</small></label><input type="text" id="t_tb" value="' + esc(T.topbar || "") + '"><label>স্লোগান <small>– ফাঁকা = ডিফল্ট</small></label><input type="text" id="t_sl" value="' + esc(T.slogan || "") + '"><div id="e4" hidden></div><p><button class="btn" id="s4">লেখা সেভ</button></p></div>';

      function save(btnId, errId, key, val) {
        var b = $("#" + btnId, p), box = $("#" + errId, p); busy(b, true, "সেভ হচ্ছে…"); box.hidden = true;
        A.upsert("settings", [{ key: key, value: val }], "key").then(function () { busy(b, false); toast("সেভ হয়েছে ✔"); }).catch(function (e) { busy(b, false); handleAuth(e); showErr(box, e); });
      }
      function num(id, label) { var v = $("#" + id, p).value.trim(); if (v === "") return null; var n = Number(v); if (!isFinite(n) || n < 0) throw new Error(label + ": সঠিক সংখ্যা দিন"); return n; }
      $("#s1", p).addEventListener("click", function () {
        try {
          var dc = {}; $("#d_dc", p).value.split("\n").forEach(function (l) { l = l.trim(); if (!l) return; var i = l.lastIndexOf("="); var n = l.slice(0, i).trim(), c = Number(l.slice(i + 1)); if (i < 1 || !isFinite(c) || c < 0) throw new Error("ভুল লাইন: " + l); if (dn.indexOf(n) < 0) throw new Error("জেলার নাম মেলেনি: " + n); dc[n] = c; });
          save("s1", "e1", "delivery", { inside_district: $("#d_in", p).value, inside_charge: num("d_ic", "ভেতরের চার্জ"), outside_charge: num("d_oc", "বাইরের চার্জ"), free_above: num("d_fr", "ফ্রি ডেলিভারি") || 0, district_charges: dc });
        } catch (e) { showErr($("#e1", p), e); }
      });
      $("#s2", p).addEventListener("click", function () {
        var no = $("#p_no", p).value.trim();
        if (!/^01[3-9][0-9]{8}$/.test(no)) return showErr($("#e2", p), new Error("bKash নম্বর সঠিক নয় (১১ অঙ্ক, 01 দিয়ে শুরু)"));
        save("s2", "e2", "payment", { cod_enabled: $("#p_cod", p).checked, bkash_enabled: $("#p_bk", p).checked, bkash_number: no, bkash_type: "Personal", bkash_method: "Send Money" });
      });
      $("#s3", p).addEventListener("click", function () {
        var em = $("#k_em", p).value.trim(), fu = $("#k_fu", p).value.trim();
        if (fu && !/^https:\/\//.test(fu)) return showErr($("#e3", p), new Error("Facebook লিংক https:// দিয়ে শুরু হতে হবে"));
        save("s3", "e3", "contact", { whatsapp: $("#k_wa", p).value.trim(), whatsapp_display: $("#k_wd", p).value.trim(), facebook_url: fu, facebook_name: $("#k_fn", p).value.trim(), email: em });
      });
      $("#s4", p).addEventListener("click", function () { save("s4", "e4", "texts", { topbar: $("#t_tb", p).value.trim(), slogan: $("#t_sl", p).value.trim() }); });
    }).catch(function (e) { handleAuth(e); p.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; });
  }

  /* ============================== রিপোর্ট ============================== */
  function dhaka(s) { return new Date(new Date(s).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10); }
  function weekKey(d) { var t = new Date(d + "T00:00:00Z"), w = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - w); return t.toISOString().slice(0, 10); }
  function tabReports(p) {
    var today = dhaka(new Date().toISOString()), from30 = dhaka(new Date(Date.now() - 29 * 86400000).toISOString());
    p.innerHTML = '<div class="card"><h2>বিক্রির রিপোর্ট</h2><div class="row"><div class="grow"><label>শুরু</label><input type="date" id="rf" value="' + from30 + '"></div><div class="grow"><label>শেষ</label><input type="date" id="rt" value="' + today + '"></div><div class="grow"><label>ভাগ</label><select id="rg"><option value="day">দৈনিক</option><option value="week">সাপ্তাহিক</option><option value="month">মাসিক</option></select></div></div><div class="row"><button class="btn" id="rb">দেখান</button><span class="grow"></span>' + exportBar() + '</div><p class="muted">বাতিল অর্ডার আয়ে ধরা হয় না। ডেলিভারি চার্জ বাকি থাকা অর্ডারে শুধু পণ্যমূল্য ধরা আছে।</p></div><div id="rr"></div>';
    var cur = { head: [], rows: [] };
    function run() {
      var rr = $("#rr", p); rr.innerHTML = '<p class="muted">হিসাব হচ্ছে…</p>';
      A.selectAll("orders", "select=order_id,created_at,total,subtotal,delivery,order_status,payment_status,items&order=created_at.desc").then(function (all) {
        var f = $("#rf", p).value, t = $("#rt", p).value, g = $("#rg", p).value;
        var os = all.filter(function (o) { var d = dhaka(o.created_at); return d >= f && d <= t; });
        var live = os.filter(function (o) { return o.order_status !== "cancelled"; });
        var rev = live.reduce(function (s, o) { return s + Number(o.total); }, 0), paid = live.filter(function (o) { return o.payment_status === "paid"; }).reduce(function (s, o) { return s + Number(o.total); }, 0);
        var by = {};
        os.forEach(function (o) {
          var d = dhaka(o.created_at), k = g === "day" ? d : g === "week" ? weekKey(d) : d.slice(0, 7);
          var x = by[k] || (by[k] = { n: 0, rev: 0, paid: 0, can: 0 });
          if (o.order_status === "cancelled") x.can++; else { x.n++; x.rev += Number(o.total); if (o.payment_status === "paid") x.paid += Number(o.total); }
        });
        var keys = Object.keys(by).sort().reverse(), max = Math.max.apply(null, keys.map(function (k) { return by[k].rev; }).concat([1]));
        var prod = {}; live.forEach(function (o) { (o.items || []).forEach(function (i) { var x = prod[i.name] || (prod[i.name] = { q: 0, r: 0 }); x.q += Number(i.qty); x.r += Number(i.total); }); });
        var top = Object.keys(prod).sort(function (a, b) { return prod[b].r - prod[a].r; }).slice(0, 10);
        cur.head = ["সময়", "অর্ডার (বাতিল বাদে)", "মোট বিক্রি", "পরিশোধিত", "বাতিল অর্ডার"];
        cur.rows = keys.map(function (k) { return [k, by[k].n, by[k].rev, by[k].paid, by[k].can]; });
        rr.innerHTML = '<div class="stats"><div class="stat">অর্ডার<b>' + bn(live.length) + '</b></div><div class="stat">মোট বিক্রি<b>' + taka(rev) + '</b></div><div class="stat">পরিশোধিত<b>' + taka(paid) + '</b></div><div class="stat">বাকি/অপরিশোধিত<b>' + taka(rev - paid) + '</b></div><div class="stat">বাতিল<b>' + bn(os.length - live.length) + "</b></div></div>" +
          '<div class="card" style="margin-top:12px"><div class="tw"><table class="t"><tr><th>সময়</th><th class="n">অর্ডার</th><th class="n">বিক্রি</th><th class="n">পরিশোধিত</th><th></th></tr>' + (keys.map(function (k) { return "<tr><td>" + bn(k) + '</td><td class="n">' + bn(by[k].n) + '</td><td class="n">' + taka(by[k].rev) + '</td><td class="n">' + taka(by[k].paid) + '</td><td style="width:30%"><div class="bar" style="width:' + Math.round(by[k].rev / max * 100) + '%"></div></td></tr>'; }).join("") || '<tr><td colspan="5" class="muted">এই সময়ে অর্ডার নেই</td></tr>') + "</table></div></div>" +
          '<div class="card"><h3>সেরা বিক্রিত পণ্য</h3><div class="tw"><table class="t"><tr><th>পণ্য</th><th class="n">সংখ্যা</th><th class="n">বিক্রি</th></tr>' + (top.map(function (n) { return "<tr><td>" + esc(n) + '</td><td class="n">' + bn(prod[n].q) + '</td><td class="n">' + taka(prod[n].r) + "</td></tr>"; }).join("") || '<tr><td colspan="3" class="muted">—</td></tr>') + "</table></div></div>";
      }).catch(function (e) { handleAuth(e); rr.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; });
    }
    $("#rb", p).addEventListener("click", run);
    bindExport(p, "report", function () { return cur.head; }, function () { return cur.rows; }, "Report");
    run();
  }

  /* ============================== ব্যাকআপ / রিস্টোর ============================== */
  var BT = [["districts", "name"], ["categories", "id"], ["settings", "key"], ["products", "id"], ["slides", "id"], ["faqs", "id"], ["orders", "id"]];
  /* updated_at ডাটাবেস নিজে বদলায় (Restore করলেও), তাই তুলনায় বাদ */
  function stable(o) { var c = {}; Object.keys(o).sort().forEach(function (k) { if (k !== "updated_at") c[k] = o[k]; }); return JSON.stringify(c); }
  function readAll() { return Promise.all(BT.map(function (t) { return A.selectAll(t[0], "select=*"); })).then(function (r) { var o = {}; BT.forEach(function (t, i) { o[t[0]] = r[i]; }); return o; }); }
  function makeBackup(tables) {
    var counts = {}; Object.keys(tables).forEach(function (k) { counts[k] = tables[k].length; });
    return { app: "bondhur-bazar-backup", version: 1, created_at: new Date().toISOString(), counts: counts, tables: tables };
  }
  function tabBackup(p) {
    p.innerHTML = '<div class="card"><h2>ব্যাকআপ নিন</h2><div class="warnb">বিনামূল্যের Supabase প্ল্যানে নিজে থেকে ব্যাকআপ হয় না। নিয়মিত (অন্তত সপ্তাহে একবার) ব্যাকআপ নামিয়ে নিরাপদ জায়গায় রাখুন। ব্যাকআপে গ্রাহকের নাম-ঠিকানা থাকে, তাই ফাইলটি গোপন রাখুন।</div>' +
      '<p><button class="btn" id="b1">ডেটা ব্যাকআপ (JSON) নামান</button></p><p class="muted">অর্ডার, পণ্য, ক্যাটাগরি, স্লাইডার, FAQ, সেটিংস, জেলা – সব এক ফাইলে। (অ্যাডমিন তালিকা ও পাসওয়ার্ড কখনো ব্যাকআপে থাকে না।)</p>' +
      '<p><button class="btn sec" id="b2">ছবির ব্যাকআপ (ZIP) নামান</button></p><p class="muted">ছবি ডেটাবেসের ব্যাকআপে থাকে না, তাই আলাদা নামাতে হয়। বেশি ছবি থাকলে ফোনে সময়/মেমরি লাগতে পারে।</p><div id="bm"></div></div>' +
      '<div class="card"><h2>ব্যাকআপ থেকে ফেরানো (Restore)</h2><div class="okb">নিরাপদ নিয়ম: আগে “পরীক্ষা (Dry run)” চালান – এটি কিছুই বদলায় না, শুধু দেখায় কী কী নতুন/বদলাবে। তারপর সত্যিকারের Restore-এ নিজে থেকে বর্তমান ডেটার একটি নিরাপত্তা-ব্যাকআপ নামে, তারপর RESTORE লিখে নিশ্চিত করতে হয়। Restore শুধু যোগ/হালনাগাদ করে; কিছু মোছে না।</div>' +
      '<label>ডেটা ব্যাকআপ ফাইল (.json)</label><input type="file" id="rf" accept="application/json,.json"><div id="rinfo"></div>' +
      '<div class="row"><button class="btn sec" id="dry" disabled>পরীক্ষা (Dry run)</button><button class="btn warn" id="go" disabled>Restore করুন</button></div><div id="rm"></div>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><label>ছবির ব্যাকআপ ফাইল (.zip)</label><input type="file" id="zf" accept=".zip,application/zip"><div class="row" style="margin-top:8px"><button class="btn sec" id="zr" disabled>ছবি ফেরান</button></div><div id="zm"></div></div>';
    var bm = $("#bm", p), loaded = null;

    $("#b1", p).addEventListener("click", function () {
      var b = this; busy(b, true, "তথ্য নেওয়া হচ্ছে…"); bm.innerHTML = "";
      readAll().then(function (t) {
        var bk = makeBackup(t), imgsP = A.listImages().catch(function () { return []; });
        return imgsP.then(function (imgs) { bk.images = imgs; A.download("bondhur-bazar-backup_" + A.stamp() + ".json", [JSON.stringify(bk, null, 1)], "application/json");
          bm.innerHTML = '<div class="okb">ব্যাকআপ নামানো হয়েছে ✔ — ' + Object.keys(bk.counts).map(function (k) { return k + ": " + bn(bk.counts[k]); }).join(", ") + "</div>"; });
      }).catch(function (e) { handleAuth(e); bm.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }).then(function () { busy(b, false); });
    });

    $("#b2", p).addEventListener("click", function () {
      var b = this; busy(b, true, "ছবি জমানো হচ্ছে…"); bm.innerHTML = "";
      A.listImages().then(function (imgs) {
        if (!imgs.length) { bm.innerHTML = '<div class="warnb">এখনো কোনো ছবি আপলোড করা নেই।</div>'; return; }
        var files = [], i = 0;
        function next() {
          if (i >= imgs.length) return Promise.resolve();
          var im = imgs[i++]; bm.innerHTML = '<p class="muted">ছবি নামছে ' + bn(i) + "/" + bn(imgs.length) + "…</p>";
          return fetch(A.publicUrl(im.name)).then(function (r) { if (!r.ok) throw new Error("ছবি নামানো যায়নি: " + im.name); return r.arrayBuffer(); }).then(function (buf) { files.push({ name: im.name, data: new Uint8Array(buf) }); return next(); });
        }
        return next().then(function () { A.download("bondhur-bazar-images_" + A.stamp() + ".zip", A.zip(files)); bm.innerHTML = '<div class="okb">' + bn(files.length) + "টি ছবির ZIP নামানো হয়েছে ✔</div>"; });
      }).catch(function (e) { handleAuth(e); bm.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }).then(function () { busy(b, false); });
    });

    $("#rf", p).addEventListener("change", function () {
      var f = this.files[0], info = $("#rinfo", p); loaded = null; $("#dry", p).disabled = $("#go", p).disabled = true; info.innerHTML = "";
      if (!f) return;
      f.text().then(function (t) {
        var j = JSON.parse(t);
        if (j.app !== "bondhur-bazar-backup" || j.version !== 1 || !j.tables) throw new Error("এটি বন্ধুর বাজারের ব্যাকআপ ফাইল নয়");
        BT.forEach(function (x) { if (!Array.isArray(j.tables[x[0]])) throw new Error("ফাইলে '" + x[0] + "' অংশ নেই"); if (j.counts && j.counts[x[0]] !== j.tables[x[0]].length) throw new Error("ফাইল অসম্পূর্ণ/নষ্ট: " + x[0] + " সংখ্যা মেলেনি"); });
        loaded = j; $("#dry", p).disabled = $("#go", p).disabled = false;
        info.innerHTML = '<div class="okb">ফাইল ঠিক আছে ✔ — তৈরির সময়: ' + dt(j.created_at) + "<br>" + BT.map(function (x) { return x[0] + ": " + bn(j.tables[x[0]].length); }).join(" · ") + "</div>";
      }).catch(function (e) { info.innerHTML = '<div class="err">' + esc(e.message.indexOf("JSON") >= 0 ? "ফাইলটি পড়া যায়নি (JSON নষ্ট)" : e.message) + "</div>"; });
    });

    function plan() {
      return readAll().then(function (cur) {
        return { cur: cur, rows: BT.map(function (t) {
          var key = t[1], map = {}; cur[t[0]].forEach(function (r) { map[r[key]] = stable(r); });
          var nw = 0, ch = 0, same = 0; loaded.tables[t[0]].forEach(function (r) { var m = map[r[key]]; if (m === undefined) nw++; else if (m === stable(r)) same++; else ch++; });
          return { t: t[0], total: loaded.tables[t[0]].length, nw: nw, ch: ch, same: same, now: cur[t[0]].length };
        }) };
      });
    }
    function planHtml(pl) {
      return '<div class="tw"><table class="t"><tr><th>টেবিল</th><th class="n">ফাইলে</th><th class="n">এখন আছে</th><th class="n">নতুন যোগ হবে</th><th class="n">বদলাবে</th><th class="n">একই</th></tr>' + pl.rows.map(function (r) { return "<tr><td>" + r.t + '</td><td class="n">' + bn(r.total) + '</td><td class="n">' + bn(r.now) + '</td><td class="n">' + bn(r.nw) + '</td><td class="n">' + bn(r.ch) + '</td><td class="n">' + bn(r.same) + "</td></tr>"; }).join("") + "</table></div>";
    }
    $("#dry", p).addEventListener("click", function () {
      var b = this, rm = $("#rm", p); busy(b, true, "পরীক্ষা হচ্ছে…"); rm.innerHTML = "";
      plan().then(function (pl) { rm.innerHTML = '<div class="okb">পরীক্ষা সম্পন্ন – কিছুই বদলানো হয়নি।</div>' + planHtml(pl); }).catch(function (e) { handleAuth(e); rm.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }).then(function () { busy(b, false); });
    });
    $("#go", p).addEventListener("click", function () {
      var b = this, rm = $("#rm", p); busy(b, true, "প্রস্তুতি…"); rm.innerHTML = "";
      plan().then(function (pl) {
        rm.innerHTML = planHtml(pl) + '<div class="warnb">এখন বর্তমান ডেটার নিরাপত্তা-ব্যাকআপ নামছে। নামা শেষ হলে নিচে নিশ্চিত করুন।</div>';
        A.download("SAFETY-before-restore_" + A.stamp() + ".json", [JSON.stringify(makeBackup(pl.cur), null, 1)], "application/json");
        rm.innerHTML += '<label>নিশ্চিত করতে ইংরেজিতে RESTORE লিখুন</label><input type="text" id="cf" autocomplete="off"><p><button class="btn warn" id="cg">নিশ্চিত – Restore শুরু</button></p>';
        $("#cg", rm).addEventListener("click", function () {
          if ($("#cf", rm).value.trim() !== "RESTORE") return toast("RESTORE লিখতে হবে");
          var cgb = this; cgb.disabled = true; var log = document.createElement("div"); rm.appendChild(log);
          var chain = Promise.resolve();
          BT.forEach(function (t) {
            chain = chain.then(function () {
              var rows = loaded.tables[t[0]], i = 0;
              function step() {
                if (i >= rows.length) { log.innerHTML += "<div>✔ " + t[0] + ": " + bn(rows.length) + "</div>"; return Promise.resolve(); }
                var chunk = rows.slice(i, i + 200); i += 200;
                return A.upsert(t[0], chunk, t[1]).then(step);
              }
              return step();
            });
          });
          chain.then(function () { log.innerHTML += '<div class="okb">Restore সম্পন্ন ✔ — এখন “পরীক্ষা (Dry run)” আবার চালালে সব “একই” দেখাবে।</div>'; })
            .catch(function (e) { handleAuth(e); log.innerHTML += '<div class="err">Restore মাঝপথে থেমেছে: ' + esc(e.message) + " — নিরাপত্তা-ব্যাকআপ ফাইল দিয়ে আবার চেষ্টা করা যায়।</div>"; });
        });
      }).catch(function (e) { handleAuth(e); rm.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }).then(function () { busy(b, false); });
    });

    var zfile = null;
    $("#zf", p).addEventListener("change", function () { zfile = this.files[0] || null; $("#zr", p).disabled = !zfile; });
    $("#zr", p).addEventListener("click", function () {
      var b = this, zm = $("#zm", p); busy(b, true, "ফেরানো হচ্ছে…"); zm.innerHTML = "";
      zfile.arrayBuffer().then(A.unzip).then(function (files) {
        files = files.filter(function (f) { return /\.(jpe?g|png|webp)$/i.test(f.name) && f.name.indexOf("..") < 0 && f.data.length; });
        if (!files.length) throw new Error("ZIP-এ কোনো ছবি নেই");
        var i = 0;
        function next() {
          if (i >= files.length) return Promise.resolve();
          var f = files[i++], ext = f.name.split(".").pop().toLowerCase(), type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          zm.innerHTML = '<p class="muted">আপলোড ' + bn(i) + "/" + bn(files.length) + "…</p>";
          return A.upload(f.name, new Blob([f.data], { type: type })).then(next);
        }
        return next().then(function () { zm.innerHTML = '<div class="okb">' + bn(files.length) + "টি ছবি ফেরানো হয়েছে ✔</div>"; });
      }).catch(function (e) { handleAuth(e); zm.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; }).then(function () { busy(b, false); });
    });
  }

  /* ============================== ব্যবহার ও সতর্কতা ============================== */
  function tabUsage(p) {
    Promise.all([readAll(), A.listImages().catch(function () { return null; })]).then(function (r) {
      var t = r[0], imgs = r[1], bytes = 0;
      Object.keys(t).forEach(function (k) { bytes += JSON.stringify(t[k]).length; });
      var dbMB = bytes * 1.6 / 1048576, stMB = imgs ? imgs.reduce(function (s, i) { return s + (i.size || 0); }, 0) / 1048576 : null;
      function meter(label, used, limit, note) {
        var pc = Math.min(100, used / limit * 100), cls = pc >= 90 ? "b-cancelled" : pc >= 70 ? "b-pending" : "b-paid";
        return '<div class="card"><b>' + esc(label) + '</b> <span class="badge ' + cls + '">' + (pc >= 90 ? "বিপদ" : pc >= 70 ? "সতর্ক" : "ঠিক আছে") + '</span><div style="background:#eee;border-radius:6px;margin:8px 0"><div class="bar" style="width:' + pc.toFixed(1) + '%;background:' + (pc >= 90 ? "#b3261e" : pc >= 70 ? "#f3ab1b" : "#1e7a3a") + '"></div></div>' + bn(used.toFixed(2)) + " MB / " + bn(limit) + " MB (" + bn(pc.toFixed(1)) + "%)<br><span class=\"muted\">" + esc(note) + "</span></div>";
      }
      var last = t.orders.length ? t.orders.map(function (o) { return o.created_at; }).sort().pop() : null;
      p.innerHTML = '<div class="card"><h2>ব্যবহার ও সতর্কতা</h2><p class="muted">Supabase বিনামূল্যের প্ল্যানের সীমা: ডাটাবেস ৫০০ MB, ছবির স্টোরেজ ১ GB, ডাটা ট্রান্সফার মাসে ৫ GB। এই পাতার সংখ্যাগুলো আনুমানিক; সঠিক হিসাব Supabase ড্যাশবোর্ডের Usage অংশে।</p></div>' +
        meter("ডাটাবেস (আনুমানিক)", dbMB, 500, "অর্ডার " + bn(t.orders.length) + "টি, পণ্য " + bn(t.products.length) + "টি। সীমার ৭০% পেরোলে পুরনো অর্ডার এক্সপোর্ট করে সরানোর কথা ভাবুন।") +
        (stMB === null ? '<div class="card warnb">ছবির স্টোরেজ পড়া যায়নি।</div>' : meter("ছবির স্টোরেজ", stMB, 1024, bn(imgs.length) + "টি ছবি। নতুন ছবি আপলোডের সময় নিজে ছোট হয়ে যায়।")) +
        '<div class="card"><b>ডাটা ট্রান্সফার (৫ GB/মাস)</b><p class="muted">এটি এখান থেকে মাপা যায় না। সাইটে ভিড় বাড়লে Supabase → Organization → Usage দেখুন। সাইট ক্যাটালগ ২ মিনিট ব্রাউজারে জমা রাখে এবং ছবি ছোট করা হয়, যাতে ট্রান্সফার কম লাগে।</p></div>' +
        '<div class="card"><b>নিষ্ক্রিয়তায় বিরতি</b><p class="muted">বিনামূল্যের প্রজেক্ট ১ সপ্তাহ কোনো কাজ না হলে থেমে (pause) যায়। সর্বশেষ অর্ডার: ' + (last ? dt(last) : "এখনো নেই") + '। GitHub Actions-এর “keepalive” এটি কমাতে সাহায্য করে, কিন্তু ১০০% নিশ্চয়তা নয়; ৭ দিনের বেশি বন্ধ থাকলে Supabase-এ গিয়ে Restore/Resume করতে হতে পারে।</p></div>' +
        '<div class="card"><b>ব্যাকআপ</b><p class="muted">বিনামূল্যের প্ল্যানে স্বয়ংক্রিয় ব্যাকআপ নেই। “ব্যাকআপ/রিস্টোর” ট্যাব থেকে নিয়মিত নামান।</p></div>';
    }).catch(function (e) { handleAuth(e); p.innerHTML = '<div class="err">' + esc(e.message) + "</div>"; });
  }
})();
