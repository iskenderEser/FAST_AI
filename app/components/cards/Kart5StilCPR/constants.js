// app/components/cards/Kart5StilCPR/constants.js

export const STYLES = [
  { id: 'activist',   title: 'Activist',          badgeIcon: '🔥', badgeText: 'Yeni, deneyimsel, hızlı' },
  { id: 'reflector',  title: 'Reflector',         badgeIcon: '👁️', badgeText: 'Önce gözlem, sonra karar' },
  { id: 'theorist',   title: 'Theorist',          badgeIcon: '📐', badgeText: 'Kılavuz, mekanizma, sebep-sonuç' },
  { id: 'pragmatist', title: 'Pragmatist',        badgeIcon: '🛠️', badgeText: 'Pratik, uygulanabilir, "işe yarar mı?"' }
];

export const NEDENLER = [
  { key: 'cpr_stile_uygun_degil', label: 'CPR stile uygun değildi' },
  { key: 'cpr_cok_uzun',          label: 'CPR çok uzundu' },
  { key: 'cpr_cok_kisa',          label: 'CPR çok kısaydı' },
  { key: 'cpr_klise',             label: 'CPR klişe geldi, özgün değildi' },
  { key: 'hasta_sesi_yansimaadi', label: "Hasta sesi CPR'a yansımadı" },
  { key: 'yanlis_urun',           label: 'Yanlış ürün seçtim' },
  { key: 'yanlis_claim',          label: 'Yanlış claim seçtim' },
  { key: 'yanlis_stil',           label: 'Yanlış stil seçtim' },
  { key: 'rakip_hatali',          label: 'Rakip bilgisini hatalı girdim' },
];

export const STYLE_LABELS = {
  activist:   'Activist',
  reflector:  'Reflector',
  theorist:   'Theorist',
  pragmatist: 'Pragmatist',
};