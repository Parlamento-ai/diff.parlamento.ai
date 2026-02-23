<script lang="ts">
	import type { DocumentType } from '$lib/types';
	import type { Vote } from '$lib/types';

	let {
		slug,
		label,
		date,
		type,
		author,
		active = false,
		isLast = false,
		href,
		voteResult
	}: {
		slug: string;
		label: string;
		date: string;
		type: DocumentType;
		author: string;
		active?: boolean;
		isLast?: boolean;
		href: string;
		voteResult?: Vote['result'];
	} = $props();

	const colorMap: Record<DocumentType, { dot: string; activeDot: string; badge: string }> = {
		act: {
			dot: 'bg-white border-addition-500',
			activeDot: 'bg-brand border-brand-dark',
			badge: 'bg-addition-50 text-addition-800'
		},
		bill: {
			dot: 'bg-white border-blue-500',
			activeDot: 'bg-blue-100 border-blue-800',
			badge: 'bg-blue-50 text-blue-800'
		},
		amendment: {
			dot: 'bg-white border-amber-500',
			activeDot: 'bg-amber-100 border-amber-800',
			badge: 'bg-amber-50 text-amber-800'
		},
		doc: {
			dot: 'bg-white border-gray-500',
			activeDot: 'bg-gray-100 border-gray-800',
			badge: 'bg-gray-50 text-gray-800'
		}
	};

	const colors = $derived(colorMap[type]);
</script>

<a
	{href}
	data-sveltekit-noscroll
	class="group relative flex items-start gap-3 py-3 px-2 rounded-md transition-colors
		{active ? 'bg-gray-100' : 'hover:bg-gray-50'}"
>
	<!-- Dot + Line -->
	<div class="flex flex-col items-center shrink-0">
		<div
			class="w-4 h-4 rounded-full border-2 transition-transform
				{active ? colors.activeDot + ' scale-125 shadow-sm' : colors.dot + ' group-hover:scale-110'}"
		></div>
		{#if !isLast}
			<div class="w-0 h-full min-h-8 border-l-2 border-dashed border-gray-300 mt-1"></div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0 -mt-0.5">
		<div class="flex items-center gap-2 flex-wrap">
			<span class="text-sm font-medium text-gray-900 {active ? 'font-semibold' : ''}">{label}</span>
			<span class="badge {colors.badge}">{type}</span>
		</div>
		<p class="text-xs text-gray-500 mt-0.5">{date}</p>
		{#if author}
			<p class="text-xs text-gray-400 truncate">{author}</p>
		{/if}
		{#if voteResult}
			<p class="text-xs font-medium mt-0.5 {voteResult === 'approved' ? 'text-addition-500' : voteResult === 'rejected' ? 'text-deletion-500' : 'text-gray-400'}">
				{voteResult === 'approved' ? '\u2713 Aprobado' : voteResult === 'rejected' ? '\u2717 Rechazado' : voteResult === 'withdrawn' ? 'Retirado' : voteResult}
			</p>
		{/if}
	</div>
</a>
