-- =============================================================================
-- নিরাপত্তা পরীক্ষা (rls_test.sql)
-- -----------------------------------------------------------------------------
-- কীভাবে চালাবেন: schema.sql ও seed.sql চালানোর পরে, SQL Editor-এ এই ফাইলের সব লেখা বসিয়ে Run।
-- ফলাফলে প্রতিটি পরীক্ষার পাশে ✅ PASS বা ❌ FAIL দেখাবে। একটিও ❌ থাকলে সাইট চালু করবেন না।
-- পরীক্ষার সব নমুনা অর্ডার/বদল পরীক্ষা শেষে নিজে থেকে মুছে যায়; আপনার আসল ডেটা অক্ষত থাকে।
-- =============================================================================

create or replace function pg_temp.q(r text, claims text, sql text)
returns text language plpgsql as $$
declare res text;
begin
  perform set_config('request.jwt.claims', claims, true);
  execute format('set local role %I', r);
  begin
    execute sql into res;
  exception when others then
    reset role;
    return 'ERR: ' || sqlerrm;
  end;
  reset role;
  return coalesce(res, 'null');
end $$;

create or replace function pg_temp.add(acc jsonb, nm text, ok boolean, det text)
returns jsonb language sql as $$
  select acc || jsonb_build_array(jsonb_build_object('name', nm, 'ok', coalesce(ok, false), 'detail', left(coalesce(det, ''), 140)))
$$;

create or replace function pg_temp.run_tests()
returns jsonb language plpgsql as $$
declare
  r jsonb := '[]'; res text; base jsonb; j jsonb; oid text; ph text; i int;
  c_anon constant text := '{"role":"anon"}';
  c_adm  constant text := '{"role":"authenticated","aud":"authenticated","email":"akabdulkaiyumofficial@gmail.com"}';
  c_adm2 constant text := '{"role":"authenticated","aud":"authenticated","email":"AkAbdulKaiyumOfficial@Gmail.com"}';
  c_oth  constant text := '{"role":"authenticated","aud":"authenticated","email":"someone.else@gmail.com"}';
  c_noaud constant text := '{"role":"authenticated","email":"akabdulkaiyumofficial@gmail.com"}';
  pay text;
