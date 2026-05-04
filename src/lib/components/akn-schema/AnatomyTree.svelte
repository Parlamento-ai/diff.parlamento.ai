<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Self from './AnatomyTree.svelte';
	import { getTermDef } from '$lib/docs/term-definitions';

	type Node = {
		name: string;
		purpose: string;
		children: Node[];
	};

	let { nodes, depth = 0 }: { nodes: Node[]; depth?: number } = $props();

	function stripBrackets(s: string): string {
		return s.replace(/<\/?([a-zA-Z][\w-]*)>/g, '$1');
	}

	const badgeStyles = [
		'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100',
		'bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100',
		'bg-sky-50 text-sky-800 ring-sky-200 hover:bg-sky-100',
		'bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100',
		'bg-violet-50 text-violet-800 ring-violet-200 hover:bg-violet-100'
	];
	const badge = $derived(badgeStyles[depth % badgeStyles.length]);

	let openName = $state<string | null>(null);

	function rowId(name: string): string {
		return `anatomy-row-${name}`;
	}

	function openFromHash() {
		if (typeof window === 'undefined') return;
		const raw = window.location.hash.slice(1);
		if (!raw) return;
		const name = decodeURIComponent(raw);
		// Only act if this name exists in our subtree — otherwise let other
		// instances handle it. Compare against the names we render here.
		if (!nodes.some((n) => n.name === name) && depth === 0) {
			// At the root, also check nested levels by deferring to children.
			// We don't pre-flatten — the matching child Self instance opens itself.
		}
		if (nodes.some((n) => n.name === name)) {
			openName = name;
			tick().then(() => {
				const el = document.getElementById(rowId(name));
				el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
			});
		}
	}

	onMount(() => {
		openFromHash();
		const handler = () => openFromHash();
		window.addEventListener('hashchange', handler);
		return () => window.removeEventListener('hashchange', handler);
	});

	function toggle(name: string) {
		const next = openName === name ? null : name;
		openName = next;
		// Mirror state into the URL hash so the panel is shareable. Use
		// history.replaceState to avoid filling the back stack with toggles.
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.hash = next ? encodeURIComponent(next) : '';
			window.history.replaceState(null, '', url.toString());
		}
	}
</script>

<ul class="space-y-3">
	{#each nodes as node (node.name)}
		{@const def = getTermDef(node.name)}
		{@const short = def?.short}
		{@const isOpen = openName === node.name}
		<li id={rowId(node.name)} class="space-y-1 scroll-mt-20">
			<div class="flex items-baseline gap-2 flex-wrap">
				<button
					type="button"
					onclick={() => toggle(node.name)}
					aria-expanded={isOpen}
					class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors cursor-pointer {badge}"
				>
					{node.name}
				</button>
				<span class="text-[15px] text-gray-800 leading-snug">{stripBrackets(node.purpose)}</span>
			</div>
			{#if short && short !== node.purpose}
				<p class="text-sm text-gray-500 leading-relaxed max-w-2xl">{stripBrackets(short)}</p>
			{/if}

			{#if isOpen && def}
				<div class="mt-2 max-w-2xl rounded-md border border-gray-200 bg-gray-50/60 px-4 py-3 space-y-2 text-sm">
					{#if def.paragraph && def.paragraph !== short}
						<p class="text-gray-700 leading-relaxed">{stripBrackets(def.paragraph)}</p>
					{/if}
					{#if def.fits}
						<p class="text-gray-600 leading-relaxed">
							<span class="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mr-1.5">Where it lives</span>
							{stripBrackets(def.fits)}
						</p>
					{/if}
					<div class="pt-1">
						<a
							href="/docs/explorer/schema/{node.name}"
							class="text-xs text-addition-700 hover:text-addition-500 underline underline-offset-2"
						>
							Open the full {node.name} page →
						</a>
					</div>
				</div>
			{/if}

			{#if node.children.length > 0}
				<div class="mt-2 ml-3 border-l border-gray-200 pl-4">
					<Self nodes={node.children} depth={depth + 1} />
				</div>
			{/if}
		</li>
	{/each}
</ul>
