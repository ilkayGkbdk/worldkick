# Tahmin Oyunu (Prediction Game) — Tasarım Dokümanı

**Tarih:** 2026-06-09
**Durum:** Onaylandı
**Üst proje:** WorldKick (mobile-first 2026 Dünya Kupası takip uygulaması). Bu, 5 amiral-gemisi özelliğin ilki; kendi spec → plan → uygulama döngüsüne sahip.

## Amaç

Kullanıcıyı izleyiciden katılımcıya çevirmek: maç skorlarını ve eleme sonuçlarını tahmin et, gerçek sonuçlar geldikçe puanlan, bir "tahmin karnesi" biriktir ve paylaş. Tamamen statik/ücretsiz mimariyle uyumlu — backend yok; tahminler `localStorage`'da, puanlama client'ta mevcut `matches.json` verisinden hesaplanır.

## Çekirdek model (onaylanan kararlar)

- **Hibrit tahmin:** Grup + eleme maçlarında **skor tahmini** (rolling — her maçtan önce) + eleme turlarında **kazanan tahmini** (bracket) + baştan **şampiyon** tahmini.
- **Bracket kaynağı:** Şampiyon en baştan 48 takımdan seçilir. Eleme maçları, gerçek eşleşen takımlar belli olunca (gruplar bitince) tahmin edilebilir hale gelir; FIFA'nın karmaşık eşleştirme kuralları yeniden simüle edilmez.
- **Paylaşım:** Paylaşılabilir puan kartı (canvas → PNG). Tam tahmin karşılaştırması (URL) kapsam dışı (sonraki sürüm).
- **Navigasyon:** Alt bara 5. sekme "🎯 Tahmin" + adanmış hub.

## Veri modeli (`localStorage`)

Anahtar `wk-predictions`:
```js
{
  matchScores: { [matchId]: { home: number, away: number } },
  bracketPicks: { [matchId]: string /* kazanan teamId */ },
  champion: string | null /* teamId */
}
```
Maç/takım kimlikleri mevcut `matches.json`/`teams.json` şemasındaki `id` değerleridir. Bu store sadece kullanıcının ham seçimlerini tutar; puan **türetilmiş**tir, saklanmaz.

## Puanlama (saf fonksiyonlar — `src/lib/utils/prediction-scoring.js`)

**Maç skoru** (status `finished` olan grup + eleme maçları; `homeScore`/`awayScore` sayı):
- Tam skor (home & away birebir) → **5**
- Doğru averaj farkı (predHome−predAway === realHome−realAway, ama tam skor değil; beraberlikler dahil) → **3**
- Doğru sonuç (sign(predHome−predAway) === sign(realHome−realAway)) → **2**
- Aksi → **0**

**Bracket** (eleme maçında kazananı doğru bilmek; maç `finished` ve kazanan belli):
- Son32 **1**, Son16 **2**, Çeyrek **4**, Yarı **6**, Final **8**
- Maçın turu `stage` alanından (`r32/r16/qf/sf/final`) belirlenir.

**Şampiyon** (`champion` seçimi turnuva şampiyonuyla eşleşirse): **+10**. Şampiyon, finali kazanan takımdır; final `finished` olduğunda hesaplanır.

**Türetilen karne** (`computePredictionScore(predictions, matches)` → nesne):
`{ matchPoints, bracketPoints, championPoints, total, scoredCount, correctCount, exactCount, best }` — `best`: en yüksek puanı getiren maç tahmini (kart/özet için).

## Kilit & uygunluk

- Maç skor tahmini: maçın `datetimeUTC` başlangıcına kadar düzenlenebilir; sonra kilitli (salt-okunur, puanlanır).
- Bracket maçı: iki gerçek takımı da `teams` içinde çözülebiliyorsa **ve** başlamamışsa tahmin edilebilir; aksi halde "henüz açılmadı".
- Şampiyon: ilk eleme (`r32`) maçının başlangıcına kadar düzenlenebilir.

## Ekranlar & bileşenler

- **Tab bar değişikliği:** `Icon.svelte`'e `target` ikonu; `TabBar.svelte`'e `{ path: '/predictions', icon: 'target', label: 'Tahmin' }` (sıra: Ana · Fikstür · Turnuva · Tahmin · Favori). `App.svelte` `routes`'a `'/predictions': Predictions`.
- **`src/routes/Predictions.svelte` (hub):** üstte **PredictionScorecard** (toplam puan, isabet %, en iyi tahmin, şampiyon satırı); **ChampionPicker** girişi; **sıradaki tahminler** listesi (`PredictMatch`); kilitlenmiş/puanlanmış tahminler; eleme açılınca **bracket tahmin** bölümü; "Kartı paylaş" düğmesi.
- **`src/components/PredictMatch.svelte`:** iki takım + skor stepper'ları (+/–, 0..n), "kaydet/kilitli" durumu, kilitliyse sonuç + kazanılan puan rozeti.
- **`src/components/ChampionPicker.svelte`:** 48 takım bayrak grid; seçim store'a yazılır; kilitliyse salt-okunur.
- **`src/components/PredictionScorecard.svelte`:** karne özeti (count-up animasyonlu sayılar projedeki kalıba uygun).
- **`src/components/BracketPredict.svelte`:** eleme turları; her açık maçta kazanan seçimi (iki takımdan biri).
- **Küçük dokunuş:** `MatchDetail.svelte`'e kullanıcının tahmini varsa küçük rozet ("Tahminin: 2-1").
- **Store:** `src/lib/stores/predictions.js` — `predictions` (subscribable) + `setMatchScore(id, home, away)`, `clearMatchScore(id)`, `setBracketPick(id, teamId)`, `setChampion(teamId)`; `localStorage`'a yazar (mevcut `favorites.js` kalıbı).

## Paylaşılabilir puan kartı

`src/lib/share/scorecard-canvas.js` — `renderScorecard(canvas, { total, accuracy, championTeam, exactCount })` ile koyu zeminli, pembe aksanlı, WorldKick markalı bir kart çizer. Hub'daki "Kartı paylaş" düğmesi PNG üretir; `navigator.share` (dosya destekliyorsa) ile paylaşır, yoksa indirir. Bayrak görseli için circle-flags SVG'si canvas'a çizilir (Image ile).

## Test & kapsam

- **TDD:** `prediction-scoring.js` saf fonksiyonları (maç puanı, bracket puanı, şampiyon, `computePredictionScore`, kilit-uygunluk yardımcıları) Vitest ile.
- **Build ile doğrulama:** store, ekranlar, canvas kartı.
- **Uygulama aşamaları (plan bunları task'lara böler):**
  1. `predictions` store + `prediction-scoring` (TDD) + "Tahmin" sekmesi/route/hub iskeleti.
  2. Maç skor tahmini (`PredictMatch` + steppers + kilit) + `PredictionScorecard`.
  3. `ChampionPicker` + şampiyon puanı.
  4. `BracketPredict` (eleme turdan tura) + bracket puanı.
  5. Paylaşılabilir puan kartı (canvas → PNG).

## Kapsam dışı (YAGNI)

- URL ile tam tahmin paylaşımı / arkadaş karşılaştırması (sonraki sürüm).
- Sunucu tarafı liderlik tablosu (backend yok).
- Asistler/detaylı istatistik tahmini (free tier veri vermiyor).
- Diğer 4 amiral-gemisi özelliği (ayrı spec'ler): takım-rengi kişiselleştirme, canlı mod, hatırlatıcılar, senaryolar.
