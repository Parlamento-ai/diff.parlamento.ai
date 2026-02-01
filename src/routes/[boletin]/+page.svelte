<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Redirect to the "original" version
	$effect(() => {
		goto(`/${data.boletin.slug}/original`, { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-sm text-gray-400">Cargando...</p>
</div>
