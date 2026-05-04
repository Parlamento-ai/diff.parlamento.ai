<script lang="ts">
	import { getTermDef } from '$lib/docs/term-definitions';

	type Child = { name: string; purpose: string; children: Child[] };
	let {
		name,
		inlineChildren = []
	}: { name: string; inlineChildren?: Child[] } = $props();

	const def = $derived(getTermDef(name));
	// Children to surface inline. Prefer the ones passed in (they come from the
	// parent's anatomy and already carry their own grandchildren). Fall back to
	// the element's own depth-0 anatomy parts when nothing was passed.
	const children: Child[] = $derived(
		inlineChildren.length > 0
			? inlineChildren
			: (def?.anatomy?.parts.filter((p) => (p.depth ?? 0) === 0) ?? []).map((p) => ({
					name: p.name,
					purpose: p.purpose,
					children: []
				}))
	);
</script>

{#snippet childRow(c: Child)}
	{#if c.children.length > 0}
		<details class="group">
			<summary
				class="flex items-baseline gap-2 cursor-pointer list-none select-none hover:bg-gray-100 -mx-1 px-1 py-0.5 rounded"
			>
				<span class="text-gray-300 transition-transform group-open:rotate-90 text-[10px] leading-none"
					>▸</span
				>
				<a
					href="/docs/explorer/schema/{c.name}"
					class="font-mono text-xs text-gray-800 hover:text-addition-700 hover:underline underline-offset-2"
					onclick={(e) => e.stopPropagation()}
				>
					&lt;{c.name}&gt;
				</a>
				<span class="text-gray-400 mx-1">—</span>
				<span class="text-xs text-gray-600">{c.purpose}</span>
			</summary>
			<ul class="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
				{#each c.children as gc (gc.name)}
					<li class="text-xs text-gray-600">
						<a
							href="/docs/explorer/schema/{gc.name}"
							class="font-mono text-gray-800 hover:text-addition-700 hover:underline underline-offset-2"
							>&lt;{gc.name}&gt;</a
						>
						<span class="text-gray-400 mx-1.5">—</span>
						{gc.purpose}
					</li>
				{/each}
			</ul>
		</details>
	{:else}
		<div class="flex items-baseline gap-1 pl-3">
			<a
				href="/docs/explorer/schema/{c.name}"
				class="font-mono text-xs text-gray-800 hover:text-addition-700 hover:underline underline-offset-2"
				>&lt;{c.name}&gt;</a
			>
			<span class="text-gray-400 mx-1">—</span>
			<span class="text-xs text-gray-600">{c.purpose}</span>
		</div>
	{/if}
{/snippet}

{#if def}
	<div class="space-y-3 px-4 py-3 bg-gray-50 border-l-2 border-gray-200">
		<p class="text-sm text-gray-700 max-w-3xl leading-relaxed">{def.paragraph}</p>

		{#if def.fits}
			<p class="text-xs text-gray-600 max-w-3xl">
				<span class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mr-2">Where it fits</span>
				{def.fits}
			</p>
		{/if}

		{#if children.length > 0}
			<div class="space-y-1.5 pt-1">
				<div class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
					What's inside &lt;{name}&gt;
				</div>
				<ul class="space-y-1">
					{#each children as c (c.name)}
						<li>{@render childRow(c)}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="pt-1">
			<a
				href="/docs/explorer/schema/{name}"
				class="text-xs text-addition-700 hover:text-addition-500 underline underline-offset-2"
			>
				Open &lt;{name}&gt; page →
			</a>
		</div>
	</div>
{:else}
	<div class="px-4 py-3 bg-gray-50 border-l-2 border-gray-200">
		<p class="text-xs text-gray-500 italic">
			No definition yet for &lt;{name}&gt;.
		</p>
	</div>
{/if}
