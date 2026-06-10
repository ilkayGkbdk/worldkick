<script>
  import { predictions } from '../lib/stores/predictions.js';
  import { reachedRound } from '../lib/utils/prediction-scoring.js';
  import { CAP } from '../lib/utils/bracket-rules.js';
  import Flag from './Flag.svelte';

  export let bracket;          // { r16, qf, sf, final }
  export let champion = null;
  export let matches = [];
  export let teams = [];
  export let readonly = false;

  // Tepeden aşağı: Şampiyon, Final, Yarı, Çeyrek, Son 16
  const TIERS = [
    { key: 'final', label: 'Final', pts: 6 },
    { key: 'sf', label: 'Yarı Final', pts: 4 },
    { key: 'qf', label: 'Çeyrek Final', pts: 2 },
    { key: 'r16', label: 'Son 16', pts: 1 },
  ];

  $: realTeams = teams.filter((t) => t.group && t.group !== '?');
  $: reached = reachedRound(matches);

  function team(id) { return teams.find((t) => t.id === id) ?? null; }
  function candidates(tierKey) {
    if (tierKey === 'r16') return realTeams.map((t) => t.id);
    const lower = { qf: 'r16', sf: 'qf', final: 'sf' }[tierKey];
    return bracket[lower] ?? [];
  }
  function pool(tierKey) {
    const chosen = new Set(bracket[tierKey] ?? []);
    return candidates(tierKey).filter((id) => !chosen.has(id));
  }
  function correct(tierKey, id) { return reached[tierKey]?.has(id); }
</script>

<div class="tree">
  <div class="champ">
    <div class="tlab">Şampiyonun</div>
    {#if champion}
      <button class="cup" class:ok={reached.champion === champion} disabled={readonly}
        on:click={() => !readonly && predictions.setChampion(champion)}>
        <Flag code={team(champion)?.flag} size={30} /> {team(champion)?.name ?? champion} 🏆
      </button>
    {:else}
      <div class="hint">Finaldeki takımlardan birine dokun</div>
    {/if}
  </div>

  <div class="spine"></div>

  {#each TIERS as tier (tier.key)}
    <div class="tier">
      <div class="thead">
        <span class="t">{tier.label}</span>
        <span class="count">{(bracket[tier.key] ?? []).length}/{CAP[tier.key]}</span>
        <span class="pp">+{tier.pts}</span>
      </div>
      <div class="chips">
        {#each bracket[tier.key] ?? [] as id (id)}
          <button class="chip on" class:ok={correct(tier.key, id)} disabled={readonly}
            on:click={() => {
              if (readonly) return;
              if (tier.key === 'final') predictions.setChampion(id);
              else predictions.toggleTier(tier.key, id);
            }}>
            <Flag code={team(id)?.flag} size={18} /> {team(id)?.code ?? id}
            {#if !readonly}<span class="x">×</span>{/if}
          </button>
        {/each}
        {#if (bracket[tier.key] ?? []).length === 0}
          <span class="none">{tier.key === 'final' ? 'Yarı finalden 2 takım seç' : 'henüz seçilmedi'}</span>
        {/if}
      </div>
      {#if !readonly && (bracket[tier.key] ?? []).length < CAP[tier.key]}
        <div class="addrow">
          <span class="addlab">+ Ekle</span>
          <div class="cands">
            {#each pool(tier.key) as id (id)}
              <button class="chip add" on:click={() => predictions.toggleTier(tier.key, id)}>
                <Flag code={team(id)?.flag} size={16} /> {team(id)?.code ?? id}
              </button>
            {/each}
            {#if pool(tier.key).length === 0}
              <span class="none">{tier.key === 'r16' ? '—' : 'önce alttaki turu doldur'}</span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .tree { display: flex; flex-direction: column; gap: 14px; position: relative; }
  .champ { text-align: center; }
  .tlab { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); font-weight: 800; margin-bottom: 8px; }
  .cup { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer;
    padding: 10px 18px; border-radius: 16px; color: #fff; font-weight: 800; font-size: 15px;
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #fff));
    box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 40%, transparent); }
  .cup.ok { outline: 2px solid #2ecc71; outline-offset: 2px; }
  .hint { color: var(--muted); font-size: 12px; }
  .spine { width: 2px; height: 6px; align-self: center; background: var(--accent); border-radius: 2px; }
  .tier { text-align: center; }
  .thead { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
  .thead .t { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); font-weight: 800; }
  .thead .count { font-size: 10px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
  .thead .pp { background: var(--surface); border: 1px solid var(--border); color: var(--accent); border-radius: 999px; font-size: 9px; font-weight: 800; padding: 2px 7px; }
  .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .none { color: var(--muted); font-size: 12px; }

  .addrow { display: flex; align-items: center; gap: 8px; margin-top: 8px;
    background: var(--bg); border: 1px dashed var(--border); border-radius: 12px; padding: 7px 10px; }
  .addlab { flex: 0 0 auto; font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
  .cands { display: flex; gap: 6px; overflow-x: auto; flex: 1; scrollbar-width: none; }
  .cands::-webkit-scrollbar { display: none; }

  .chip { display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: 700; font-size: 11px; flex: 0 0 auto;
    background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px 4px 4px; color: var(--text); white-space: nowrap; }
  .chip.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
  .chip.ok { outline: 2px solid #2ecc71; outline-offset: 1px; }
  .chip:disabled { cursor: default; }
  .chip .x { color: var(--muted); font-weight: 800; margin-left: 2px; }
</style>
