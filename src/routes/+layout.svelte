<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/diff-favicon.png" />
	<title>Diff — Comparado Legislativo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 page-bg">
	<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
			<a href="/" class="hover:opacity-80 transition-opacity">
				<img src="/diff-logo-horizontal.svg" alt="Diff by parlamento.ai" class="h-7" />
			</a>
			<a href="/docs" class="ml-auto text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors font-heading">
				Docs
			</a>
			<a href="/boletines" class="btn-secondary text-sm">
				Ejemplos
			</a>
		</div>
	</header>
	{@render children()}

	<footer class="border-t border-gray-200 mt-16 py-10 px-4">
		<div class="max-w-3xl mx-auto flex flex-col sm:flex-row gap-6 items-start">
			<img src="/parlamento-ai-logo.png" alt="parlamento.ai" class="h-16 shrink-0" />
			<div class="text-sm text-gray-500 leading-relaxed space-y-2">
				<p>
					<strong class="text-gray-700">Diff</strong> es un proyecto de investigacion de
					<a href="https://parlamento.ai" class="footer-link" target="_blank" rel="noopener">parlamento.ai</a>,
					donde proveemos transcripciones en tiempo real y alertas sobre lo que esta pasando en el Congreso.
				</p>
				<p>
					Constantemente buscamos empujar los limites de que tan transparente puede ser el Congreso. Cualquier comentario o sugerencia es muy bienvenido.
				</p>
				<div class="flex gap-4 pt-1">
					<a href="https://github.com/Parlamento-ai/diff.parlamento.ai" class="footer-link inline-flex items-center gap-1.5" target="_blank" rel="noopener">
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
						GitHub
					</a>
					<a href="https://www.linkedin.com/company/parlamento-ai" class="footer-link inline-flex items-center gap-1.5" target="_blank" rel="noopener">
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
						LinkedIn
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>

<!-- Noise texture filter (rendered once, invisible) -->
<svg class="hidden">
	<filter id="grain">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
</svg>

<style>
	.page-bg::before {
		content: '';
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		filter: url(#grain);
		opacity: 0.035;
	}
	.page-bg > :global(*) {
		position: relative;
		z-index: 1;
	}
	.footer-link {
		color: var(--color-brand-dark);
		text-decoration: underline transparent;
		text-underline-offset: 3px;
		transition: text-decoration-color 0.15s ease;
	}
	.footer-link:hover {
		text-decoration: underline var(--color-brand);
	}
</style>
