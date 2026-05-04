<script lang="ts">
	import { categoryOf, chipStyleOf } from '$lib/docs/type-categories';

	let {
		typeName,
		href,
		anchor = 'definition',
		variant = 'pill'
	}: {
		typeName: string;
		/** Override target href. Defaults to /docs/explorer/schema/<typeName>#<anchor> */
		href?: string;
		anchor?: 'definition' | 'example' | 'spec';
		/** 'pill' = sibling-chip style, 'inline' = compact inline (used in schema tree) */
		variant?: 'pill' | 'inline';
	} = $props();

	// Document types get their per-type accent; sub-elements keep the 5-category color.
	const style = $derived(chipStyleOf(typeName));
	const tip = $derived(`${categoryOf(typeName)} — ${typeName}`);
	const target = $derived(href ?? `/docs/explorer/schema/${typeName}#${anchor}`);
</script>

{#if variant === 'pill'}
	<a
		{...{ href: target }}
		class="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-mono transition-colors hover:shadow-[0_1px_2px_rgba(0,0,0,0.06)] {style.chip}"
		title={tip}
	>
		<span class="w-1.5 h-1.5 rounded-full {style.dot}"></span>
		<span>&lt;{typeName}&gt;</span>
	</a>
{:else}
	<a
		{...{ href: target }}
		class="inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-mono transition-colors hover:underline {style.chip}"
		title={tip}
	>
		<span class="w-1 h-1 rounded-full {style.dot}"></span>
		{typeName}
	</a>
{/if}
