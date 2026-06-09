<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { matches, teams, loadError, teamById } from '../lib/stores/data.js';
  import { favorites } from '../lib/stores/favorites.js';
  import { getNextMatch, getTeamMatches } from '../lib/utils/fixtures.js';
  import { getCountdown } from '../lib/utils/countdown.js';
  import HeroCountdown from '../components/HeroCountdown.svelte';
  import TeamMarquee from '../components/TeamMarquee.svelte';
  import GroupPreview from '../components/GroupPreview.svelte';
  import MatchRow from '../components/MatchRow.svelte';
  import Flag from '../components/Flag.svelte';

  const STAGE_LABELS = { r32: 'Son 32', r16: 'Son 16', qf: 'Çeyrek Final', sf: 'Yarı Final', final: 'Final', third: 'Üçüncülük' };

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  $: now = Date.now();
  $: next = getNextMatch($matches);
  $: opening = [...$matches].sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))[0] ?? null;
  $: started = opening ? now >= Date.parse(opening.datetimeUTC) : false;
  $: heroLabel = next
    ? (opening && next.id === opening.id ? 'Açılış Maçı'
        : next.group ? `Grup ${next.group}` : (STAGE_LABELS[next.stage] ?? 'Sıradaki maç'))
    : 'Sıradaki maç';

  $: upcoming = [...$matches]
    .filter((m) => Date.parse(m.datetimeUTC) > now)
    .sort((a, b) => Date.parse(a.datetimeUTC) - Date.parse(b.datetimeUTC))
    .slice(0, 4);

  $: groupList = buildGroups($teams);
  $: realTeams = $teams.filter((t) => t.group && t.group !== '?');

  function buildGroups(list) {
    const map = new Map();
    for (const t of list) {
      if (!t.group || t.group === '?') continue;
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group).push(t);
    }
    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([group, teams]) => ({ group, teams }));
  }

  // Animated stat counters
  const cTeams = tweened(0, { duration: 1000, easing: cubicOut });
  const cMatches = tweened(0, { duration: 1000, easing: cubicOut });
  const cGroups = tweened(0, { duration: 1000, easing: cubicOut });
  const cDays = tweened(0, { duration: 1000, easing: cubicOut });
  $: cTeams.set(realTeams.length || $teams.length);
  $: cMatches.set($matches.length);
  $: cGroups.set(groupList.length);
  $: cDays.set(next ? getCountdown(Date.parse(next.datetimeUTC)).days : 0);

  // Live matches (status from periodic data refresh)
  $: live = $matches.filter((m) => m.status === 'live');

  // Favorite spotlight
  $: favTeam = $favorites.length ? teamById($teams, $favorites[0]) : null;
  $: favNext = favTeam ? getNextMatch(getTeamMatches($matches, favTeam.id)) : null;
  $: pickTeams = realTeams.slice(0, 16);
</script>

