/**
 * HTTP helpers for EU pipeline (EP Open Data, CELLAR SPARQL, file downloads)
 */
import https from 'node:https';
import http from 'node:http';
import tls from 'node:tls';
import { existsSync, unlinkSync, createWriteStream } from 'node:fs';

export const EP_API = 'https://data.europarl.europa.eu';
export const CELLAR_SPARQL = 'https://publications.europa.eu/webapi/rdf/sparql';

// The EP Open Data API certificate uses *.data.europarl.europa.eu (wildcard)
// which doesn't cover the bare domain data.europarl.europa.eu per RFC 6125.
const EP_HOST = 'data.europarl.europa.eu';

function epCheckServerIdentity(hostname: string, cert: tls.PeerCertificate): Error | undefined {
	if (hostname === EP_HOST) {
		const altNames = (cert.subjectaltname || '').split(', ');
		const hasWildcard = altNames.some((n) => n === `DNS:*.${EP_HOST}`);
		if (hasWildcard) return undefined;
	}
	return tls.checkServerIdentity(hostname, cert);
}

export function fetchJson(url: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const doRequest = (targetUrl: string, redirects = 0) => {
			if (redirects > 5) return reject(new Error('Too many redirects'));
			const mod = targetUrl.startsWith('https:') ? https : http;
			const opts: https.RequestOptions = {
				headers: {
					Accept: 'application/ld+json, application/json',
					'User-Agent': 'eu-akn-pipeline',
				},
				...(targetUrl.includes(EP_HOST) ? { checkServerIdentity: epCheckServerIdentity } : {}),
			};
			mod
				.get(targetUrl, opts, (res) => {
					if (
						res.statusCode &&
						res.statusCode >= 300 &&
						res.statusCode < 400 &&
						res.headers.location
					) {
						const loc = res.headers.location.startsWith('http')
							? res.headers.location
							: new URL(res.headers.location, targetUrl).href;
						return doRequest(loc, redirects + 1);
					}
					if (res.statusCode !== 200)
						return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
					let body = '';
					res.on('data', (chunk: Buffer) => (body += chunk.toString()));
					res.on('end', () => {
						try {
							resolve(JSON.parse(body));
						} catch (e) {
							reject(new Error(`JSON parse error`));
						}
					});
					res.on('error', reject);
				})
				.on('error', reject);
		};
		doRequest(url);
	});
}

export function sparqlQuery(query: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const postData = new URLSearchParams({ query }).toString();
		const req = https.request(
			CELLAR_SPARQL,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/sparql-results+json',
					'User-Agent': 'eu-akn-pipeline',
					'Content-Length': Buffer.byteLength(postData),
				},
			},
			(res) => {
				if (res.statusCode !== 200)
					return reject(new Error(`SPARQL HTTP ${res.statusCode}`));
				let body = '';
				res.on('data', (chunk: Buffer) => (body += chunk.toString()));
				res.on('end', () => {
					try {
						resolve(JSON.parse(body));
					} catch {
						reject(new Error('SPARQL JSON parse error'));
					}
				});
				res.on('error', reject);
			}
		);
		req.on('error', reject);
		req.write(postData);
		req.end();
	});
}

export function downloadFile(
	url: string,
	dest: string,
	headers?: Record<string, string>
): Promise<boolean> {
	return new Promise((res) => {
		const doDownload = (targetUrl: string, redirects = 0) => {
			if (redirects > 10) {
				res(false);
				return;
			}
			const mod = targetUrl.startsWith('https:') ? https : http;
			mod
				.get(
					targetUrl,
					{
						headers: { 'User-Agent': 'eu-akn-pipeline', ...headers },
						...(targetUrl.includes(EP_HOST)
							? { checkServerIdentity: epCheckServerIdentity }
							: {}),
					},
					(response: any) => {
						if (
							response.statusCode >= 300 &&
							response.statusCode < 400 &&
							response.headers.location
						) {
							const loc = response.headers.location.startsWith('http')
								? response.headers.location
								: new URL(response.headers.location, targetUrl).href;
							doDownload(loc, redirects + 1);
							return;
						}
						if (response.statusCode !== 200) {
							res(false);
							return;
						}
						const file = createWriteStream(dest);
						response.pipe(file);
						file.on('finish', () => {
							file.close();
							res(true);
						});
						file.on('error', () => {
							file.close();
							if (existsSync(dest)) unlinkSync(dest);
							res(false);
						});
					}
				)
				.on('error', () => {
					if (existsSync(dest)) unlinkSync(dest);
					res(false);
				});
		};
		doDownload(url);
	});
}