begin
  begin
    base := $j${"name":"টেস্ট ক্রেতা","phone":"01711111111","district":"ঢাকা","upazila":"মিরপুর",
      "address":"বাড়ি ১২, রোড ৫, মিরপুর","payment_method":"cod",
      "items":[{"id":"kalojira-honey","size":1,"qty":1},{"id":"mustard-honey","size":0.5,"qty":1}],
      "price":1,"total":1,"subtotal":1}$j$::jsonb;
    pay := 'select public.place_order(%L::jsonb)::text';

    ------------------------------------------------------------------ অর্ডার তৈরি (anon)
    res := pg_temp.q('anon', c_anon, format(pay, base::text));
    r := pg_temp.add(r, 'অর্ডার: ক্রেতার পাঠানো ভুয়া দাম (১ টাকা) উপেক্ষা করে সার্ভারের দাম ধরে (৪৫০+১৫০=৬০০)',
                     res not like 'ERR%' and (res::jsonb ->> 'subtotal')::numeric = 600, res);
    r := pg_temp.add(r, 'অর্ডার: ডেলিভারি চার্জ সেট না থাকলে "পরে জানানো হবে" (delivery_pending=true)',
                     res not like 'ERR%' and (res::jsonb ->> 'delivery_pending')::boolean and (res::jsonb ->> 'total')::numeric = 600, res);
    r := pg_temp.add(r, 'অর্ডার: Order ID ফরম্যাট BB-YYMMDD-XXXXXX',
                     res not like 'ERR%' and (res::jsonb ->> 'order_id') ~ '^BB-[0-9]{6}-[A-Z0-9]{6}$', res);
    oid := res::jsonb ->> 'order_id';

    r := pg_temp.add(r, 'অর্ডার: ভুল মোবাইল নম্বর আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"phone":"12345"}')::text)) like '%bb:invalid_phone%', 'bb:invalid_phone');
    r := pg_temp.add(r, 'অর্ডার: জেলার তালিকার বাইরের নাম আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"district":"Atlantis"}')::text)) like '%bb:invalid_district%', 'bb:invalid_district');
    r := pg_temp.add(r, 'অর্ডার: পরিমাণ ০ আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"items":[{"id":"kalojira-honey","size":1,"qty":0}]}')::text)) like '%bb:invalid_items%', 'qty=0');
    r := pg_temp.add(r, 'অর্ডার: পরিমাণ ১০০ আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"items":[{"id":"kalojira-honey","size":1,"qty":100}]}')::text)) like '%bb:invalid_items%', 'qty=100');
    r := pg_temp.add(r, 'অর্ডার: তালিকায় নেই এমন ওজন (০.৩ কেজি) আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"items":[{"id":"kalojira-honey","size":0.3,"qty":1}]}')::text)) like '%bb:invalid_size%', 'size=0.3');
    r := pg_temp.add(r, 'অর্ডার: অজানা পণ্য আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"items":[{"id":"nope","size":1,"qty":1}]}')::text)) like '%bb:product_missing%', 'unknown product');
    r := pg_temp.add(r, 'অর্ডার: খালি তালিকা আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"items":[]}')::text)) like '%bb:invalid_items%', 'empty');
    r := pg_temp.add(r, 'অর্ডার: বট ফাঁদ (লুকানো "website" ঘর ভরা) আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"website":"spam.com"}')::text)) like '%bb:invalid%', 'honeypot');
    r := pg_temp.add(r, 'অর্ডার: bKash নির্বাচনে ডেলিভারি চার্জ সেট না থাকলে আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"payment_method":"bkash","bkash_txn":"ABC12345XY","bkash_sender":"01811111111"}')::text)) like '%bb:delivery_not_set%', 'bkash needs delivery');

    update public.products set in_stock = false where id = 'kalojira-honey';
    r := pg_temp.add(r, 'অর্ডার: স্টক নেই এমন পণ্য আটকায়',
         pg_temp.q('anon', c_anon, format(pay, base::text)) like '%bb:out_of_stock%', 'out of stock');
    update public.products set in_stock = true where id = 'kalojira-honey';

    -- অ্যাডমিন চার্জ বসালে (এখানে postgres হিসেবে)
    update public.settings set value = '{"inside_district":"ঢাকা","inside_charge":60,"outside_charge":120,"free_above":0,"district_charges":{}}'::jsonb where key = 'delivery';
    res := pg_temp.q('anon', c_anon, format(pay, base::text));
    r := pg_temp.add(r, 'ডেলিভারি: ঢাকার ভেতরে ৬০ → মোট ৬৬০', res not like 'ERR%' and (res::jsonb ->> 'delivery')::numeric = 60 and (res::jsonb ->> 'total')::numeric = 660, res);
    res := pg_temp.q('anon', c_anon, format(pay, (base || '{"district":"সিলেট"}')::text));
    r := pg_temp.add(r, 'ডেলিভারি: ঢাকার বাইরে ১২০ → মোট ৭২০', res not like 'ERR%' and (res::jsonb ->> 'delivery')::numeric = 120 and (res::jsonb ->> 'total')::numeric = 720, res);
    res := pg_temp.q('anon', c_anon, format(pay, (base || '{"payment_method":"bkash","bkash_txn":"abc12345xy","bkash_sender":"০১৮১১১১১১১১"}')::text));
    r := pg_temp.add(r, 'bKash: অর্ডার সফল; অবস্থা "পেমেন্ট যাচাই চলছে" (paid নয়)',
         res not like 'ERR%' and res::jsonb ->> 'payment_status' = 'pending_verification' and res::jsonb ->> 'order_status' = 'payment_pending', res);
    r := pg_temp.add(r, 'bKash: ভুল Transaction ID আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"payment_method":"bkash","bkash_txn":"ab","bkash_sender":"01811111111"}')::text)) like '%bb:invalid_txn%', 'txn');
    r := pg_temp.add(r, 'bKash: প্রেরকের ভুল নম্বর আটকায়',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"payment_method":"bkash","bkash_txn":"ABC12345XY","bkash_sender":"999"}')::text)) like '%bb:invalid_sender%', 'sender');
    r := pg_temp.add(r, 'দাম বদলে গেলে: ক্রেতার দেখা মোট টাকা সার্ভারের হিসাবের সঙ্গে না মিললে অর্ডার থামে',
         pg_temp.q('anon', c_anon, format(pay, (base || '{"payment_method":"bkash","bkash_txn":"ABC12345XY","bkash_sender":"01811111111","phone":"01955555555","expected_total":599}')::text)) like '%bb:price_changed%', 'expected_total');
    res := pg_temp.q('anon', c_anon, format(pay, (base || '{"phone":"01955555555","district":"ঢাকা","expected_total":660}')::text));
    r := pg_temp.add(r, 'দাম ঠিক থাকলে (expected_total মিললে) অর্ডার সফল', res not like 'ERR%' and (res::jsonb ->> 'total')::numeric = 660, res);
    update public.settings set value = jsonb_set(value, '{free_above}', '500') where key = 'delivery';
    res := pg_temp.q('anon', c_anon, format(pay, base::text));
    r := pg_temp.add(r, 'ডেলিভারি: ফ্রি-সীমা (৫০০ টাকা) পেরোলে চার্জ ০', res not like 'ERR%' and (res::jsonb ->> 'delivery')::numeric = 0, res);
    update public.settings set value = jsonb_set(value, '{free_above}', '0') where key = 'delivery';
    -- একই নম্বরে ঘণ্টায় ৫টির বেশি নয়
    j := '[]';
    for i in 1..6 loop
      res := pg_temp.q('anon', c_anon, format(pay, (base || '{"phone":"01911111111"}')::text));
      j := j || to_jsonb(res like 'ERR%');
    end loop;
    r := pg_temp.add(r, 'স্প্যাম: একই নম্বরে ৫টি অর্ডার চলে, ৬ষ্ঠটি আটকায়', j = '[false,false,false,false,false,true]'::jsonb, j::text);

    ------------------------------------------------------------------ অর্ডার ট্র্যাকিং
    ph := '01711111111';
    res := pg_temp.q('anon', c_anon, format('select public.track_order(%L, %L)::text', lower(oid), '+88 0171-1111111'));
    r := pg_temp.add(r, 'ট্র্যাকিং: সঠিক Order ID + ফোন মিললে অবস্থা দেখায়', res not like 'ERR%' and (res::jsonb ->> 'ok')::boolean, res);
    r := pg_temp.add(r, 'ট্র্যাকিং: ফলাফলে নাম, ফোন বা ঠিকানা থাকে না',
         res not like 'ERR%' and res not like '%01711111111%' and res not like '%টেস্ট ক্রেতা%' and res not like '%রোড ৫%' and not (res::jsonb -> 'order' ? 'phone'), left(res, 80));
    res := pg_temp.q('anon', c_anon, format('select public.track_order(%L, %L)::text', oid, '01799999999'));
    r := pg_temp.add(r, 'ট্র্যাকিং: ভুল ফোন নম্বরে কিছু দেখায় না', res not like 'ERR%' and res::jsonb ->> 'error' = 'not_found', res);
    res := pg_temp.q('anon', c_anon, format('select public.track_order(%L, %L)::text', 'BB-000000-AAAAAA', ph));
    r := pg_temp.add(r, 'ট্র্যাকিং: ভুল Order ID-তেও একই "not_found" (ID আছে কি না বোঝা যায় না)', res not like 'ERR%' and res::jsonb ->> 'error' = 'not_found', res);
    for i in 1..8 loop
      perform pg_temp.q('anon', c_anon, format('select public.track_order(%L, %L)::text', 'BB-000000-AAAAAA', ph));
    end loop;
    res := pg_temp.q('anon', c_anon, format('select public.track_order(%L, %L)::text', oid, ph));
    r := pg_temp.add(r, 'ট্র্যাকিং: একই নম্বরে ৮ বার ভুল করলে সাময়িক বন্ধ (অনুমান করে ঢোকা আটকায়)', res not like 'ERR%' and res::jsonb ->> 'error' = 'too_many_attempts', res);
    r := pg_temp.add(r, 'ট্র্যাকিং: ভুল ফরম্যাট আটকায়',
         pg_temp.q('anon', c_anon, 'select public.track_order(''x'', ''y'')::text') like '%invalid%', 'invalid');

    ------------------------------------------------------------------ সাধারণ ক্রেতা (anon)
    r := pg_temp.add(r, 'anon: অর্ডার টেবিল পড়তে পারে না', pg_temp.q('anon', c_anon, 'select count(*)::text from public.orders') like 'ERR%', pg_temp.q('anon', c_anon, 'select count(*)::text from public.orders'));
    r := pg_temp.add(r, 'anon: অর্ডার টেবিলে সরাসরি লিখতে পারে না',
         pg_temp.q('anon', c_anon, $q$with x as (insert into public.orders(order_id,name,phone,district,upazila,address,items,subtotal,delivery,total,payment_method)
           values('BB-000000-HACKER','x y','01711111111','ঢাকা','মিরপুর','বাড়ি ১২ রোড ৫','[]',1,0,1,'cod') returning 1) select count(*)::text from x$q$) like 'ERR%', 'insert');
    r := pg_temp.add(r, 'anon: অ্যাডমিন তালিকা পড়তে পারে না', pg_temp.q('anon', c_anon, 'select count(*)::text from public.admins') like 'ERR%', '');
    r := pg_temp.add(r, 'anon: track_attempts পড়তে পারে না', pg_temp.q('anon', c_anon, 'select count(*)::text from public.track_attempts') like 'ERR%', '');
    r := pg_temp.add(r, 'anon: পণ্যের দাম বদলাতে পারে না',
         pg_temp.q('anon', c_anon, 'with x as (update public.products set price = 1 returning 1) select count(*)::text from x') like 'ERR%', '');
    r := pg_temp.add(r, 'anon: নতুন পণ্য যোগ করতে পারে না',
         pg_temp.q('anon', c_anon, $q$with x as (insert into public.products(id,name,category,price) values('hack-1','x','honey',1) returning 1) select count(*)::text from x$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'anon: সেটিংস (ডেলিভারি চার্জ) বদলাতে পারে না',
         pg_temp.q('anon', c_anon, $q$with x as (update public.settings set value = '{}' returning 1) select count(*)::text from x$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'anon: পণ্য তালিকা পড়তে পারে (দোকান দেখানোর জন্য)', pg_temp.q('anon', c_anon, 'select count(*)::text from public.products')::int > 0, '');
    r := pg_temp.add(r, 'anon: ক্যাটাগরি, জেলা, সেটিংস, FAQ পড়তে পারে',
         pg_temp.q('anon', c_anon, 'select ((select count(*) from public.categories) > 0 and (select count(*) from public.districts) = 64 and (select count(*) from public.settings) > 0 and (select count(*) from public.faqs) > 0)::text') = 'true', '');
    update public.products set active = false where id = 'boroi-honey';
    r := pg_temp.add(r, 'anon: লুকানো (inactive) পণ্য দেখতে পারে না', pg_temp.q('anon', c_anon, $q$select count(*)::text from public.products where id = 'boroi-honey'$q$) = '0', '');
    r := pg_temp.add(r, 'anon: ভেতরের ফাংশন (bb_norm_phone) সরাসরি চালাতে পারে না', pg_temp.q('anon', c_anon, $q$select public.bb_norm_phone('x')$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'anon: is_admin() = false', pg_temp.q('anon', c_anon, 'select public.is_admin()::text') = 'false', '');
    r := pg_temp.add(r, 'ছবির জায়গা: anon আপলোড করতে পারে না',
         pg_temp.q('anon', c_anon, $q$with x as (insert into storage.objects(bucket_id,name) values('product-images','hack.jpg') returning 1) select count(*)::text from x$q$) like 'ERR%', pg_temp.q('anon', c_anon, $q$with x as (insert into storage.objects(bucket_id,name) values('product-images','hack.jpg') returning 1) select count(*)::text from x$q$));

    ------------------------------------------------------------------ লগইন করা কিন্তু অ্যাডমিন নয় (অন্য Gmail)
    r := pg_temp.add(r, 'অন্য Gmail: অর্ডার দেখতে পায় না (০টি)', pg_temp.q('authenticated', c_oth, 'select count(*)::text from public.orders') = '0', pg_temp.q('authenticated', c_oth, 'select count(*)::text from public.orders'));
    r := pg_temp.add(r, 'অন্য Gmail: পণ্য যোগ করতে পারে না',
         pg_temp.q('authenticated', c_oth, $q$with x as (insert into public.products(id,name,category,price) values('hack-2','x','honey',1) returning 1) select count(*)::text from x$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'অন্য Gmail: দাম বদলাতে পারে না',
         pg_temp.q('authenticated', c_oth, 'with x as (update public.products set price = 1 returning 1) select count(*)::text from x') in ('0') or pg_temp.q('authenticated', c_oth, 'with x as (update public.products set price = 1 returning 1) select count(*)::text from x') like 'ERR%', '');
    r := pg_temp.add(r, 'অন্য Gmail: অর্ডারের অবস্থা বদলাতে পারে না',
         pg_temp.q('authenticated', c_oth, $q$with x as (update public.orders set order_status = 'delivered' returning 1) select count(*)::text from x$q$) = '0', '');
    r := pg_temp.add(r, 'অন্য Gmail: অর্ডার মুছতে পারে না',
         pg_temp.q('authenticated', c_oth, 'with x as (delete from public.orders returning 1) select count(*)::text from x') = '0', '');
    r := pg_temp.add(r, 'অন্য Gmail: অ্যাডমিন তালিকায় নিজেকে যোগ করতে পারে না',
         pg_temp.q('authenticated', c_oth, $q$with x as (insert into public.admins(email) values('someone.else@gmail.com') returning 1) select count(*)::text from x$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'অন্য Gmail: is_admin() = false', pg_temp.q('authenticated', c_oth, 'select public.is_admin()::text') = 'false', '');
    r := pg_temp.add(r, 'অন্য Gmail: ছবি আপলোড করতে পারে না',
         pg_temp.q('authenticated', c_oth, $q$with x as (insert into storage.objects(bucket_id,name) values('product-images','hack.jpg') returning 1) select count(*)::text from x$q$) like 'ERR%', '');
    r := pg_temp.add(r, 'ইমেইল ঠিক কিন্তু "aud" নেই (জাল টোকেন ধরনের দাবি): অ্যাডমিন নয়',
         pg_temp.q('authenticated', c_noaud, 'select public.is_admin()::text') = 'false', '');

    ------------------------------------------------------------------ অ্যাডমিন
    r := pg_temp.add(r, 'অ্যাডমিন: is_admin() = true', pg_temp.q('authenticated', c_adm, 'select public.is_admin()::text') = 'true', '');
    r := pg_temp.add(r, 'অ্যাডমিন: ইমেইলের বড়/ছোট হাতের অক্ষরে পার্থক্য হয় না', pg_temp.q('authenticated', c_adm2, 'select public.is_admin()::text') = 'true', '');
    r := pg_temp.add(r, 'অ্যাডমিন: সব অর্ডার দেখতে পায়', pg_temp.q('authenticated', c_adm, 'select count(*)::text from public.orders')::int >= 5, pg_temp.q('authenticated', c_adm, 'select count(*)::text from public.orders'));
    r := pg_temp.add(r, 'অ্যাডমিন: অর্ডারের অবস্থা বদলাতে পারে',
         pg_temp.q('authenticated', c_adm, $q$with x as (update public.orders set order_status = 'processing', payment_status = 'paid' where order_id = $q$ || quote_literal(oid) || $q$ returning 1) select count(*)::text from x$q$) = '1', '');
    r := pg_temp.add(r, 'অ্যাডমিন: পণ্যের দাম বদলাতে পারে', pg_temp.q('authenticated', c_adm, $q$with x as (update public.products set price = 460 where id = 'kalojira-honey' returning 1) select count(*)::text from x$q$) = '1', '');
    r := pg_temp.add(r, 'অ্যাডমিন: লুকানো (inactive) পণ্যও দেখতে পায়', pg_temp.q('authenticated', c_adm, $q$select count(*)::text from public.products where id = 'boroi-honey'$q$) = '1', '');
    r := pg_temp.add(r, 'অ্যাডমিন: ডেলিভারি সেটিংস বদলাতে পারে', pg_temp.q('authenticated', c_adm, $q$with x as (update public.settings set value = value where key = 'delivery' returning 1) select count(*)::text from x$q$) = '1', '');
    r := pg_temp.add(r, 'অ্যাডমিন: ছবি আপলোড করতে পারে (পরীক্ষামূলক টেবিলে)',
         pg_temp.q('authenticated', c_adm, $q$with x as (insert into storage.objects(bucket_id,name) values('product-images','ok.jpg') returning 1) select count(*)::text from x$q$) = '1',
         pg_temp.q('authenticated', c_adm, $q$with x as (insert into storage.objects(bucket_id,name) values('product-images','ok2.jpg') returning 1) select count(*)::text from x$q$));
    r := pg_temp.add(r, 'অ্যাডমিন: ডাটাবেসের পণ্য বদলালে ক্রেতার জন্য নতুন দামই কার্যকর (অর্ডার সার্ভারের দামে)',
         (pg_temp.q('anon', c_anon, format(pay, (base || '{"phone":"01933333333","items":[{"id":"kalojira-honey","size":1,"qty":1}]}')::text))::jsonb ->> 'subtotal')::numeric = 460, '');

    ------------------------------------------------------------------ কাঠামো
    r := pg_temp.add(r, 'কাঠামো: public স্কিমার সব টেবিলে RLS চালু',
         (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity) = 0,
         (select coalesce(string_agg(c.relname, ', '), 'সব চালু') from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity));
    r := pg_temp.add(r, 'কাঠামো: অ্যাডমিন তালিকায় শুধু একটি ইমেইল',
         (select count(*) from public.admins) = 1 and exists (select 1 from public.admins where email = 'akabdulkaiyumofficial@gmail.com'),
         (select string_agg(email, ', ') from public.admins));

    raise exception 'bb_rollback';
  exception when others then
    if sqlerrm <> 'bb_rollback' then
      r := pg_temp.add(r, 'পরীক্ষা চালাতে ত্রুটি', false, sqlerrm);
    end if;
  end;
  return r;
end $$;

with res as materialized (select pg_temp.run_tests() as j)
select ord as "#",
       case when (e ->> 'ok')::boolean then '✅ PASS' else '❌ FAIL' end as "ফলাফল",
       e ->> 'name' as "পরীক্ষা",
       case when (e ->> 'ok')::boolean then '' else e ->> 'detail' end as "বিবরণ (ব্যর্থ হলে)"
from res, jsonb_array_elements(res.j) with ordinality as t(e, ord)
union all
select 9999, case when bool_and((e ->> 'ok')::boolean) then '🎉 সব পাস' else '⛔ ব্যর্থ আছে' end,
       'মোট ' || count(*) || 'টি পরীক্ষা, ব্যর্থ ' || count(*) filter (where not (e ->> 'ok')::boolean) || 'টি', ''
from res, jsonb_array_elements(res.j) as t(e)
order by 1;
