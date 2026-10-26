# 🌱 Yeşil Saat

![Climathon](https://img.shields.io/badge/Climathon-COP31-1e8a4c)
![SDG 7](https://img.shields.io/badge/SDG-7%20Temiz%20Enerji-f2c230)
![SDG 13](https://img.shields.io/badge/SDG-13%20%C4%B0klim%20Eylemi-2fb565)
![Open-Meteo](https://img.shields.io/badge/veri-Open--Meteo-blue)
![Gemini](https://img.shields.io/badge/AI-Gemini%20API-8E75B2)

> ⚠️ **Not:** Uygulamanın asıl sürümü Google AI Studio (Build mode) ile geliştirildi. Bu depodaki kod, proje tasarım raporundaki (PDR) akış ve formüllere göre hazırlanmış **geçici bir sürümdür**. AI Studio'daki orijinal kod kısa süre içinde bu depoya yüklenecektir.

**Yeşil Saat**, elektriğin en temiz üretileceği saati tahmin eden, yapay zekâ destekli, mobil uyumlu bir web uygulamasıdır. Kullanıcıya çamaşır, bulaşık, kurutma ve elektrikli araç şarjı gibi esnek işleri o saate kaydırmasını önerir.

> Yeşil Saat tüketimi azaltmaz, **tüketimin zamanını kaydırır.**

Climathon kapsamında **COP31** elektrifikasyon hedefi (2035'e kadar %35) ve **Siemens Decarbonization & Energy** teması için geliştirilmiştir.

## Nasıl Çalışır?

1. Kullanıcı bir **şehir** seçer.
2. Uygulama o şehrin **ertesi günkü saatlik hava tahminini** (güneş radyasyonu, rüzgâr, bulutluluk) Open-Meteo'dan kendisi çeker.
3. Kullanıcı **cihazını**, işi yapabileceği **saat aralığını** ve **alışılmış başlama saatini** seçer.
4. Ekranda 24 saatlik **yeşil–sarı–kırmızı çizelge** görünür.
5. Uygulama aralıktaki **en temiz başlangıç saatini** önerir ve alışılmış saate göre **önlenen emisyonu** hesaplar.
6. **Gemini** sonucu sade Türkçe bir açıklamaya çevirir.
7. Kullanıcı işi **"Yaptım"** ile işaretler; kazancı, serisi ve rozetleri birikir.

## Hesaplama

| Büyüklük | Formül / Değer |
|---|---|
| Yenilenebilir pay (%) | `8 + (radyasyon/900 × 38) + (min(rüzgâr,40)/40 × 35)`, %3–90 arası |
| Emisyon yoğunluğu | `700 − 6 × pay` (g CO₂/kWh) |
| Cihaz tüketimleri | Çamaşır 1 kWh · Bulaşık 1,2 kWh · Kurutma 2,5 kWh · Elektrikli araç 10 kWh |
| Gündelik karşılıklar | ≈170 g = 1 km araç · ≈8 g = 1 telefon şarjı · Ağaç ≈58 g/gün |

Bu değerler **tahmin ve varsayımdır**. Yenilenebilir pay gerçek üretim verisinden değil, hava verisinden hesaplanır.

## Teknolojiler

| Katman | Kullanılan |
|---|---|
| Arayüz | HTML, CSS, JavaScript (mobil uyumlu, 5 sekme) |
| Veri | [Open-Meteo API](https://open-meteo.com) (anahtarsız) |
| Yapay zekâ | Gemini API |
| Kayıt | Tarayıcıda yerel (localStorage) |

## Çalıştırma

Kurulum gerekmez. `index.html` dosyasını tarayıcıda açman yeterli.

Gemini açıklamaları için uygulamadaki **Ayarlar** sekmesine kendi [Gemini API anahtarını](https://aistudio.google.com/apikey) gir. Anahtar yalnızca senin tarayıcında saklanır, hiçbir yere yüklenmez. Anahtar girilmezse uygulama hazır bir açıklama şablonu kullanır.

## Dosyalar

- `index.html`: Arayüz (Planla, Çizelge, Öneri, Kazancım, Ayarlar)
- `hesap.js`: Yenilenebilir pay, emisyon ve en temiz saat hesapları
- `app.js`: Hava verisi, Gemini entegrasyonu ve kazanç takibi
- `style.css`: Açık ve koyu tema destekli tasarım

## Yol Haritası

| Aşama | Ne yapar | Durum |
|---|---|---|
| 1. Öneri | Şehre göre ertesi günün en temiz saatini söyler, Gemini ile açıklar | ✅ Çalışıyor |
| 2. Otomasyon | Bağlantılı çamaşır/bulaşık makinelerini en temiz saatte başlatır | ⏳ Sonraki aşama |
| 3. Ödül | Doğrulanan temiz saat kullanımına puan ve sponsorlu ödül | 💡 Vizyon |

**Sonraki adımlar:** EPİAŞ Şeffaflık Platformu verisiyle ML modeli eğitmek, 5–10 kişilik kullanıcı testi, Isparta'da 100 hanelik pilot.

## Geliştirici

**Beyzanur Kaya**, Süleyman Demirel Üniversitesi
[GitHub](https://github.com/Beyzanrkya) · [LinkedIn](https://www.linkedin.com/in/beyza-nur-kaya-795b3629a)
