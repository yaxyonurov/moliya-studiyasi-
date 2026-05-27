-- Telefon ustunini qo'shish (agar allaqachon qo'shilmagan bo'lsa)
ALTER TABLE tokenlar ADD COLUMN IF NOT EXISTS telefon TEXT;
