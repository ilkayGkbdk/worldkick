# WorldKick — Tasarım Dokümanı

**Tarih:** 2026-06-08
**Durum:** Onaylandı

## Amaç

Mobile-first bir 2026 Dünya Kupası (ABD/Kanada/Meksika, 48 takım, 11 Haziran 2026 başlangıç) takip uygulaması. Kullanıcı fikstürleri, bir takımın maçlarını, sıradaki en yakın maçı (geri sayımla), maç saat/stad bilgilerini görür; turnuva başlayınca sonuçlar, grup puan durumları ve eleme bracket'i otomatik dolar. Tamamen ücretsiz, statik, GitHub Pages'te yayınlanır.

## Mimari & Altyapı

- **Vite + Svelte**, statik build → GitHub Pages.
- **Yönlendirme:** hash-router (`svelte-spa-router`), çünkü GitHub Pages tek sayfalı statik barındırma yapar.
- **Veri akışı:** `/public/data/*.json` dosyaları tek doğruluk kaynağıdır. Uygulama açılışta `fetch` eder. Backend yoktur.
- **Otomatik güncelleme:** GitHub Actions cron workflow'u (turnuva günlerinde ~15 dk'da bir) ücretsiz **football-data.org** API'sinden veri çeker, JSON'ları yeniden üretir, değişiklik varsa commit eder. API anahtarı GitHub **Secret** olarak saklanır (tarayıcıda görünmez).
- **Tema:** CSS değişkenleri + Svelte store. `light` / `dark` / `system`. Seçim `localStorage`'da; `system` modu `prefers-color-scheme` ile dinlenir.

## Veri Modeli (`/public/data/`)

- **`teams.json`** — `{ id, name, code, group, flag }`. Bayraklar circle-flags SVG seti (yerelde paketli, offline çalışır).
- **`matches.json`** — `{ id, stage, group, homeId, awayId, datetimeUTC, venue, city, status, homeScore, awayScore, scorers[] }`. Saatler UTC saklanır, cihazın yerel saatine çevrilir.
- **`standings.json`** — gruptan üretilir: `{ group, rows: [{ teamId, P, W, D, L, GF, GA, GD, Pts }] }`. Action tarafından hesaplanır.
- **`meta.json`** — `{ lastUpdated, currentMatchday }`.

Fikstür/takım/stad verisi başta elle hazırlanıp commit edilir. Turnuva başlayınca Action skor + standings alanlarını doldurur.

## Ekranlar & Navigasyon

Altta 4 sekmeli tab bar:

1. **Ana Sayfa** — sıradaki maç + geri sayım, bugünün maçları, favori takım kısayolu.
2. **Fikstür** — tüm maçlar; güne ve gruba göre filtre, tarih şeridi.
3. **Turnuva** — grup puan durumları + eleme bracket'i (sekme içi geçiş).
4. **Favoriler** — favori takımların maçları + takım detayına giriş.

Tab dışı detay sayfaları:
- **Maç detayı** — saat, stad, şehir, kadro/golcüler, sonuç.
- **Takım detayı** — grup, tüm maçlar, favoriye ekle/çıkar.

Header'da tema değiştirici ikon.

## Görsel Yön

B (minimal/temiz) tabanı + A (editorial) kalın tipografisi. Bol boşluk, yumuşak kartlar, güçlü grotesk başlıklar (Space Grotesk / Sora), gövde system-ui. Tek vurgu rengi pembe-kırmızı `#ff2e63`. Aydınlık ve karanlık tema aynı tasarım, farklı palet.

## İkonlar, Animasyon & Cila

- **Bayraklar:** circle-flags SVG (paketli).
- **İkonlar:** Lucide.
- **Animasyonlar (Svelte transitions):** geri sayım rakamlarında flip/fade; sekme geçişlerinde fade/fly; listelerde stagger; maç bitince/favori gol atınca canvas-confetti; skor güncellenince count-up.
- **Erişilebilirlik:** `prefers-reduced-motion` ile animasyonlar kapanır; renk kontrastı WCAG AA.
- **PWA:** manifest + service worker → "ana ekrana ekle" + offline. v1'e dahil.

## Test & Yayın

- **Test:** Vitest ile saf mantık birim testleri — standings hesabı, geri sayım, UTC→yerel saat dönüşümü, filtreleme.
- **`deploy.yml`:** `main`'e push'ta Vite build + GitHub Pages yayını. `vite.config` içinde `base: '/worldkick/'`.
- **`update-data.yml`:** cron + `workflow_dispatch`; football-data.org'dan çekip JSON üretir, değişiklik varsa `chore: update match data` ile commit eder.
- **`.gitignore`:** `node_modules/`, `dist/`, `.superpowers/`.

## Kapsam Dışı (YAGNI)

- Canlı dakika dakika skor (gerek yok; periyodik Action güncellemesi yeterli).
- Kullanıcı hesapları / bulut senkron (favoriler `localStorage`'da).
- Çoklu turnuva desteği (sadece 2026 Dünya Kupası).
