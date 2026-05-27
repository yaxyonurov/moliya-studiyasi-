const SUPABASE_URL = 'https://dovhuxkzctjvlhwhcveg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zJkKgBt7pT4ZMINElu0A4Q_0_L3TC1G';

async function tokenTekshir() {
  const token = localStorage.getItem('ms_token');
  if (!token) {
    window.location.href = 'kirish.html';
    return;
  }

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const {data, error} = await sb
    .from('tokenlar')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_ism');
    window.location.href = 'kirish.html';
    return;
  }

  if (!data.faol) {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_ism');
    alert('❌ Sizning tokeningiz bloklangan!');
    window.location.href = 'kirish.html';
    return;
  }

  if (data.muddat && new Date(data.muddat) < new Date()) {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_ism');
    alert('⏰ Tokeningiz muddati tugagan!');
    window.location.href = 'kirish.html';
    return;
  }

  const deviceId = localStorage.getItem('device_id');
  if (data.qurilma && data.qurilma !== deviceId) {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_ism');
    alert('🚫 Bu token boshqa qurilmada ishlatilgan!');
    window.location.href = 'kirish.html';
    return;
  }

  // Oxirgi kirish vaqtini yangilash
  await sb.from('tokenlar').update({
    oxirgi_kirish: new Date().toISOString()
  }).eq('token', token);
}

window.addEventListener('load', tokenTekshir);
