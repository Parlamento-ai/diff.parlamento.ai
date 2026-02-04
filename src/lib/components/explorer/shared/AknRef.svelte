<script lang="ts">
	import type { ManifestEntry } from '$lib/types/explorer';
	import type { Snippet } from 'svelte';

	let { href, manifest = [], linkBase = '/docs/explorer', children }: {
		href: string;
		manifest?: ManifestEntry[];
		linkBase?: string;
		children: Snippet;
	} = $props();

	const resolvedHref = $derived.by(() => {
		const entry = manifest.find((d) => d.uri === href);
		if (entry) return `${linkBase}${href}`;
		if (href.startsWith('/akn/')) return `${linkBase}${href}`;
		if (href.startsWith('#')) return href;
		return href;
	});
</script>

<a
	href={resolvedHref}
	class="text-brand-dark underline decoration-brand/50 underline-offset-2 hover:decoration-brand transition-colors"
>{@render children()}</a>
