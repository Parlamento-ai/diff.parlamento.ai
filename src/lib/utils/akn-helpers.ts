import type { AknNode } from '$lib/types/explorer';

export function extractTextFromNode(node: AknNode): string {
	if (node.name === '#text') return node.text || '';
	return node.children.map(extractTextFromNode).join('');
}

export function findNode(node: AknNode, name: string): AknNode | undefined {
	if (node.name === name) return node;
	for (const child of node.children) {
		const found = findNode(child, name);
		if (found) return found;
	}
	return undefined;
}

export function findAllNodes(node: AknNode, name: string): AknNode[] {
	const results: AknNode[] = [];
	if (node.name === name) results.push(node);
	for (const child of node.children) {
		results.push(...findAllNodes(child, name));
	}
	return results;
}
