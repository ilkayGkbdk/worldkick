# Tahmin Oyunu v2 — Kilit · Ağaç · Paylaşım (Tasarım)

**Tarih:** 2026-06-09
**Durum:** Onaylandı
**Bağlam:** Mevcut Tahmin Oyunu'nu (rolling kilit + gün-1 şampiyon + gerçek-sonuç turdan-tura bracket) klasik bir "turnuva öncesi doldur-kilitle" deneyimine evriltir. Mevcut implementasyonun bir kısmını **değiştirir**.

## Onaylanan kararlar

1. **Tek kilit (turnuva başı):** Tüm tahminler (grup maç skorları + bracket + şampiyon) **açılış maçının başlama anına kadar** istenildiği kadar düzenlenir; o andan sonra **salt-okunur**. Arkadaşlar da kendi tahminlerini bu ana kadar yapabilir.
2. **Katmanlı bracket ağacı:** Turnuva başlamadan kullanıcı takımları daraltır — Son 16 (16) → Çeyrek (8) → Yarı (4) → Final (2) → Şampiyon (1). Her kat bir alttakinin alt kümesidir. Dikey daralan piramit olarak görselleşir (parıltılı şampiyon, omurga çizgisi, tur puan rozetleri).
3. **Puanlama:** Grup maç skoru 5/3/2 (değişmez). Bracket katmanları, **gerçekte o tura ulaşan her doğru takım** için: Son16 **1**, Çeyrek **2**, Yarı **4**, Final **6**, Şampiyon **10**.
4. **URL paylaşımı (salt-okunur):** Tüm tahminler URL'e kodlanır; arkadaş açınca senin ağacını + skor tahminlerini salt-okunur görür, "Kendi tahminini yap" ile kendi tahminine geçer. Açanın kendi verisi bozulmaz.

## Mevcut koddan değişimler

