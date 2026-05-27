const SUPABASE_URL = 'https://dovhuxkzctjvlhwhcveg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zJkKgBt7pT4ZMINElu0A4Q_0_L3TC1G';

// 1. Sahifani DARHOL yashir — Supabase javob berguncha hech narsa ko'rinmasin
document.documentElement.style.visibility = 'hidden';

// 2. Tez tekshiruv: localStorage da token yo'q bo'lsa darhol yo'naltir
if (!localStorage.getItem('ms_token')) {
  window.location.replace('kirish.html');
}

// 3. To'liq tekshiruv — Supabase orqali tokenni tasdiqlash
async function tokenTekshir() {
  const token = localStorage.getItem('ms_token');

  // Token yo'q (2-qadam dan o'tib kelgan bo'lsa ham)
  if (!token) {
    window.location.replace('kirish.html');
    return;
  }

  try {
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await sb
      .from('tokenlar')
      .select('*')
      .eq('token', token)
      .single();

    // Token topilmadi
    if (error || !data) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_ism');
      window.location.replace('kirish.html');
      return;
    }

    // Token bloklangan
    if (!data.faol) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_ism');
      alert('❌ Sizning tokeningiz bloklangan!');
      window.location.replace('kirish.html');
      return;
    }

    // Muddat tugagan
    if (data.muddat && new Date(data.muddat) < new Date()) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_ism');
      alert('⏰ Tokeningiz muddati tugagan!');
      window.location.replace('kirish.html');
      return;
    }

    // Boshqa qurilmada ishlatilgan
    const deviceId = localStorage.getItem('device_id');
    if (data.qurilma && data.qurilma !== deviceId) {
      localStorage.removeItem('ms_token');
      localStorage.removeItem('ms_ism');
      alert('🚫 Bu token boshqa qurilmada ishlatilgan!');
      window.location.replace('kirish.html');
      return;
    }

    // ✅ Hamma tekshiruv o'tdi — sahifani ko'rsat
    document.documentElement.style.visibility = 'visible';

    // Oxirgi kirish vaqtini fon da yangilash (sahifani sekinlashtirmaydi)
    sb.from('tokenlar').update({
      oxirgi_kirish: new Date().toISOString()
    }).eq('token', token);

  } catch (e) {
    // Tarmoq xatosi: sahifa yashirilgan holda qoladi va kirish.html ga yo'naltiradi
    window.location.replace('kirish.html');
  }
}

// load eventini kutmasdan DARHOL ishga tushir
tokenTekshir();
