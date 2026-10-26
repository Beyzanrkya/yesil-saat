// Yeşil Saat - arayüz ve veri akışı

const GEMINI_MODEL = "gemini-flash-latest";

// Hızlı şehir seçimi (Isparta pilot şehir)
const HIZLI_SEHIRLER = [
  { ad: "Isparta", lat: 37.7648, lon: 30.5566 },
  { ad: "İstanbul", lat: 41.0082, lon: 28.9784 },
  { ad: "Ankara", lat: 39.9334, lon: 32.8597 },
  { ad: "İzmir", lat: 38.4237, lon: 27.1428 },
  { ad: "Antalya", lat: 36.8969, lon: 30.7133 },
];

const ROZETLER = [
  { id: "ilk", em: "🌱", ad: "İlk adım", kosul: (v) => v.isSayisi >= 1 },
  { id: "bes", em: "🌿", ad: "5 iş", kosul: (v) => v.isSayisi >= 5 },
  { id: "kg", em: "🌳", ad: "1 kg CO₂", kosul: (v) => v.toplamGram >= 1000 },
  { id: "seri3", em: "🔥", ad: "3 gün seri", kosul: (v) => v.seri >= 3 },
  { id: "seri7", em: "⚡", ad: "7 gün seri", kosul: (v) => v.seri >= 7 },
];

const durum = {
  sehir: null,
  saatler: null,
  cihaz: "camasir",
  sonuc: null,
};

// ---------- Yerel kayıt (tarayıcıda) ----------
function oku(anahtar, varsayilan) {
  try {
    const v = localStorage.getItem(anahtar);
    return v === null ? varsayilan : JSON.parse(v);
  } catch {
    return varsayilan;
  }
}
function yaz(anahtar, deger) {
  try { localStorage.setItem(anahtar, JSON.stringify(deger)); } catch { /* yoksay */ }
}

function kazancVerisi() {
  return oku("yesilsaat_kazanc", { isSayisi: 0, toplamGram: 0, seri: 0, sonGun: null });
}

// ---------- Yardımcılar ----------
const $ = (id) => document.getElementById(id);
const saatYazi = (s) => String(s).padStart(2, "0") + ":00";
const yuvarla = (x, b = 1) => Number(x.toFixed(b)).toLocaleString("tr-TR");

function gramYazi(g) {
  return g >= 1000 ? yuvarla(g / 1000, 2) + " kg" : Math.round(g).toLocaleString("tr-TR") + " g";
}

function sekmeAc(id) {
  document.querySelectorAll(".sekme").forEach((s) => s.classList.toggle("aktif", s.id === id));
  document.querySelectorAll(".alt-menu button").forEach((b) => b.classList.toggle("aktif", b.dataset.sekme === id));
  window.scrollTo(0, 0);
}

// ---------- Hava verisi ----------
async function sehirSec(sehir) {
  durum.sehir = sehir;
  yaz("yesilsaat_sehir", sehir);
  $("sehirBaslik").textContent = "📍 " + sehir.ad + " · yarın";
  document.querySelectorAll("#hizliSehirler button").forEach((b) => b.classList.toggle("secili", b.textContent === sehir.ad));
  $("havaDurum").textContent = "Yarının hava tahmini alınıyor…";
  $("hesaplaBtn").disabled = true;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${sehir.lat}&longitude=${sehir.lon}` +
      `&hourly=shortwave_radiation,wind_speed_10m,cloud_cover&timezone=auto&forecast_days=2`;
    const yanit = await fetch(url);
    if (!yanit.ok) throw new Error("HTTP " + yanit.status);
    const veri = await yanit.json();
    durum.saatler = ertesiGunSaatleri(veri.hourly);

    const ort = durum.saatler.reduce((t, s) => t + s.pay, 0) / 24;
    $("havaDurum").textContent = `✓ Hava tahmini alındı. Yarın ortalama yenilenebilir pay: %${Math.round(ort)}`;
    $("hesaplaBtn").disabled = false;
    cizelgeCiz();
  } catch (e) {
    durum.saatler = null;
    $("havaDurum").textContent = "Hava verisi alınamadı. İnternet bağlantını kontrol edip tekrar dene.";
  }
}

async function sehirAra(metin) {
  $("havaDurum").textContent = "Şehir aranıyor…";
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(metin)}&count=1&language=tr`;
    const veri = await (await fetch(url)).json();
    const s = veri.results && veri.results[0];
    if (!s) {
      $("havaDurum").textContent = "Şehir bulunamadı.";
      return;
    }
    sehirSec({ ad: s.name, lat: s.latitude, lon: s.longitude });
  } catch {
    $("havaDurum").textContent = "Şehir aranamadı. İnternet bağlantını kontrol et.";
  }
}

