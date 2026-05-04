<script lang="ts">
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

	// Track which row is expanded — one at a time per tree level keeps the
	// reader oriented without forcing them to re-collapse before opening another.
	let openName = $state<string | null>(null);

	function toggle(name: string) {
		openName = openName === name ? null : name;
	}
</script>

<ul class="space-y-3">
	{#each nodes as node (node.name)}
		{@const def = getTermDef(node.name)}
		{@const short = def?.short}
		{@const isOpen = openName === node.name}
		<li class="space-y-1">
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
