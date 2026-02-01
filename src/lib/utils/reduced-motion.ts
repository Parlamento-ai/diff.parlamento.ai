import { browser } from '$app/environment';

const prefersReduced =
	browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Returns 0 if the user prefers reduced motion, otherwise returns `ms`. */
export function dur(ms: number): number {
	return prefersReduced ? 0 : ms;
}
