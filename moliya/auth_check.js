const SUPABASE_URL = 'https://dovhuxkzctjvlhwhcveg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zJkKgBt7pT4ZMINElu0A4Q_0_L3TC1G';

const KESH_MS        = 5 * 60 * 1000;   // 5 daqiqa — Supabase so'rovsiz
const OFLAYN_IMKON   = 60 * 60 * 1000;  // 1 soat — oflayn bo'lganda keshdan foydalanish

// 1. Sahifani DARHOL yashir — hech narsa ko'rinmasin
document.documentElement.style.visibility = 'hidden';

// 2. Tez tekshiruv — token yo'q bo'lsa darhol yo'naltir
if (!localStorage.getItem('ms_token')) {
  window.location.replace('kirish.html');
}

// 3. To'liq tekshiruv
async function tokenTekshir() {
  const token = localStorage.getItem('ms_token');
  if (!token) { window.location.replace('kirish.html'); return; }

  const lastVerified = parseInt(localStorage.getItem('ms_verified_at') || '0');
  // Bitta client — global sifatida saqlanadi (chat.js ham shu clientni ishlatadi)
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.MS_SB = sb;

  // ─── 5 daqiqalik KESH — Supabase ga so'rov yo'q ───
  if (Date.now() - lastVerified < KESH_MS) {
    sahifaKor(sb);
    return;
  }

  try {
    const { data, error } = await sb
      .from('tokenlar')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      sessionTozala();
      window.location.replace('kirish.html'); return;
    }
    if (!data.faol) {
      sessionTozala();
      alert('❌ Sizning tokeningiz bloklangan!');
      window.location.replace('kirish.html'); return;
    }
    if (data.muddat && new Date(data.muddat) < new Date()) {
      sessionTozala();
      alert('⏰ Tokeningiz muddati tugagan!');
      window.location.replace('kirish.html'); return;
    }
    const deviceId = localStorage.getItem('device_id');
    if (data.qurilma && data.qurilma !== deviceId) {
      sessionTozala();
      alert('🚫 Bu token boshqa qurilmada ishlatilgan!');
      window.location.replace('kirish.html'); return;
    }

    // ✅ Token haqiqiy — kesh vaqtini yangilab sahifani ko'rsat
    localStorage.setItem('ms_verified_at', Date.now().toString());
    sahifaKor(sb);

    // Fon da oxirgi kirish vaqtini yangilash (sahifani sekinlashtirmaydi)
    sb.from('tokenlar').update({ oxirgi_kirish: new Date().toISOString() }).eq('token', token);

  } catch (e) {
    // ─── OFLAYN yoki tarmoq xatosi ───
    if (!navigator.onLine) {
      if (Date.now() - lastVerified < OFLAYN_IMKON) {
        // 1 soat ichida tekshirilgan — keshdan foydalanish
        sahifaKor(sb);
        // Oflayn xabarini sahifaga yuborish
        window.dispatchEvent(new CustomEvent('ms-offline'));
      } else {
        // Kesh juda eski — qayta kirish kerak
        // Loop oldini olish uchun flag o'rnatamiz
        localStorage.setItem('ms_offline_redirect', '1');
        window.location.replace('kirish.html');
      }
    } else {
      // Internet bor lekin xato — kirish sahifasiga
      window.location.replace('kirish.html');
    }
  }
}

function sessionTozala() {
  localStorage.removeItem('ms_token');
  localStorage.removeItem('ms_ism');
  localStorage.removeItem('ms_verified_at');
}

function sahifaKor(sb) {
  document.documentElement.style.visibility = 'visible';
  // Sahifaning o'z init kodini chaqirish (chat, progress, nav-ism va h.k.)
  if (typeof window.onAuthSuccess === 'function') {
    window.onAuthSuccess(sb);
  }
}

tokenTekshir();
