<script lang="ts">
	import '../layout.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { MetaTags } from 'svelte-meta-tags';

	let { data, children } = $props();

	const country = $derived($page.params.country as string | undefined);
	const type = $derived($page.params.type as string | undefined);

	const types = $derived(country ? (data.typesByCountry[country] ?? []) : []);

	function switchCountry(nextCode: string) {
		const nextTypes = data.typesByCountry[nextCode] ?? [];
		if (!nextTypes.length) {
			goto(`/demo/${nextCode}`);
			return;
		}
		const keep = type && nextTypes.some((t) => t.type === type) ? type : nextTypes[0].type;
		goto(`/demo/${nextCode}/${keep}`);
	}

	function isTypeActive(t: string) {
		return type === t;
	}
</script>

<MetaTags title="Research demo" titleTemplate="%s | Diff research" />

<div class="min-h-screen bg-gray-50 font-mono text-sm text-gray-900">
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
			<a
				href="/"
				class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900"
			>
				← main app
			</a>

			<a href="/demo" class="text-sm font-bold tracking-tight">research demo</a>

			{#if data.countries.length}
				<label class="ml-4 flex items-center gap-2 text-xs text-gray-500">
					<span class="uppercase tracking-wider">org</span>
					<select
						class="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
						value={country ?? ''}
						onchange={(e) => switchCountry((e.currentTarget as HTMLSelectElement).value)}
					>
						{#if !country}
							<option value="" disabled>— pick —</option>
						{/if}
						{#each data.countries as c (c.code)}
							<option value={c.code}>{c.code.toUpperCase()} — {c.name}</option>
						{/each}
					</select>
				</label>
			{/if}

			<a
				href="/docs/akndb/overview"
				class="ml-auto text-xs text-gray-500 hover:text-gray-900 hover:underline"
			>
				schema philosophy →
			</a>
		</div>

		{#if country && types.length}
			<nav class="border-t border-gray-100 bg-white">
				<div class="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1">
					{#each types as t (t.type)}
						<a
							href="/demo/{country}/{t.type}"
							class="rounded px-3 py-1.5 text-xs whitespace-nowrap transition-colors {isTypeActive(
								t.type
							)
								? 'bg-gray-900 text-white'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
						>
							{t.type}
							<span
								class="ml-1 text-[10px] {isTypeActive(t.type) ? 'text-gray-300' : 'text-gray-400'}"
							>
								{t.n}
							</span>
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	</header>

	{@render children()}
</div>

<svg class="hidden">
	<filter id="grain">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
</svg>
