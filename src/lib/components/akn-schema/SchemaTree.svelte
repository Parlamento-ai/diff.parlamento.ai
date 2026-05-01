<script lang="ts">
	import type { SchemaNode } from '$lib/akn-schema/types';
	import SchemaNodeView from './SchemaNodeView.svelte';

	let { root, linkBase = '/docs/explorer/schema' }: { root: SchemaNode; linkBase?: string } = $props();
</script>

<div class="font-mono text-sm">
	<SchemaNodeView node={root} {linkBase} depth={0} expanded={true} />
</div>
