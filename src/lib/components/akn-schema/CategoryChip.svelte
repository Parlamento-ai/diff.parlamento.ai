<script lang="ts">
	import { categoryOf, CATEGORY_STYLES, type Category } from '$lib/docs/type-categories';

	let {
		typeName,
		size = 'sm',
		showLabel = false
	}: { typeName: string; size?: 'xs' | 'sm'; showLabel?: boolean } = $props();

	const cat = $derived<Category>(categoryOf(typeName));
	const style = $derived(CATEGORY_STYLES[cat]);
</script>

<span
	class="inline-flex items-center gap-1 rounded border font-mono uppercase tracking-wide {style.chip} {size ===
	'xs'
		? 'text-[9px] px-1 py-0'
		: 'text-[10px] px-1.5 py-0.5'}"
	title={style.label}
>
	<span class="w-1.5 h-1.5 rounded-full {style.dot}"></span>
	{showLabel ? style.label : cat}
</span>
