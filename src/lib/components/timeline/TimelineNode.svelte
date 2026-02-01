<script lang="ts">
	import type { DocumentType } from '$lib/types';

	let {
		slug,
		label,
		date,
		type,
		author,
		active = false,
		isLast = false,
		href
	}: {
		slug: string;
		label: string;
		date: string;
		type: DocumentType;
		author: string;
		active?: boolean;
		isLast?: boolean;
		href: string;
	} = $props();

	const colorMap: Record<DocumentType, { dot: string; badge: string; line: string }> = {
		act: {
			dot: 'bg-emerald-500 border-emerald-300',
			badge: 'bg-emerald-100 text-emerald-800',
			line: 'bg-emerald-200'
		},
		bill: {
			dot: 'bg-blue-500 border-blue-300',
			badge: 'bg-blue-100 text-blue-800',
			line: 'bg-blue-200'
		},
		amendment: {
			dot: 'bg-amber-500 border-amber-300',
			badge: 'bg-amber-100 text-amber-800',
			line: 'bg-amber-200'
		}
	};

	const colors = $derived(colorMap[type]);
</script>

<a
	{href}
	class="group relative flex items-start gap-3 py-3 px-2 rounded-lg transition-colors
		{active ? 'bg-gray-100' : 'hover:bg-gray-50'}"
>
	<!-- Dot + Line -->
	<div class="flex flex-col items-center shrink-0">
		<div
			class="w-4 h-4 rounded-full border-2 {colors.dot} transition-transform
				{active ? 'scale-125 ring-2 ring-offset-2 ring-gray-300' : 'group-hover:scale-110'}"
		></div>
		{#if !isLast}
			<div class="w-0.5 h-full min-h-8 {colors.line} mt-1"></div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0 -mt-0.5">
		<div class="flex items-center gap-2 flex-wrap">
			<span class="text-sm font-medium text-gray-900 {active ? 'font-semibold' : ''}">{label}</span>
			<span class="text-xs px-1.5 py-0.5 rounded {colors.badge}">{type}</span>
		</div>
		<p class="text-xs text-gray-500 mt-0.5">{date}</p>
		{#if author}
			<p class="text-xs text-gray-400 truncate">{author}</p>
		{/if}
	</div>
</a>
