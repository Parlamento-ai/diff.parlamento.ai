/**
 * URL builders for Congress bill XML downloads
 */
import type { BillId } from '../types.js';

/**
 * Build Congress.gov bill XML URL.
 * Format: https://www.congress.gov/{congress}/bills/{type}{number}/BILLS-{congress}{type}{number}{code}.xml
 * e.g. https://www.congress.gov/119/bills/s5/BILLS-119s5pcs.xml
 */
export function billXmlUrl(id: BillId, versionCode: string): string {
	const code = versionCode.toLowerCase();
	return `https://www.congress.gov/${id.congress}/bills/${id.type}${id.number}/BILLS-${id.congress}${id.type}${id.number}${code}.xml`;
}

/**
 * Build Senate roll call vote XML URL.
 * e.g. https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00007.xml
 */
export function senateVoteUrl(congress: number, session: number, rollNumber: number): string {
	const pad = String(rollNumber).padStart(5, '0');
	return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${pad}.xml`;
}

/**
 * Build House roll call vote XML URL.
 * e.g. https://clerk.house.gov/evs/2025/roll023.xml
 */
export function houseVoteUrl(year: number, rollNumber: number): string {
	const pad = String(rollNumber).padStart(3, '0');
	return `https://clerk.house.gov/evs/${year}/roll${pad}.xml`;
}