- **`predictions` store:** `bracketPicks` (maçId→kazanan) **kaldırılır**; yerine `bracket: { r16: string[], qf: string[], sf: string[], final: string[] }` ve mevcut `champion: string|null`, `matchScores` korunur. Yeni metotlar: `toggleTier(tier, teamId)` (katmana ekle/çıkar, kapasite ve alt-küme kuralıyla), `setChampion`, `setMatchScore`, `clearMatchScore`, `replaceAll(state)` (URL'den içe aktarma değil — salt-okunur görünüm için store'a değil bileşene geçilir).
- **`prediction-scoring.js`:** `scoreMatch` (korunur); `scoreBracket`/`isBracketPredictable`/`isMatchPredictable`/`isChampionLocked` **kaldırılır/değişir**. Yeni: `isLocked(matches, nowMs)` (açılış maçı başladı mı), `reachedRound(matches)` (her tura ulaşan takım kümeleri), `scoreBracketTree(bracket, matches)` (katman ağırlıklı puan), `scoreChampion(champion, matches)`, güncellenmiş `computePredictionScore`.
- **`Predictions.svelte`:** yeniden yapılandırılır — kilit geri sayım/banner, grup maç skoru tahminleri (yalnızca grup maçları; eleme maç-skoru yok çünkü eşleşmeler bilinmez), bracket ağacı bölümü, kaydet & paylaş.
- **`PredictMatch.svelte`:** kilit artık **global** (turnuva başı), maç-başı değil.
- **`BracketPredict.svelte` (turdan tura) → `BracketTree.svelte`** (katmanlı piramit; hem düzenleme hem görselleştirme) ile değiştirilir.
- **`ChampionPicker.svelte`:** şampiyon artık ağacın tepesi (Final'deki 2 takımdan biri); ayrı 48'li grid kaldırılır, şampiyon ağaçta seçilir.

## Veri modeli (`localStorage` `wk-predictions`)

```js
{
  matchScores: { [groupMatchId]: { home: number, away: number } },
  bracket: { r16: string[], qf: string[], sf: string[], final: string[] }, // teamId listeleri
  champion: string | null
}
```
Kurallar (store metotları zorlar): `qf ⊆ r16`, `sf ⊆ qf`, `final ⊆ sf`, `champion ∈ final`; kapasiteler 16/8/4/2/1. Bir takımı bir üst kata taşımak alt katlarda da bulunmasını gerektirir; alt kattan çıkarmak üst katlardan da düşürür.

## Puanlama (saf, TDD — `prediction-scoring.js`)

- `scoreMatch(pred, match)` — değişmez (5/3/2).
- `reachedRound(matches)` → `{ r16:Set, qf:Set, sf:Set, final:Set, champion:string|null }`: bir takım, `stage`'i o tur olan **finished/live/scheduled** bir eleme maçında yer alıyorsa o tura "ulaşmış" sayılır (eşleşince takım bilinir). `champion` = finalin kazananı (`winner`).
- `TIER_WEIGHTS = { r16:1, qf:2, sf:4, final:6 }`; şampiyon 10.
- `scoreBracketTree(bracket, matches)` → her katman için: kullanıcının o kat listesindeki, gerçekte o tura ulaşan her takım × ağırlık, toplanır.
- `scoreChampion(champion, matches)` → finalin kazananı `champion` ise 10, değilse 0.
- `computePredictionScore(predictions, matches)` → `{ matchPoints, bracketPoints, championPoints, total, scoredCount, correctCount, exactCount, best }` (matchPoints yalnız grup maçlarından; bracketPoints + championPoints eklenir).
- `isLocked(matches, nowMs=Date.now())` → en erken maç (`datetimeUTC`) başladıysa true.

## URL paylaşımı

- `src/lib/share/predictions-url.js`: `encodePredictions(predictions)` → kompakt JSON'u `lz-string` `compressToEncodedURIComponent` ile kısa, URL-güvenli stringe çevirir; `decodePredictions(str)` tersi (hatalıysa null). (`lz-string` küçük bağımlılık.)
- Route: hash router'a `'/p/:payload': SharedPrediction` eklenir. `SharedPrediction.svelte` payload'ı çözer, **salt-okunur** olarak `BracketTree` (readonly) + skor kartını gösterir; geçersizse hata + ana sayfa linki; üstte "Bu bir arkadaşının tahmini" rozeti ve **"Kendi tahminini yap"** → `#/predictions`.
- Hub'daki paylaş düğmesi `#/p/<payload>` mutlak URL üretir; `navigator.share` varsa paylaşır, yoksa panoya kopyalar (geri bildirim "Kopyalandı").
- (Mevcut canvas puan-kartı PNG paylaşımı korunur — ayrı, görsel paylaşım; URL ise interaktif.)

## Bileşenler

- **`BracketTree.svelte`** (props: `bracket`, `matches`, `teams`, `readonly`): dikey piramit; şampiyon hero kartı, omurga çizgisi, her tur başlığı + puan rozeti, renkli (gerçek circle-flags) bayrak düğümleri. Düzenlenebilir modda takıma dokun → bir üst kata taşı/indir (store `toggleTier`/`setChampion`), kilitliyse/readonly salt görüntü. Gerçek sonuç geldiyse doğru tahminler vurgulanır (yeşil/işaret).
- **`TierPicker`** (BracketTree içinde): bir kat için takım seçimi; aday havuzu bir alt kat (Son 16 için tüm 48 takım).
- **`LockBanner.svelte`**: kilide kalan süre (geri sayım) veya "Tahminler kilitlendi" durumu.
- **`PredictMatch.svelte`**: global kilit (`isLocked`), aksi halde stepper'lar; kilitli/biten için sonuç + puan (mevcut görünüm).
- **`Predictions.svelte`**: LockBanner + Scorecard + (kilitli değilse) Kaydet/paylaş + grup maç skorları listesi + BracketTree.
- **`SharedPrediction.svelte`**: salt-okunur paylaşım görünümü.

## Test & kapsam

- **TDD:** `scoreMatch` (mevcut), `reachedRound`, `scoreBracketTree`, `scoreChampion`, `computePredictionScore`, `isLocked`; store katman kuralları (`toggleTier` alt-küme/kapasite) saf yardımcı olarak; `encodePredictions`/`decodePredictions` round-trip.
- **Build/dev ile:** BracketTree, LockBanner, SharedPrediction, hub.
- **Geriye dönük veri:** Eski `bracketPicks` içeren localStorage zararsız yok sayılır (yeni alanlar varsayılana düşer).

## Aşamalar (plan task'lara böler)

1. Skorlama v2 (reachedRound, scoreBracketTree, scoreChampion, computePredictionScore, isLocked) — TDD; eski bracket/lock fonksiyonlarını değiştir.
2. `predictions` store v2 (bracket katmanları + toggleTier kuralları) — TDD (saf kural yardımcısı) + store.
3. URL encode/decode (lz-string) — TDD.
4. PredictMatch global kilit + LockBanner.
5. BracketTree (düzenleme + görselleştirme) + hub'a bağla.
6. SharedPrediction route + paylaş düğmesi (URL).
7. Hub yeniden düzeni + eski BracketPredict/ChampionPicker temizliği.

## Kapsam dışı (YAGNI)

- Sunucu/liderlik tablosu. Karşılaştırma (yan yana) görünümü. Eleme maçı skor tahmini (eşleşmeler kilit anında bilinmez). Diğer amiral-gemisi özellikler (#4 hatırlatıcılar, #5 senaryolar — ayrı).
