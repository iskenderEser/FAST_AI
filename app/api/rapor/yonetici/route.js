import { supabase } from '@/lib/supabase';

function getDateRange(filtre) {
  const now = new Date();
  const bugun = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start, end, sub;

  switch (filtre) {
    case 'gunluk': {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      start = new Date(dun); start.setHours(0, 0, 0, 0);
      end   = new Date(dun); end.setHours(23, 59, 59, 999);
      sub   = 'dün';
      break;
    }
    case 'haftalik': {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      const gun = dun.getDay();
      const fark = gun === 0 ? 6 : gun - 1;
      start = new Date(dun);
      start.setDate(dun.getDate() - fark);
      start.setHours(0, 0, 0, 0);
      end = new Date(dun); end.setHours(23, 59, 59, 999);
      sub = 'bu hafta';
      break;
    }
    case 'aylik': {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      start = new Date(dun.getFullYear(), dun.getMonth(), 1, 0, 0, 0, 0);
      end   = new Date(dun); end.setHours(23, 59, 59, 999);
      sub   = 'bu ay';
      break;
    }
    case '3aylik': {
      const mevcutDonem = Math.floor(now.getMonth() / 3);
      if (mevcutDonem === 0) {
        start = new Date(now.getFullYear() - 1, 9, 1, 0, 0, 0, 0);
        end   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end   = new Date(now.getFullYear(), mevcutDonem * 3, 0, 23, 59, 59, 999);
      }
      sub = 'son dönemler';
      break;
    }
    case 'yillik': {
      const oncekiAy = now.getMonth() - 1;
      if (oncekiAy < 0) {
        start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        end   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end   = new Date(now.getFullYear(), oncekiAy + 1, 0, 23, 59, 59, 999);
      }
      sub = 'bu yıl';
      break;
    }
    default: {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      start = new Date(dun); start.setHours(0, 0, 0, 0);
      end   = new Date(dun); end.setHours(23, 59, 59, 999);
      sub   = 'dün';
    }
  }

  return { start: start.toISOString(), end: end.toISOString(), sub };
}

function getTrendLabels(filtre) {
  const now = new Date();
  const bugun = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filtre) {
    case 'gunluk':
      return ['08:00','10:00','12:00','14:00','16:00','18:00'];

    case 'haftalik': {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      const gunSirasi = dun.getDay() === 0 ? 6 : dun.getDay() - 1;
      const tumGunler = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
      return tumGunler.slice(0, gunSirasi + 1);
    }

    case 'aylik': {
      const dun = new Date(bugun);
      dun.setDate(dun.getDate() - 1);
      const haftaSayisi = Math.ceil(dun.getDate() / 7);
      const labels = [];
      for (let i = 1; i <= haftaSayisi; i++) labels.push(`Hf${i}`);
      return labels;
    }

    case '3aylik': {
      const mevcutDonem = Math.floor(now.getMonth() / 3);
      if (mevcutDonem === 0) return ['4. Dönem'];
      const labels = [];
      for (let i = 0; i < mevcutDonem; i++) labels.push(`${i+1}. Dönem`);
      return labels;
    }

    case 'yillik': {
      const tumAylar = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
      const oncekiAy = now.getMonth() - 1;
      if (oncekiAy < 0) return tumAylar;
      return tumAylar.slice(0, oncekiAy + 1);
    }

    default:
      return ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  }
}

function getTrendKey(filtre, dateStr) {
  const d = new Date(dateStr);
  switch (filtre) {
    case 'gunluk': {
      const h = d.getHours();
      const slot = Math.floor(h / 2) * 2;
      return `${String(slot).padStart(2,'0')}:00`;
    }
    case 'haftalik':
      return ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'][d.getDay() === 0 ? 6 : d.getDay() - 1];
    case 'aylik':
      return `Hf${Math.ceil(d.getDate() / 7)}`;
    case '3aylik':
      return `${Math.floor(d.getMonth() / 3) + 1}. Dönem`;
    case 'yillik':
      return ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()];
    default:
      return ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'][d.getDay() === 0 ? 6 : d.getDay() - 1];
  }
}

function buildTrend(filtre, feedbacks) {
  const labels = getTrendLabels(filtre);
  const map = {};
  labels.forEach(l => { map[l] = { u: 0, a: 0 }; });
  feedbacks.forEach(fb => {
    const key = getTrendKey(filtre, fb.created_at);
    if (map[key] !== undefined) {
      map[key].u++;
      if (fb.arsivlendi) map[key].a++;
    }
  });
  return {
    labels,
    u: labels.map(l => map[l].u),
    a: labels.map(l => map[l].a),
  };
}

