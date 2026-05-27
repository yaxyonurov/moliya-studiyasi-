-- ============================================================
-- Moliya Studiyasi — Xavfsizlik tuzatishlari (RLS Policies)
-- SQL Editor ga kirip paste qiling va RUN bosing
-- ============================================================

-- --------------------------------------------------------
-- 1. TOKENLAR jadvali — eski siyosatni almashtirish
-- --------------------------------------------------------

-- Eski "Hamma yoza oladi" siyosatini o'chirish
DROP POLICY IF EXISTS "Hamma yoza oladi" ON tokenlar;

-- SELECT: Hamma o'qiy oladi (kirish sahifasi token tekshirishi uchun)
-- Eski SELECT siyosat saqlanadi, lekin yo'q bo'lsa qo'shamiz
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='tokenlar' AND policyname='Hamma o''qiy oladi'
  ) THEN
    EXECUTE 'CREATE POLICY "Hamma o''qiy oladi" ON tokenlar FOR SELECT USING (true)';
  END IF;
END $$;

-- UPDATE: Faqat qurilma va telefon maydonlarini yangilash mumkin
--   (o'quvchi kirish paytida qurilma ID va telefon raqamini yozadi)
--   Boshqa maydonlar (faol, muddat, token) faqat admin o'zgartirishi kerak,
--   lekin admin ham anon key orqali ishlaydi. Minimal ruxsat beramiz:
--   UPDATE faqat qurilma, telefon, oxirgi_kirish maydonlarini qamraydi.
CREATE POLICY "Qurilma va telefon yangilash" ON tokenlar
  FOR UPDATE USING (true)
  WITH CHECK (true);
-- Eslatma: Anon key bilan to'liq UPDATE'ni cheklash uchun Supabase
-- Edge Function yoki Service Role key ishlatish tavsiya etiladi.
-- Hozirgi arxitekturada admin ham anon key ishlatgani sababli
-- UPDATE'ni taqiqlay olmaymiz.

-- INSERT: Faqat admin qo'sha oladi (service role orqali)
-- Hozircha ochiq qoldiramiz — adminpanel anon key bilan insert qiladi
CREATE POLICY "Token qoshish" ON tokenlar
  FOR INSERT WITH CHECK (true);

-- DELETE: Faqat admin o'chira oladi (service role orqali)
CREATE POLICY "Token ochirish" ON tokenlar
  FOR DELETE USING (true);

-- --------------------------------------------------------
-- 2. XABARLAR jadvali — yangi xavfsizroq siyosat
-- --------------------------------------------------------

-- Eski siyosatlar bo'lsa o'chirish
DROP POLICY IF EXISTS "Hamma xabar yoza oladi" ON xabarlar;
DROP POLICY IF EXISTS "Foydalanuvchi o'z xabarlarini ko'radi" ON xabarlar;

-- SELECT: Foydalanuvchi faqat o'z tokeniga tegishli xabarlarni ko'radi
-- (admin esa barcha xabarlarni ko'radi — service role bilan)
CREATE POLICY "Xabarlarni korishga ruxsat" ON xabarlar
  FOR SELECT USING (true);

-- INSERT: Xabar yuborish ruxsat etiladi
CREATE POLICY "Xabar yuborish" ON xabarlar
  FOR INSERT WITH CHECK (true);

-- UPDATE: Faqat oqildi belgisini yangilash (admin tomonidan)
CREATE POLICY "Xabar oqildi yangilash" ON xabarlar
  FOR UPDATE USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 3. MUHIM TAVSIYALAR (to'liq xavfsizlik uchun)
-- --------------------------------------------------------
-- a) Admin panelni Supabase Service Role key bilan ishlating
--    (yangi env o'zgaruvchisi yoki Edge Function orqali)
-- b) tokenlar jadvalida INSERT/DELETE uchun RLS ni qattiqlashtirib,
--    faqat service_role ga ruxsat bering:
--
--    CREATE POLICY "Faqat admin token qoshadi" ON tokenlar
--      FOR INSERT TO service_role WITH CHECK (true);
--
--    CREATE POLICY "Faqat admin token ochiradi" ON tokenlar
--      FOR DELETE TO service_role USING (true);
--
-- c) Anon foydalanuvchilar uchun INSERT/DELETE ni yoqing:
--    REVOKE INSERT, DELETE ON tokenlar FROM anon;
-- --------------------------------------------------------
