<script lang="ts">
	let {
		eId,
		heading,
		content,
		highlighted = false
	}: {
		eId: string;
		heading: string;
		content: string;
		highlighted?: boolean;
	} = $props();
</script>

<article
	id={eId}
	class="py-3 px-4 border-l-4 transition-colors
		{highlighted ? 'border-amber-400 bg-amber-50/50' : 'border-transparent'}"
>
	<h4 class="text-sm font-semibold text-gray-800">{heading}</h4>
	<p class="text-sm text-gray-700 mt-1 leading-relaxed">{content}</p>
</article>
