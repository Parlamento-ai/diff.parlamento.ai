<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	const firstSlug = $derived(data.boletin.timeline[0]?.slug || 'original');

	// Redirect to the first available timeline step.
	$effect(() => {
		goto(`/pro/${data.boletin.slug}/${firstSlug}`, { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-sm text-gray-400">Cargando...</p>
</div>