<div class="home">
  {#if $loadError}
    <p class="err">Veri yüklenemedi: {$loadError}</p>
  {/if}

  <header class="hello reveal" style="--i:0">
    <span class="hi">{greeting} <span class="wave">⚽</span></span>
    <span class="sub">{started ? 'Turnuva sürüyor — iyi seyirler' : 'Dünya Kupası kapıda'}</span>
  </header>

  {#if live.length}
    <section class="reveal" style="--i:1">
      <div class="shead"><h3>● Canlı</h3></div>
      {#each live as m (m.id)}
        <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
      {/each}
    </section>
  {/if}

  {#if next}
    <div class="reveal" style="--i:1">
      <HeroCountdown
        match={next}
        home={teamById($teams, next.homeId)}
        away={teamById($teams, next.awayId)}
        label={heroLabel} />
    </div>
  {/if}

  <div class="stats reveal" style="--i:2">
    <a class="stat" href="#/fixtures"><span class="num">{Math.round($cMatches)}</span><span class="lbl">maç</span></a>
    <a class="stat" href="#/tournament"><span class="num">{Math.round($cTeams)}</span><span class="lbl">takım</span></a>
    <a class="stat" href="#/tournament"><span class="num">{Math.round($cGroups)}</span><span class="lbl">grup</span></a>
    <div class="stat"><span class="num accent">{Math.round($cDays)}</span><span class="lbl">gün kaldı</span></div>
  </div>

  {#if favTeam}
    <section class="reveal" style="--i:3">
      <div class="shead"><h3>Takımın</h3><a href={`#/team/${favTeam.id}`}>Profil →</a></div>
      <a class="favcard" href={`#/team/${favTeam.id}`}>
        <Flag code={favTeam.flag} size={44} />
        <div class="favinfo">
          <strong>{favTeam.name}</strong>
          {#if favNext}
            <span>Sıradaki: {teamById($teams, favNext.homeId)?.code} – {teamById($teams, favNext.awayId)?.code}</span>
          {:else}
            <span>Yaklaşan maç yok</span>
          {/if}
        </div>
        <span class="star">★</span>
      </a>
    </section>
  {:else if pickTeams.length}
    <section class="reveal" style="--i:3">
      <div class="shead"><h3>Takımını seç</h3></div>
      <p class="hint">Bir bayrağa dokun, ana sayfanda öne çıksın.</p>
      <div class="pickrail">
        {#each pickTeams as t (t.id)}
          <button class="pick" on:click={() => favorites.toggle(t.id)} aria-label={`${t.name} favorile`}>
            <Flag code={t.flag} size={34} />
            <span>{t.code}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  {#if upcoming.length}
    <section class="reveal" style="--i:4">
      <div class="shead"><h3>Yaklaşan maçlar</h3><a href="#/fixtures">Tümü →</a></div>
      {#each upcoming as m (m.id)}
        <MatchRow match={m} home={teamById($teams, m.homeId)} away={teamById($teams, m.awayId)} />
      {/each}
    </section>
  {/if}

  {#if groupList.length}
    <section class="reveal" style="--i:5">
      <div class="shead"><h3>Gruplar</h3><a href="#/tournament">Puan durumu →</a></div>
      <GroupPreview groups={groupList} />
    </section>
  {/if}

  {#if realTeams.length}
    <section class="reveal" style="--i:6">
      <div class="shead"><h3>Takımları keşfet</h3></div>
      <TeamMarquee teams={realTeams} />
    </section>
  {/if}
</div>

<style>
  .home { padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 22px; }
  .err { color: var(--accent); }

  .hello { display: flex; flex-direction: column; gap: 3px; }
  .hi { font-family: var(--font-head); font-weight: 800; font-size: 24px; letter-spacing: -.5px; }
  .wave { display: inline-block; animation: kick 2.6s ease-in-out infinite; }
  @keyframes kick { 0%, 88%, 100% { transform: rotate(0); } 92% { transform: rotate(-22deg); } 96% { transform: rotate(14deg); } }
  .sub { font-size: 13px; color: var(--muted); font-weight: 600; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 12px 4px; text-decoration: none; color: var(--text); box-shadow: var(--shadow);
  }
  .num { font-family: var(--font-head); font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums; line-height: 1; }
  .num.accent { color: var(--accent); }
  .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); }

  .shead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  .shead h3 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); }
  .shead a { font-size: 12px; font-weight: 700; color: var(--accent); text-decoration: none; }

  .favcard {
    display: flex; align-items: center; gap: 14px; padding: 14px;
    background:
      radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
      var(--surface);
    border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow);
    text-decoration: none; color: var(--text);
  }
  .favinfo { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .favinfo strong { font-size: 15px; }
  .favinfo span { font-size: 12px; color: var(--muted); }
  .star { color: var(--accent); font-size: 20px; }

  .hint { margin: -2px 0 10px; font-size: 12px; color: var(--muted); }
  .pickrail { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
  .pickrail::-webkit-scrollbar { display: none; }
  .pick {
    flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 5px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 10px 12px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 11px;
    transition: transform .15s ease, border-color .15s ease;
  }
  .pick:active { transform: scale(.94); border-color: var(--accent); }

  .reveal { opacity: 0; transform: translateY(10px); animation: rise .5s ease forwards; animation-delay: calc(var(--i) * 80ms); }
  @keyframes rise { to { opacity: 1; transform: none; } }
</style>
