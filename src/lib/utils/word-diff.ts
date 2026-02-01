import type { WordToken } from '$lib/types';

/**
 * Compute word-level diff using LCS (Longest Common Subsequence).
 */
export function computeWordDiff(oldText: string, newText: string): WordToken[] {
	const oldWords = oldText.split(/\s+/).filter(Boolean);
	const newWords = newText.split(/\s+/).filter(Boolean);

	const m = oldWords.length;
	const n = newWords.length;

	// Build LCS table
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (oldWords[i - 1] === newWords[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to produce diff
	const tokens: WordToken[] = [];
	let i = m;
	let j = n;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
			tokens.push({ text: oldWords[i - 1], type: 'unchanged' });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			tokens.push({ text: newWords[j - 1], type: 'added' });
			j--;
		} else {
			tokens.push({ text: oldWords[i - 1], type: 'removed' });
			i--;
		}
	}

	tokens.reverse();
	return tokens;
}
