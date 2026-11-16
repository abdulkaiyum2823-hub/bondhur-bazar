/* ==========================================================================
   বন্ধুর বাজার – পণ্যের তালিকা
   --------------------------------------------------------------------------
   নতুন পণ্য যোগ করতে নিচের যেকোনো একটি { ... }, ব্লক কপি করে নিচে বসান
   এবং তথ্য বদলান। (সহজ উপায়: admin.html পেজে ফর্ম পূরণ করলে কোড তৈরি হয়ে যাবে।)

   ফিল্ডের মানে:
   id        : ইংরেজি ছোট হাতের নাম, ফাঁকা ছাড়া (প্রতিটি পণ্যে আলাদা)। লিংকে ব্যবহার হয়।
   name      : পণ্যের নাম
   category  : config.js-এর ক্যাটাগরি id (honey, dates, gur, nuts, dryfruits)
   price     : প্রতি ১ কেজির দাম (টাকা) — ⚠️ "নমুনা" লেখা দামগুলো আপনার আসল দাম দিয়ে বদলান
   unit      : "কেজি" (ওজন) অথবা "পিস" ইত্যাদি
   sizes     : কত ওজনে কেনা যাবে। [0.25, 0.5, 1] = ২৫০ গ্রাম, ৫০০ গ্রাম, ১ কেজি
   image     : ছবির ফাইল (images/products/ ফোল্ডারে রাখুন)। ছবি না থাকলে সুন্দর প্লেসহোল্ডার দেখাবে।
   short     : এক লাইনের বিবরণ (কার্ডে দেখায়)
   description : বিস্তারিত বিবরণ
   features  : বৈশিষ্ট্যের তালিকা (পণ্যের পেজে বুলেট আকারে দেখায়)
   popular   : true হলে "জনপ্রিয়" বিভাগে দেখাবে
   isNew     : true হলে "নতুন পণ্য" বিভাগে দেখাবে
   inStock   : false করলে "স্টক নেই" দেখাবে ও কেনা যাবে না
   landing   : (ঐচ্ছিক) আলাদা বিজ্ঞাপনী পেজের লেখা – README দেখুন
   ========================================================================== */

