<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // The desk's own view (CauseTable), one row per problem, each with the ticket filed for it.
  // One-day moves stay counted where they're filed, and get their own row and ticket under it.
  type Ticket = { label: string; href: string; state: string };
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, Ticket> } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const moved = $derived(merged.filter((r) => notes.oneDayMove.includes(r.id)));
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length + (moved.length ? 1 : 0)}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      {@const t = tickets[g.cause]}
      <tr class:open={!t || t.state === 'open'}>
        <td><code>{g.cause}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if t}<a href={t.href}>{t.label}</a>{:else}no ticket{/if}</td>
        <td>{t?.state ?? 'open'}</td>
      </tr>
      {@const n = readAs(g, notes.oneDayMove)}
      {#if n}
        {@const m = tickets.move}
        <tr class="sub" class:open={!m || m.state === 'open'}>
          <td>↳ <code>move</code></td>
          <td>{n}</td>
          <td>{new Set(moved.map((r) => r.tenant)).size}</td>
          <td>{moved.map((r) => r.receivedAt.slice(0, 10)).sort()[0]} → {moved.map((r) => r.receivedAt.slice(0, 10)).sort().at(-1)}</td>
          <td>{#if m}<a href={m.href}>{m.label}</a>{:else}no ticket{/if}</td>
          <td>{m?.state ?? 'open'}</td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<p class="note">↳ read as a one-day move; counted under <code>parser</code> by tenant, as the desk counts them.</p>

<style>
  .sum { font-size: 1.1rem; }
  .sub td { color: var(--muted); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