function buildNedenler(feedbacks) {
  const SYS_KEYS = [
    'cpr_stile_uygun_degil',
    'cpr_klise',
    'cpr_cok_uzun',
    'cpr_cok_kisa',
    'hasta_sesi_yansimaadi',
  ];
  const USR_KEYS = [
    'yanlis_claim',
    'yanlis_stil',
    'yanlis_urun',
    'rakip_hatali',
  ];

  const map = {};
  feedbacks
    .filter(fb => !fb.arsivlendi && fb.nedenler)
    .forEach(fb => {
      fb.nedenler.forEach(n => { map[n] = (map[n] || 0) + 1; });
    });

  const toplamSys = SYS_KEYS.reduce((s, k) => s + (map[k] || 0), 0);
  const toplamUsr = USR_KEYS.reduce((s, k) => s + (map[k] || 0), 0);

  return {
    sys: SYS_KEYS.map(k => toplamSys > 0 ? Math.round((map[k] || 0) / toplamSys * 100) : 0),
    usr: USR_KEYS.map(k => toplamUsr > 0 ? Math.round((map[k] || 0) / toplamUsr * 100) : 0),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filtre   = searchParams.get('filtre')   || 'gunluk';
    const firma_id = searchParams.get('firma_id');

    if (!firma_id) {
      return Response.json({ success: false, error: 'firma_id zorunlu' }, { status: 400 });
    }

    const { start, end, sub } = getDateRange(filtre);

    const { data: feedbacks, error: fbError } = await supabase
      .from('cpr_feedback')
      .select('id, kullanici_id, urun_id, stil, claim, arsivlendi, nedenler, created_at')
      .eq('firma_id', firma_id)
      .gte('created_at', start)
      .lte('created_at', end);
    if (fbError) throw fbError;

    const fb = feedbacks || [];
    const uretilen   = fb.length;
    const arsivlenen = fb.filter(f => f.arsivlendi).length;

    const { data: kullanicilar, error: kulError } = await supabase
      .from('kullanicilar').select('id, ad_soyad')
      .eq('firma_id', firma_id).eq('rol', 'kullanici');
    if (kulError) throw kulError;

    const { data: urunler, error: urunError } = await supabase
      .from('urunler').select('id, urun_adi').eq('firma_id', firma_id);
    if (urunError) throw urunError;

    const urunMap = {};
    (urunler || []).forEach(u => { urunMap[u.id] = u.urun_adi; });

    const now = new Date();
    function sonAktiviteStr(tarih) {
      if (!tarih) return '—';
      const fark = Math.floor((now - tarih) / (1000 * 60 * 60 * 24));
      if (fark === 0) return 'bugün';
      if (fark === 1) return 'dün';
      if (fark < 7)  return `${fark} gün önce`;
      return `${Math.floor(fark / 7)} hafta önce`;
    }

    const kulFbMap = {};
    fb.forEach(f => {
      if (!kulFbMap[f.kullanici_id]) kulFbMap[f.kullanici_id] = { uretilen: 0, arsivlenen: 0, son: null };
      kulFbMap[f.kullanici_id].uretilen++;
      if (f.arsivlendi) kulFbMap[f.kullanici_id].arsivlenen++;
      const t = new Date(f.created_at);
      if (!kulFbMap[f.kullanici_id].son || t > kulFbMap[f.kullanici_id].son) {
        kulFbMap[f.kullanici_id].son = t;
      }
    });

    const tablo = (kullanicilar || []).map(k => {
      const kData   = kulFbMap[k.id] || { uretilen: 0, arsivlenen: 0, son: null };
      const oran    = kData.uretilen > 0 ? Math.round(kData.arsivlenen / kData.uretilen * 100) : 0;
      const oranStr = `${oran}%`;
      const badge   = oran >= 40 ? 'badge-green' : oran > 0 ? 'badge-amber' : 'badge-gray';
      return [k.ad_soyad, kData.uretilen, kData.arsivlenen, oranStr, badge, sonAktiviteStr(kData.son)];
    }).sort((a, b) => b[1] - a[1]);

    const urunSayiMap = {};
    fb.forEach(f => {
      const ad = urunMap[f.urun_id] || 'Bilinmiyor';
      urunSayiMap[ad] = (urunSayiMap[ad] || 0) + 1;
    });
    const toplamUrun  = fb.length;
    const urunSirali  = Object.entries(urunSayiMap).sort((a, b) => b[1] - a[1]);
    const urun        = urunSirali.map(([, adet]) => toplamUrun > 0 ? Math.round(adet / toplamUrun * 100) : 0);
    const urun_adlari = urunSirali.map(([ad]) => ad);

    const stilSayiMap = {};
    fb.forEach(f => { stilSayiMap[f.stil] = (stilSayiMap[f.stil] || 0) + 1; });
    const STIL_SIRA = ['pragmatist','activist','theorist','reflector'];
    const toplamStil  = fb.length;
    const stil        = STIL_SIRA.map(s => toplamStil > 0 ? Math.round((stilSayiMap[s] || 0) / toplamStil * 100) : 0);

    const claimSayiMap = {};
    fb.forEach(f => {
      if (f.claim) claimSayiMap[f.claim] = (claimSayiMap[f.claim] || 0) + 1;
    });
    const toplamClaim  = fb.length;
    const claimSirali  = Object.entries(claimSayiMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const claim        = claimSirali.map(([, adet]) => toplamClaim > 0 ? Math.round(adet / toplamClaim * 100) : 0);
    const claim_adlari = claimSirali.map(([ad]) => ad);

    const trend    = buildTrend(filtre, fb);
    const nedenler = buildNedenler(fb);

    return Response.json({
      success: true,
      sub,
      uretilen,
      arsivlenen,
      urun,
      urun_adlari,
      stil,
      claim,
      claim_adlari,
      tablo,
      trend,
      fb: nedenler,
    });

  } catch (err) {
    console.error('Rapor yönetici hatası:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}