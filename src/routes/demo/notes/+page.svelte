<script lang="ts">
	import { ENTITY_TYPE_INFO, isEntityType } from '../entity-types';

	let { data } = $props();

	let copyState = $state<'idle' | 'copied' | 'error'>('idle');

	function fmtDate(d: Date | string | number | null | undefined): string {
		if (!d) return '—';
		return new Date(d).toISOString().slice(0, 10);
	}

	function typeLabel(t: string): string {
		return isEntityType(t) ? ENTITY_TYPE_INFO[t].label : t;
	}

	function buildMarkdown(): string {
		const lines: string[] = [];
		lines.push('# Research notes — Diff by Parlamento.ai');
		lines.push('');
		lines.push(
			'Free-form contributor notes attached to documents while modeling each country.',
			'Each section below is one document with its metadata followed by the note body.'
		);
		lines.push('');
		lines.push(`Total notes: ${data.notes.length}`);
		lines.push('');
		lines.push('---');
		lines.push('');

		for (const note of data.notes) {
			lines.push(`## ${note.countryCode.toUpperCase()} · ${typeLabel(note.type)} · ${note.nativeId}`);
			lines.push('');
			lines.push(`- **Country:** ${note.countryName} (\`${note.countryCode}\`)`);
			lines.push(`- **Document type:** ${typeLabel(note.type)} (\`${note.type}\`)`);
			lines.push(`- **Native id:** \`${note.nativeId}\``);
			lines.push(`- **Title:** ${note.title}`);
			lines.push(`- **Published:** ${fmtDate(note.publishedAt)}`);
			lines.push('');
			lines.push('### Note');
			lines.push('');
			lines.push(note.researchNotes ?? '');
			lines.push('');
			lines.push('---');
			lines.push('');
		}

		return lines.join('\n');
	}

	function fallbackCopy(text: string): boolean {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', '');
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		let ok = false;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		document.body.removeChild(ta);
		return ok;
	}

	async function copyAll() {
		const text = buildMarkdown();
		let ok = false;
		try {
			await navigator.clipboard.writeText(text);
			ok = true;
		} catch {
			ok = fallbackCopy(text);
		}
		copyState = ok ? 'copied' : 'error';
		setTimeout(() => (copyState = 'idle'), 2000);
	}
</script>

<svelte:head>
	<title>Research notes — diff-law</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-8">
	<header class="mb-6">
		<div class="flex items-start justify-between gap-4">
			<div>
				<div class="text-xs tracking-wider text-gray-500 uppercase">research notes</div>
				<h1 class="mt-1 text-xl font-bold">Contributor notes across the corpus</h1>
			</div>

			{#if data.notes.length}
				<button
					type="button"
					onclick={copyAll}
					class="shrink-0 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-500 hover:text-gray-900"
				>
					{#if copyState === 'copied'}
						✓ Copied
					{:else if copyState === 'error'}
						Copy failed
					{:else}
						Copy all as markdown
					{/if}
				</button>
			{/if}
		</div>

		<p class="mt-2 max-w-2xl text-sm text-gray-600">
			Free-form notes attached to documents while modeling each country. Edge cases, missing
			fields, source quirks — anything worth surfacing during the synthesis pass.
		</p>
		<p class="mt-3 text-xs text-gray-500">
			{data.notes.length} note{data.notes.length === 1 ? '' : 's'} loaded
		</p>
	</header>

	{#if data.notes.length}
		<ul class="space-y-3">
			{#each data.notes as note (note.id)}
				<li class="border border-gray-200 bg-white">
					<div class="flex flex-wrap items-baseline gap-2 border-b border-gray-100 px-4 py-2">
						<span
							class="rounded bg-gray-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase"
						>
							{note.countryCode}
						</span>
						<span class="text-xs text-gray-700">{note.countryName}</span>
						<span class="text-gray-300">·</span>
						<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
							{typeLabel(note.type)}
						</span>
						<span class="ml-auto shrink-0 text-xs text-gray-400">
							{fmtDate(note.publishedAt)}
						</span>
					</div>

					<div class="px-4 pt-3">
						<a
							href="/demo/{note.countryCode}/{note.type}/{note.nativeId}"
							class="block hover:underline"
						>
							<div class="font-bold">{note.nativeId}</div>
							<div class="mt-0.5 text-sm text-gray-700">{note.title}</div>
						</a>
					</div>

					<pre
						class="mt-3 overflow-x-auto px-4 pb-4 font-mono text-xs whitespace-pre-wrap text-gray-800">{note.researchNotes}</pre>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
			No documents have research notes yet.
		</div>
	{/if}
</div>