// ---------- Çizelge ----------
function cizelgeCiz() {
  const kap = $("cubuklar");
  if (!durum.saatler) return;
  kap.innerHTML = "";
  durum.saatler.forEach((s) => {
    const el = document.createElement("div");
    el.className = "cubuk";
    if (durum.sonuc && s.saat === durum.sonuc.saat) el.classList.add("isaretli");
    el.title = `${saatYazi(s.saat)} · %${Math.round(s.pay)} yenilenebilir · ${Math.round(s.yogunluk)} g CO₂/kWh`;
    el.innerHTML = `<i class="${s.renk}" style="height:${s.pay}%"></i><span>${s.saat % 3 === 0 ? s.saat : ""}</span>`;
    kap.appendChild(el);
  });
}

// ---------- Öneri ----------
function hesapla() {
  const bas = Number($("aralikBas").value);
  const son = Number($("aralikSon").value);
  const alis = Number($("aliskanlik").value);
  const sonuc = enTemizSaat(durum.saatler, durum.cihaz, bas, son, alis);
  const kart = $("oneriKart");

  if (!sonuc) {
    kart.innerHTML = `<p class="bos">Seçtiğin saat aralığı bu iş için çok kısa (${CIHAZLAR[durum.cihaz].sure} saat sürüyor). Aralığı genişlet.</p>`;
    sekmeAc("oneri");
    return;
  }
  durum.sonuc = sonuc;
  cizelgeCiz();

  const k = sonuc.karsiliklar;
  kart.innerHTML = `
    <h2>${sonuc.cihaz.ikon} ${sonuc.cihaz.ad}</h2>
    <p class="alt">Yarın için önerilen en temiz başlangıç saati</p>
    <div class="buyuk-saat">${saatYazi(sonuc.saat)}</div>
    <p class="alt">Alışılmış saatin ${saatYazi(sonuc.alisilmisSaat)} yerine bu saatte başlatırsan
      <b>${gramYazi(sonuc.onlenenGram)} CO₂</b> önlersin.</p>
    <div class="karsilik">
      <div><b>${yuvarla(k.aracKm)}</b>km araç yolu</div>
      <div><b>${yuvarla(k.telefonSarj, 0)}</b>telefon şarjı</div>
      <div><b>${yuvarla(k.agacGun)}</b>ağaç-gün emilimi</div>
    </div>
    <div class="gemini" id="geminiMetin">✨ Açıklama hazırlanıyor…</div>
    <button class="ana" id="yaptimBtn" style="margin-top:14px">✅ Yaptım</button>
  `;
  $("yaptimBtn").addEventListener("click", yaptim);
  sekmeAc("oneri");
  geminiAcikla(sonuc);
}

function sablonAciklama(s) {
  if (s.onlenenGram < 1) {
    return `Alışılmış saatin ${saatYazi(s.alisilmisSaat)} zaten yarın için en temiz saatlerden biri. Bu saatte devam edebilirsin.`;
  }
  return `Yarın ${durum.sehir.ad}'da güneş ve rüzgâr ${saatYazi(s.saat)} civarında elektriğin daha büyük bir kısmını karşılayacak. ` +
    `${s.cihaz.ad.toLowerCase()} işini bu saate kaydırırsan yaklaşık ${gramYazi(s.onlenenGram)} CO₂ salımını önlemiş olursun.`;
}

