/**
 * Pipeline utility functions
 */
import { resolve, dirname } from 'node:path';

export const TOOLS_DIR = resolve(dirname(process.argv[1] || ''));
export const BASE_DIR = resolve(TOOLS_DIR, '../data/eu');
export const NODE = 'node --experimental-strip-types';

export function parseProcedure(proc: string) {
	const m = proc.match(/^(\d{4})\/(\d+)\((\w+)\)$/);
	if (!m) return null;
	return { year: m[1], num: m[2], type: m[3], apiId: `${m[1]}-${m[2]}` };
}

export function parseBillCelex(celex: string): { comYear: number; comNum: number } | null {
	const m = celex.match(/^5(\d{4})PC0*(\d+)/);
	return m ? { comYear: parseInt(m[1]), comNum: parseInt(m[2]) } : null;
}

export function parseFinalCelex(
	celex: string
): { regYear: number; regNum: number; type: string } | null {
	const m = celex.match(/^3(\d{4})([RLD])0*(\d+)/);
	return m ? { regYear: parseInt(m[1]), type: m[2], regNum: parseInt(m[3]) } : null;
}

export function slugify(title: string): string {
	const parenMatches = [...title.matchAll(/\(([^)]{4,})\)/gi)];
	const meaningful = parenMatches.find(
		(m) => !/^\(?(?:EU|EC|EEC|ECSC|Euratom)\)?$/i.test(m[1].trim())
	);
	const name = meaningful ? meaningful[1] : title.split(' and ')[0];
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.substring(0, 60);
}

export function deriveTaFromCelex(celex: string): string | null {
	const m = celex.match(/^5(\d{4})AP(\d+)$/);
	if (!m) return null;
	return `ta-9-${m[1]}-${m[2]}.html`;
}

export function countTag(xml: string, tag: string): number {
	return (xml.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
}

export function extractFRBRuri(xml: string): string | null {
	const m = xml.match(/<FRBRuri\s+value="([^"]+)"/);
	return m?.[1] ?? null;
}

export function celexMatchesUri(celex: string, uri: string): boolean {
	if (uri.includes(celex)) return true;
	const billMatch = celex.match(/^5(\d{4})PC0*(\d+)$/);
	if (billMatch) return uri.includes(`/${billMatch[1]}/${billMatch[2]}`);
	const regMatch = celex.match(/^3(\d{4})R0*(\d+)$/);
	if (regMatch) return uri.includes(`/${regMatch[1]}/${regMatch[2]}`);
	return false;
}

export function isOjAmendmentHtml(html: string): boolean {
	return html.includes('class="oj-table"');
}

export function pad(s: string, n: number): string {
	return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

export function fmtTime(ms: number): string {
	return (ms / 1000).toFixed(1) + 's';
}
