// ===================================================
// chat.js — Moliya Studiyasi umumiy chat widget
// Barcha sahifalarda ishlatiladi (index, bolnichniy,
// xaridlar_avans, otpusk).
// auth_check.js window.onAuthSuccess orqali
// chatWidgetInit(sb) ni chaqiradi.
// ===================================================

// XSS dan himoya — user ma'lumotlarini innerHTML ga
// qo'yishdan oldin har doim shu funksiyadan o'tkazish
function htmlEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function chatToggle() {
  const w = document.getElementById('chatWindow');
  const open = w.style.display === 'none';
  w.style.display = open ? 'block' : 'none';
  if (open) { chatXabarlarYukla(); chatBadgeTozala(); }
}

function chatBadgeTozala() {
  const badge = document.getElementById('chatBadge');
  if (badge) badge.style.display = 'none';
}

function emojiQosh(e) {
  const input = document.getElementById('chatInput');
  input.value += e;
  input.focus();
}

function chatXabarlarRender(data) {
  const box = document.getElementById('chatMessages');
  if (!data || data.length === 0) {
    box.innerHTML = '<div style="text-align:center;color:rgba(240,236,255,0.3);font-size:12px;padding:20px 0">Hali xabar yo\'q. Savolingizni yozing!</div>';
    return;
  }
  box.innerHTML = data.map(x => {
    const isAdmin = x.admin_xabar;
    // htmlEscape — XSS oldini olish
    return `<div style="display:flex;flex-direction:column;align-items:${isAdmin ? 'flex-end' : 'flex-start'}">
      <div style="max-width:80%;padding:9px 12px;border-radius:${isAdmin ? '12px 12px 3px 12px' : '12px 12px 12px 3px'};background:${isAdmin ? 'linear-gradient(135deg,#6C3FE8,#9B7BFF)' : 'rgba(255,255,255,0.08)'};color:#F0ECFF;font-size:13px;line-height:1.5">${htmlEscape(x.xabar)}</div>
      <div style="font-size:10px;color:rgba(240,236,255,0.3);margin-top:2px;padding:0 3px">${isAdmin ? 'Admin' : 'Siz'}</div>
    </div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

async function chatXabarlarYukla() {
  const sb = window.MS_SB;
  if (!sb) return;
  const token = localStorage.getItem('ms_token') || 'anon';
  const { data } = await sb.from('xabarlar').select('*').eq('token', token).order('sana', { ascending: true });
  chatXabarlarRender(data);
}

async function chatBadgeYangi() {
  const sb = window.MS_SB;
  if (!sb) return;
  const token = localStorage.getItem('ms_token') || 'anon';
  const { data } = await sb.from('xabarlar').select('id')
    .eq('token', token).eq('admin_xabar', true).eq('oqildi', false);
  const badge = document.getElementById('chatBadge');
  if (data && data.length > 0 && badge) {
    badge.style.display = 'flex';
    badge.textContent = data.length;
  } else if (badge) {
    badge.style.display = 'none';
  }
}

async function chatYuborish() {
  const sb = window.MS_SB;
  if (!sb) return;
  const msg = document.getElementById('chatInput').value.trim();
  if (!msg) return;
  const token = localStorage.getItem('ms_token') || 'anon';
  const ism = localStorage.getItem('ms_ism') || 'O\'quvchi';
  await sb.from('xabarlar').insert({
    ism, token, xabar: msg,
    sana: new Date().toISOString(),
    oqildi: false,
    admin_xabar: false
  });
  document.getElementById('chatInput').value = '';
  chatXabarlarYukla();
}

// Auth tasdiqlangandan keyin chaqiriladi (auth_check.js tomonidan)
function chatWidgetInit(sb) {
  window.MS_SB = sb;
  const token_rt = localStorage.getItem('ms_token') || 'anon';

  // Realtime — admin javob yuborganda darhol ko'rinadi
  sb.channel('xabarlar_' + token_rt)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'xabarlar',
      filter: 'token=eq.' + token_rt
    }, () => {
      if (document.getElementById('chatWindow').style.display !== 'none') {
        chatXabarlarYukla();
      }
      chatBadgeYangi();
    })
    .subscribe();

  // Badge tekshiruvi — auth o'tganidan keyin (endi xavfsiz)
  chatBadgeYangi();

  // Chat oynasi tashqarisiga bosganda yopish
  document.addEventListener('click', function(e) {
    const w = document.getElementById('chatWindow');
    const fab = document.getElementById('chatFab');
    if (w && w.style.display !== 'none' && !w.contains(e.target) && fab && !fab.contains(e.target)) {
      w.style.display = 'none';
    }
  });
}
