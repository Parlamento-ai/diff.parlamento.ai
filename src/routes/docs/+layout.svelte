<script lang="ts">
	import { page } from '$app/state';
	import type { ExplorerDocType } from '$lib/types/explorer';
	import { chipStyleOf } from '$lib/docs/type-categories';

	let { data, children } = $props();

	const activeSlug = $derived(page.params.slug || '');
	const isExplorerDoc = $derived(
		activeSlug.startsWith('explorer/') &&
			!activeSlug.startsWith('explorer/schema/') &&
			activeSlug.split('/').length > 2
	);

	const akndiffDocs = $derived(data.docs.filter((d: any) => d.section === 'akndiff'));
	const akndbDocs = $derived(data.docs.filter((d: any) => d.section === 'akndb'));
	const explorerDocs = $derived(data.docs.filter((d: any) => d.section === 'explorer'));
	const aknDocs = $derived(data.docs.filter((d: any) => d.section === 'akn'));

	// Pull the type name out of an explorer entry slug ('explorer/schema/bill' → 'bill')
	const typeOf = (slug: string) => slug.replace(/^explorer\/(schema\/)?/, '');
</script>

<div class="max-w-7xl mx-auto px-4 py-4">
	<!-- Breadcrumbs -->
	<nav class="text-xs font-mono text-gray-400 mb-4 flex items-center gap-1.5">
		<a href="/" class="hover:text-gray-600 transition-colors">Inicio</a>
		<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
		<a href="/docs/akndiff/overview" class="hover:text-gray-600 transition-colors">Docs</a>
		{#if isExplorerDoc}
			<svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<a href="/docs/explorer/overview" class="hover:text-gray-600 transition-colors">Explorer</a>
		{/if}
	</nav>

	<div class="flex gap-6">
		<!-- Sidebar navigation -->
		<aside class="hidden lg:block w-56 shrink-0">
			<div class="sticky top-20 space-y-3">
				<!-- AKN Diff section -->
				<div class="rounded-[10px] border border-addition-200 bg-addition-50 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-addition-800 px-2 py-1 mb-1">
						AKN Diff
					</h3>
					<ul class="space-y-0.5">
						{#each akndiffDocs as doc (doc.slug)}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="block px-2 py-1.5 text-sm rounded-md transition-colors
										{activeSlug === doc.slug
											? 'bg-addition-200/60 text-addition-800 font-medium'
											: 'text-addition-800/70 hover:text-addition-800 hover:bg-addition-100'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- AKN.db section -->
				<div class="rounded-[10px] border border-blue-200 bg-blue-50 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-blue-800 px-2 py-1 mb-1">
						AKN.db
					</h3>
					<ul class="space-y-0.5">
						{#each akndbDocs as doc (doc.slug)}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="block px-2 py-1.5 text-sm rounded-md transition-colors
										{activeSlug === doc.slug
											? 'bg-blue-200/60 text-blue-800 font-medium'
											: 'text-blue-800/70 hover:text-blue-800 hover:bg-blue-100'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Explorer section -->
				<div class="rounded-[10px] border border-purple-200 bg-purple-50 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-purple-800 px-2 py-1 mb-1">
						AKN Explorer
					</h3>
					<ul class="space-y-0.5">
						{#each explorerDocs as doc (doc.slug)}
							{@const t = typeOf(doc.slug)}
							{@const isActive = activeSlug === doc.slug}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-colors {isActive
										? 'bg-purple-200/60'
										: 'hover:bg-purple-100'}"
								>
									<span
										class="badge text-[10px] py-0 px-1 border {chipStyleOf(t).chip}"
									>
										{doc.title}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<!-- AKN section -->
				<div class="card-layout p-3">
					<h3 class="text-xs font-bold font-mono uppercase tracking-wider text-gray-500 px-2 py-1 mb-1">
						Akoma Ntoso
					</h3>
					<ul class="space-y-0.5">
						{#each aknDocs as doc (doc.slug)}
							{@const isSchemaEntry = doc.slug.startsWith('explorer/schema/')}
							{@const isActive = isSchemaEntry
								? activeSlug.startsWith('explorer/schema/')
								: activeSlug === doc.slug}
							<li>
								<a
									href="/docs/{doc.slug}"
									class="block px-2 py-1.5 text-sm rounded-md transition-colors
										{isActive
											? 'bg-gray-100 text-gray-900 font-medium'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
								>
									{doc.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</aside>

		<!-- Mobile nav -->
		<div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] p-2 z-10 overflow-x-auto">
			<div class="flex gap-1.5 px-2">
				{#each data.docs as doc (doc.slug)}
					<a
						href="/docs/{doc.slug}"
						class="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
							{activeSlug === doc.slug
								? doc.section === 'akndiff'
									? 'bg-addition-50 text-addition-800'
									: doc.section === 'akndb'
										? 'bg-blue-50 text-blue-800'
										: doc.section === 'explorer'
											? 'bg-purple-50 text-purple-800'
											: 'bg-gray-100 text-gray-800'
								: 'text-gray-500 hover:bg-gray-50'}"
					>
						{doc.title}
					</a>
				{/each}
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0 pb-16 lg:pb-0">
			{@render children()}
		</div>
	</div>
</div>
