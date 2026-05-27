-- Xabarlar jadvalini yaratish
CREATE TABLE xabarlar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ism TEXT,
  token TEXT,
  xabar TEXT,
  sana TIMESTAMPTZ DEFAULT now(),
  oqildi BOOLEAN DEFAULT false
);

ALTER TABLE xabarlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hamma o'qiy oladi" ON xabarlar FOR SELECT USING (true);
CREATE POLICY "Hamma yoza oladi" ON xabarlar FOR INSERT WITH CHECK (true);
CREATE POLICY "Hamma yangilay oladi" ON xabarlar FOR UPDATE USING (true);
