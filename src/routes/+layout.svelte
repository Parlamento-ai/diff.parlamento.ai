<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>AKN++ Comparado Legislativo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
			<a href="/" class="text-lg font-bold text-gray-900 hover:text-emerald-700 transition-colors">
				AKN++
			</a>
			<span class="text-xs text-gray-400 hidden sm:inline">Comparado Legislativo</span>
		</div>
	</header>
	{@render children()}
</div>
