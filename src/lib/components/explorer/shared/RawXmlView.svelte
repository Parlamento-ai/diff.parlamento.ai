<script lang="ts">
	import hljs from 'highlight.js/lib/core';
	import xmlLang from 'highlight.js/lib/languages/xml';

	hljs.registerLanguage('xml', xmlLang);

	let { xml }: { xml: string } = $props();

	const highlighted = $derived(hljs.highlight(xml, { language: 'xml' }).value);
</script>

<div class="card-layout overflow-auto">
	<pre class="p-4 text-sm leading-relaxed font-mono"><code class="hljs">{@html highlighted}</code></pre>
</div>

<style>
	:global(.hljs) {
		background: transparent;
		color: #1f2937;
	}
	:global(.hljs-tag) { color: #0369a1; }
	:global(.hljs-name) { color: #0e7490; }
	:global(.hljs-attr) { color: #b45309; }
	:global(.hljs-string) { color: #15803d; }
	:global(.hljs-comment) { color: #9ca3af; font-style: italic; }
	:global(.hljs-meta) { color: #6b7280; }
</style>
