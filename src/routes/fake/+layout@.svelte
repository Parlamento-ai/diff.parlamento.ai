<script lang="ts">
	import '../layout.css';
	import { page } from '$app/stores';
	import { MetaTags } from 'svelte-meta-tags';

	let { children }: { children: any } = $props();
</script>

<MetaTags title="Portal Parlamentario" titleTemplate="%s | Fake Parliament" />

{@render children()}

<!-- Noise texture filter (rendered once, invisible) -->
<svg class="hidden">
	<filter id="grain">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
</svg>
