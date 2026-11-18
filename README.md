# বন্ধুর বাজার – ওয়েবসাইট (ধাপ ১)

সম্পূর্ণ বিনামূল্যে: GitHub Pages (সাইট) + Supabase Free (ডাটাবেস)। কোনো পেইড সার্ভিস নেই।

## Supabase চালু করার ধাপ
1. supabase.com → GitHub দিয়ে Sign in → New project (নাম `bondhur-bazar`, Region: Singapore, Free plan)।
2. **SQL Editor**-এ ক্রমানুযায়ী চালান: `supabase/schema.sql` → `supabase/seed.sql` → `supabase/rls_test.sql` (শেষেরটিতে "সব পাস" আসতে হবে)।
3. **Authentication → Sign In / Providers**: "Allow new users to sign up" **বন্ধ** করুন। **Users → Add user**: ইমেইল `akabdulkaiyumofficial@gmail.com`, শক্তিশালী পাসওয়ার্ড, Auto Confirm চালু। (পাসওয়ার্ড কোথাও কোডে/ফাইলে রাখবেন না।)
4. **Project Settings → API** থেকে `Project URL` ও `anon public` key নিয়ে `js/supabase-config.js`-এ বসান। ❌ `service_role` key কখনো নয়।
5. ডেলিভারি চার্জ (অ্যাডমিন ড্যাশবোর্ড আসার আগে) SQL Editor-এ:
   `update settings set value = jsonb_set(jsonb_set(value,'{inside_charge}','60'),'{outside_charge}','120') where key='delivery';` (সংখ্যা আপনার আসল চার্জ)। সেট না করলে ক্রেতা "পরে জানানো হবে" দেখবে এবং bKash বন্ধ থাকবে।

## সীমা (Free tier)
৫০০MB ডাটাবেস, ১GB ছবি, ৫GB ডেটা ট্রান্সফার/মাস। ১ সপ্তাহ কোনো কার্যক্রম না থাকলে প্রজেক্ট পজ হয়; স্বয়ংক্রিয় ব্যাকআপ নেই। ছবি ছোট (≤১MB) রাখুন। সীমার কাছাকাছি গেলে আগে জানানো হবে।

## মনে রাখুন
- products.js/seed-এর **মধু ছাড়া অন্য পণ্যের দাম নমুনা** – আসল দাম বসান। উপজেলা ক্রেতা নিজে লেখেন।
- bKash যাচাই **স্বয়ংক্রিয় নয়**; অ্যাডমিন হাতে মিলিয়ে "Paid" করবেন।
- পণ্যের আসল ছবি `images/products/<id>.jpg`-এ দিন (বা পরে অ্যাডমিন থেকে আপলোড)।
- Order ID ও ফোন মিললে তবেই ট্র্যাকিং; ভুল চেষ্টায় সাময়িক লক।
- `.github/workflows/keepalive.yml` (আলাদা ফাইল) ডাটাবেস সচল রাখতে সাহায্য করে, শতভাগ নিশ্চয়তা নয়।