window.BB_PRODUCTS = [
  /* ===================== মধু ===================== */
  {
    id: "kalojira-honey",
    name: "কালোজিরা ফুলের মধু",
    category: "honey",
    price: 450, // টাকা/কেজি
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/kalojira-honey.jpg",
    short: "কালোজিরা ফুল থেকে সংগৃহীত বিশেষ স্বাদের মধু।",
    description:
      "কালোজিরা ফুলের মৌসুমে সংগৃহীত মধু। এর স্বাদ ও ঘ্রাণ অন্য মধুর চেয়ে আলাদা। প্রতিদিনের খাবার, চা বা কুসুম গরম পানির সঙ্গে খাওয়া যায়।",
    features: ["কালোজিরা ফুলের মধু", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "পরিষ্কার ও সিল করা প্যাকেজিং"],
    popular: true,
    isNew: false,
    inStock: true,
  },
  {
    id: "mustard-honey",
    name: "সরিষা ফুলের মধু",
    category: "honey",
    price: 300,
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/mustard-honey.jpg",
    short: "সরিষা ফুলের মৌসুমের হালকা ও মিষ্টি মধু।",
    description:
      "সরিষা ফুলের মৌসুমে সংগৃহীত মধু। স্বাদে হালকা মিষ্টি, সহজেই জমে যেতে পারে – এটি মধুর স্বাভাবিক বৈশিষ্ট্য। রুটি, পরোটা বা দুধের সঙ্গে খাওয়ার জন্য জনপ্রিয়।",
    features: ["সরিষা ফুলের মধু", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "সাশ্রয়ী মূল্য"],
    popular: true,
    isNew: false,
    inStock: true,
  },
  {
    id: "khalisha-honey",
    name: "সুন্দরবনের খলিশা ফুলের মধু",
    category: "honey",
    price: 500,
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/khalisha-honey.jpg",
    short: "সুন্দরবনের খলিশা ফুল থেকে সংগৃহীত মধু।",
    description:
      "সুন্দরবনের খলিশা ফুলের মৌসুমে সংগৃহীত মধু। এই মধু তার বিশেষ ঘ্রাণ ও স্বাদের জন্য পরিচিত।",
    features: ["সুন্দরবনের খলিশা ফুলের মধু", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "বিশেষ স্বাদ ও ঘ্রাণ"],
    popular: true,
    isNew: false,
    inStock: true,
  },
  {
    id: "boroi-honey",
    name: "বরই ফুলের মধু",
    category: "honey",
    price: 350,
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/boroi-honey.jpg",
    short: "বরই ফুলের মৌসুমে সংগৃহীত মিষ্টি মধু।",
    description:
      "বরই ফুলের মৌসুমে সংগৃহীত মধু। মিষ্টি স্বাদের এই মধু পরিবারের সবার জন্য উপযোগী।",
    features: ["বরই ফুলের মধু", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "মিষ্টি ও মোলায়েম স্বাদ"],
    popular: false,
    isNew: false,
    inStock: true,
  },
  {
    id: "litchi-honey",
    name: "লিচু ফুলের মধু",
    category: "honey",
    price: 350,
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/litchi-honey.jpg",
    short: "লিচু ফুলের মৌসুমে সংগৃহীত সুগন্ধি মধু।",
    description:
      "লিচু ফুলের মৌসুমে সংগৃহীত মধু। হালকা ফলের মতো ঘ্রাণ ও মিষ্টি স্বাদ এর বিশেষত্ব।",
    features: ["লিচু ফুলের মধু", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "সুগন্ধি ও মিষ্টি"],
    popular: true,
    isNew: false,
    inStock: true,
  },

  /* ===================== খেজুর ও গুড় ===================== */
  /* ⚠️ নিচের দামগুলো নমুনা – আসল দাম বসান */
  {
    id: "khejur",
    name: "খেজুর (নরম ও মিষ্টি)",
    category: "dates",
    price: 400, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.5, 1],
    image: "images/products/khejur.jpg",
    short: "নরম ও মিষ্টি স্বাদের খেজুর।",
    description:
      "প্রতিদিনের নাস্তা, সেহরি ও ইফতারসহ যেকোনো সময় খাওয়ার উপযোগী নরম ও মিষ্টি খেজুর।",
    features: ["নরম ও মিষ্টি স্বাদ", "৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: true,
    isNew: false,
    inStock: true,
  },
  {
    id: "khejur-gur",
    name: "খেজুরের গুড়",
    category: "gur",
    price: 300, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.5, 1],
    image: "images/products/khejur-gur.jpg",
    short: "দেশি খেজুরের রসের গুড়, শীতের বিশেষ স্বাদ।",
    description:
      "খেজুরের রস থেকে তৈরি গুড়। পিঠা, পায়েস ও ঐতিহ্যবাহী নানা খাবারে এর স্বাদ আলাদা মাত্রা যোগ করে।",
    features: ["খেজুরের রসের গুড়", "৫০০ গ্রাম ও ১ কেজি প্যাকেটে", "পিঠা-পায়েসের জন্য আদর্শ"],
    popular: true,
    isNew: false,
    inStock: true,
  },

  /* ===================== বাদাম ===================== */
  {
    id: "cashew-nut",
    name: "কাজুবাদাম",
    category: "nuts",
    price: 1400, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/cashew-nut.jpg",
    short: "মচমচে ও সুস্বাদু কাজুবাদাম।",
    description: "নাস্তা, মিষ্টি ও রান্নায় ব্যবহারের জন্য কাজুবাদাম।",
    features: ["২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: false,
    isNew: true,
    inStock: true,
  },
  {
    id: "almond-nut",
    name: "কাঠবাদাম (আমন্ড)",
    category: "nuts",
    price: 1300, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/almond-nut.jpg",
    short: "প্রতিদিনের নাস্তার জন্য কাঠবাদাম।",
    description: "সকালের নাস্তা, মিষ্টান্ন বা এমনি খাওয়ার জন্য কাঠবাদাম।",
    features: ["২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: false,
    isNew: true,
    inStock: true,
  },
  {
    id: "pistachio-nut",
    name: "পেস্তা বাদাম",
    category: "nuts",
    price: 2200, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/pistachio-nut.jpg",
    short: "বিশেষ স্বাদের পেস্তা বাদাম।",
    description: "মিষ্টি, আইসক্রিম বা নাস্তায় ব্যবহারের উপযোগী পেস্তা বাদাম।",
    features: ["২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: false,
    isNew: true,
    inStock: true,
  },

  /* ===================== ড্রাই ফ্রুটস ===================== */
  {
    id: "walnut",
    name: "আখরোট",
    category: "dryfruits",
    price: 1100, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/walnut.jpg",
    short: "খোসা ছাড়ানো আখরোট।",
    description: "নাস্তা বা মিষ্টান্নে ব্যবহারের জন্য আখরোট।",
    features: ["২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: false,
    isNew: false,
    inStock: true,
  },
  {
    id: "raisin",
    name: "কিসমিস",
    category: "dryfruits",
    price: 600, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/raisin.jpg",
    short: "মিষ্টি ও রসালো কিসমিস।",
    description: "পোলাও, পায়েস ও মিষ্টান্নের জন্য কিসমিস।",
    features: ["২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: false,
    isNew: false,
    inStock: true,
  },
  {
    id: "mixed-dry-fruits",
    name: "মিক্স ড্রাই ফ্রুটস",
    category: "dryfruits",
    price: 1200, // নমুনা মূল্য
    unit: "কেজি",
    sizes: [0.25, 0.5, 1],
    image: "images/products/mixed-dry-fruits.jpg",
    short: "বাদাম ও শুকনো ফলের মিশ্রণ।",
    description: "বিভিন্ন ধরনের বাদাম ও শুকনো ফলের মিশ্রণ – একসঙ্গে সব স্বাদ পেতে।",
    features: ["বিভিন্ন বাদাম ও শুকনো ফলের মিশ্রণ", "২৫০ গ্রাম, ৫০০ গ্রাম ও ১ কেজি প্যাকেটে"],
    popular: true,
    isNew: true,
    inStock: true,
  },
];
