// Yeşil Saat - hesaplama fonksiyonları
// Tüm katsayılar Final PDR'daki "Tahmin / Varsayım" tablosundan alınmıştır.

const CIHAZLAR = {
  camasir: { ad: "Çamaşır makinesi", kwh: 1.0, sure: 2, ikon: "🧺" },
  bulasik: { ad: "Bulaşık makinesi", kwh: 1.2, sure: 2, ikon: "🍽️" },
  kurutma: { ad: "Kurutma makinesi", kwh: 2.5, sure: 2, ikon: "🌀" },
  ev: { ad: "Elektrikli araç şarjı", kwh: 10, sure: 4, ikon: "🚗" },
};
// Not: Çalışma süreleri (saat) PDR'da yer almıyor, tipik değer olarak varsayılmıştır.

// Gündelik karşılıklar (yaklaşık ortalamalar, g CO2)
const KARSILIK = {
  aracKm: 170,     // ≈170 g = 1 km araç
  telefonSarj: 8,  // ≈8 g = 1 telefon şarjı
  agacGun: 58,     // bir ağaç ≈58 g/gün emer
};

// Hava verisinden saatlik yenilenebilir pay tahmini (%)
// Pay = 8 + (radyasyon/900 × 38) + (min(rüzgâr,40)/40 × 35), 3–90 arası sınırlı
function yenilenebilirPay(radyasyon, ruzgar) {
  const pay = 8 + (radyasyon / 900) * 38 + (Math.min(ruzgar, 40) / 40) * 35;
  return Math.min(90, Math.max(3, pay));
}

// Emisyon yoğunluğu (g CO2/kWh) = 700 − 6 × pay
function emisyonYogunlugu(pay) {
  return 700 - 6 * pay;
}

// Çizelge rengi
function saatRengi(pay) {
  if (pay >= 45) return "yesil";
  if (pay >= 25) return "sari";
  return "kirmizi";
}

// Belirli bir saatte başlayan işin ortalama emisyon yoğunluğu
function isYogunlugu(saatler, baslangic, sure) {
  let toplam = 0;
  for (let i = 0; i < sure; i++) {
    toplam += saatler[(baslangic + i) % 24].yogunluk;
  }
  return toplam / sure;
}

// Kullanıcının aralığındaki en temiz başlangıç saatini bulur
// aralikBas/aralikSon: işin yapılabileceği saat aralığı (iş bu aralıkta bitmeli)
function enTemizSaat(saatler, cihazKey, aralikBas, aralikSon, aliskanlikSaati) {
  const cihaz = CIHAZLAR[cihazKey];
  const aralikUzunlugu = (aralikSon - aralikBas + 24) % 24 || 24;
  let enIyi = null;

  for (let k = 0; k + cihaz.sure <= aralikUzunlugu; k++) {
    const saat = (aralikBas + k) % 24;
    const yog = isYogunlugu(saatler, saat, cihaz.sure);
    if (enIyi === null || yog < enIyi.yogunluk) enIyi = { saat, yogunluk: yog };
  }
  if (enIyi === null) return null; // Aralık, işin süresinden kısa

  const alisilmisYog = isYogunlugu(saatler, aliskanlikSaati, cihaz.sure);
  const onlenenGram = Math.max(0, cihaz.kwh * (alisilmisYog - enIyi.yogunluk));

  return {
    cihaz,
    saat: enIyi.saat,
    yogunluk: enIyi.yogunluk,
    alisilmisSaat: aliskanlikSaati,
    alisilmisYogunluk: alisilmisYog,
    onlenenGram,
    karsiliklar: karsiliklar(onlenenGram),
  };
}

function karsiliklar(gram) {
  return {
    aracKm: gram / KARSILIK.aracKm,
    telefonSarj: gram / KARSILIK.telefonSarj,
    agacGun: gram / KARSILIK.agacGun,
  };
}

// Open-Meteo yanıtından ertesi günün 24 saatini çıkarır
function ertesiGunSaatleri(hourly) {
  const saatler = [];
  for (let i = 24; i < 48; i++) {
    const pay = yenilenebilirPay(hourly.shortwave_radiation[i], hourly.wind_speed_10m[i]);
    saatler.push({
      saat: i - 24,
      radyasyon: hourly.shortwave_radiation[i],
      ruzgar: hourly.wind_speed_10m[i],
      bulut: hourly.cloud_cover[i],
      pay,
      yogunluk: emisyonYogunlugu(pay),
      renk: saatRengi(pay),
    });
  }
  return saatler;
}

if (typeof module !== "undefined") {
  module.exports = { CIHAZLAR, yenilenebilirPay, emisyonYogunlugu, saatRengi, enTemizSaat, ertesiGunSaatleri, karsiliklar };
}