async function geminiAcikla(s) {
  const kutu = $("geminiMetin");
  const anahtar = oku("yesilsaat_anahtar", "");
  if (!anahtar) {
    kutu.textContent = "💬 " + sablonAciklama(s) + " (Gemini açıklaması için Ayarlar'dan API anahtarı ekle.)";
    return;
  }

  const istem =
    `Sen Yeşil Saat uygulamasının asistanısın. Kullanıcıya en fazla 3 cümleyle, samimi ve sade Türkçe bir öneri yaz. ` +
    `Teknik terim kullanma. Veriler: şehir ${durum.sehir.ad}, cihaz ${s.cihaz.ad}, önerilen başlangıç ${saatYazi(s.saat)} ` +
    `(yenilenebilir payı daha yüksek), alışılmış saat ${saatYazi(s.alisilmisSaat)}, önlenen emisyon ${Math.round(s.onlenenGram)} g CO2, ` +
    `bu yaklaşık ${yuvarla(s.karsiliklar.aracKm)} km araç yoluna eşit. Değerlerin tahmin olduğunu belirtme gereği yok.`;

  try {
    const yanit = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": anahtar },
        body: JSON.stringify({ contents: [{ parts: [{ text: istem }] }] }),
      }
    );
    if (!yanit.ok) throw new Error("HTTP " + yanit.status);
    const veri = await yanit.json();
    const metin = veri.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
    kutu.textContent = "✨ " + (metin || sablonAciklama(s));
  } catch {
    kutu.textContent = "💬 " + sablonAciklama(s) + " (Gemini'ye ulaşılamadı.)";
  }
}

// ---------- Kazanç ----------
function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function yaptim() {
  if (!durum.sonuc) return;
  const v = kazancVerisi();
  const gun = bugun();
  const dun = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  if (v.sonGun !== gun) v.seri = v.sonGun === dun ? v.seri + 1 : 1;
  v.sonGun = gun;
  v.isSayisi += 1;
  v.toplamGram += durum.sonuc.onlenenGram;
  yaz("yesilsaat_kazanc", v);

  const btn = $("yaptimBtn");
  btn.disabled = true;
  btn.textContent = "🎉 Kaydedildi!";
  kazancGoster();
}

function kazancGoster() {
  const v = kazancVerisi();
  $("topIs").textContent = v.isSayisi;
  $("topGram").textContent = gramYazi(v.toplamGram);
  $("topSeri").textContent = v.seri;
  $("seriRozet").textContent = "🔥 " + v.seri;

  const k = karsiliklar(v.toplamGram);
  $("topKarsilik").innerHTML = `
    <div><b>${yuvarla(k.aracKm)}</b>km araç yolu</div>
    <div><b>${yuvarla(k.telefonSarj, 0)}</b>telefon şarjı</div>
    <div><b>${yuvarla(k.agacGun)}</b>ağaç-gün emilimi</div>`;

  $("rozetler").innerHTML = ROZETLER.map(
    (r) => `<div class="rozet ${r.kosul(v) ? "" : "kilitli"}"><span class="em">${r.em}</span>${r.ad}</div>`
  ).join("");
}

// ---------- Başlangıç ----------
function saatSecenekleri(select, secili) {
  for (let s = 0; s < 24; s++) select.add(new Option(saatYazi(s), s, false, s === secili));
}

function baslat() {
  HIZLI_SEHIRLER.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s.ad;
    b.addEventListener("click", () => sehirSec(s));
    $("hizliSehirler").appendChild(b);
  });

  Object.entries(CIHAZLAR).forEach(([key, c]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${c.ikon} ${c.ad}`;
    b.classList.toggle("secili", key === durum.cihaz);
    b.addEventListener("click", () => {
      durum.cihaz = key;
      document.querySelectorAll("#cihazlar button").forEach((x) => x.classList.toggle("secili", x === b));
    });
    $("cihazlar").appendChild(b);
  });

  saatSecenekleri($("aralikBas"), 8);
  saatSecenekleri($("aralikSon"), 22);
  saatSecenekleri($("aliskanlik"), 19);

  $("sehirForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const m = $("sehirInput").value.trim();
    if (m) sehirAra(m);
  });
  $("hesaplaBtn").addEventListener("click", hesapla);

  $("anahtarInput").value = oku("yesilsaat_anahtar", "");
  $("anahtarForm").addEventListener("submit", (e) => {
    e.preventDefault();
    yaz("yesilsaat_anahtar", $("anahtarInput").value.trim());
    $("anahtarDurum").textContent = "✓ Kaydedildi (yalnızca bu tarayıcıda).";
  });
  $("sifirlaBtn").addEventListener("click", () => {
    if (confirm("Tüm kazanç verilerin silinsin mi?")) {
      yaz("yesilsaat_kazanc", { isSayisi: 0, toplamGram: 0, seri: 0, sonGun: null });
      kazancGoster();
    }
  });

  document.querySelectorAll(".alt-menu button").forEach((b) =>
    b.addEventListener("click", () => sekmeAc(b.dataset.sekme))
  );

  kazancGoster();
  sehirSec(oku("yesilsaat_sehir", HIZLI_SEHIRLER[0]));
}

baslat();
