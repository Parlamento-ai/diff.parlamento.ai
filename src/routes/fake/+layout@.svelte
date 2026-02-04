<script lang="ts">
	import '../layout.css';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	{@render children()}
</div>
