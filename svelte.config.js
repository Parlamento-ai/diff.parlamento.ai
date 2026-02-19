import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		prerender: {
			handleHttpError({ path, message }) {
				// Ignore links to research/ files (source references in docs, not routes)
				if (path.startsWith('/research/')) return;
				throw new Error(message);
			},
			handleUnseenRoutes: 'warn'
		}
	},
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
