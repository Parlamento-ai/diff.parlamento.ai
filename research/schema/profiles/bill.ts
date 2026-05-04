import type { Profile } from './types';

/**
 * What we expect a "well-formed" AKN bill to carry.
 *
 * Grouped by FACET — a slice of the document with its own narrative.
 * The score on the linter tab is reported per-facet (and aggregated)
 * so a thin sponsorship section doesn't visually drown a perfect FRBR
 * block. See `profiles/types.ts` for the expectation grammar.
 */
export const billProfile: Profile = {
	docType: 'bill',
	schemaVersion: 'v3',
	rootElement: 'bill',

	facets: [
		{
			id: 'frbr',
			label: 'FRBR identification',
			rationale:
				'The three-tier FRBR identity (Work / Expression / Manifestation) is what makes an AKN doc citable and version-aware. If this is thin, every cross-reference downstream is shaky.',
			expectations: [
				{
					id: 'work-uri',
					xpath: 'meta/identification/FRBRWork/FRBRuri/@value',
					weight: 3,
					rationale: 'The Work URI is the canonical identifier across all expressions.'
				},
				{
					id: 'work-this',
					xpath: 'meta/identification/FRBRWork/FRBRthis/@value',
					weight: 2,
					rationale: 'Identifies this specific component within the work.'
				},
				{
					id: 'work-date',
					xpath: 'meta/identification/FRBRWork/FRBRdate/@date',
					weight: 2,
					rationale: 'Date of the underlying work — required to disambiguate versions.'
				},
				{
					id: 'work-author',
					xpath: 'meta/identification/FRBRWork/FRBRauthor/@href',
					weight: 2,
					rationale: 'Who authored the work — typically the originating chamber or institution.'
				},
				{
					id: 'work-country',
					xpath: 'meta/identification/FRBRWork/FRBRcountry/@value',
					weight: 2,
					rationale: 'Jurisdiction. Necessary for cross-country browsing.'
				},
				{
					id: 'work-subtype',
					xpath: 'meta/identification/FRBRWork/FRBRsubtype/@value',
					weight: 1,
					optional: true,
					rationale:
						'Subtype tells you e.g. "commission-proposal" vs "private-member-bill". Optional in AKN but valuable.'
				},
				{
					id: 'expression-uri',
					xpath: 'meta/identification/FRBRExpression/FRBRuri/@value',
					weight: 2,
					rationale: 'Identifier for this language/version expression.'
				},
				{
					id: 'expression-language',
					xpath: 'meta/identification/FRBRExpression/FRBRlanguage/@language',
					weight: 2,
					rationale: 'Language of this expression — ISO 639-3.'
				},
				{
					id: 'manifestation-this',
					xpath: 'meta/identification/FRBRManifestation/FRBRthis/@value',
					weight: 1,
					rationale: 'Identifier of this physical manifestation (file).'
				}
			]
		},

		{
			id: 'lifecycle',
			label: 'Procedural events',
			rationale:
				"A bill without lifecycle events is a static document, not a parliamentary trace. We score depth (how many phases) and breadth (which canonical phases are present).",
			expectations: [
				{
					id: 'has-events',
					xpath: 'meta/lifecycle/eventRef',
					weight: 3,
					kind: 'count',
					min: 1,
					rationale: 'At least one lifecycle event is required to anchor the bill in time.'
				},
				{
					id: 'event-submitted',
					xpath: "meta/lifecycle/eventRef[@refersTo='#submitted']",
					weight: 2,
					rationale:
						'The "submitted" milestone marks the bill entering the parliamentary system.'
				},
				{
					id: 'event-passed-or-enacted',
					xpath:
						"meta/lifecycle/eventRef[@refersTo='#passed_chamber' or @refersTo='#passed_second_chamber' or @refersTo='#enacted']",
					weight: 1,
					optional: true,
					rationale:
						'Only present once the bill has progressed; absence is informational, not wrong.'
				},
				{
					id: 'events-without-source',
					xpath: 'meta/lifecycle/eventRef[not(@source)]',
					weight: 1,
					kind: 'absence',
					severity: 'warn',
					rationale:
						'Every lifecycle event should trace back to a TLCEvent in <references> via its @source attribute.'
				}
			]
		},

		{
			id: 'classification',
			label: 'Subject classification',
			rationale:
				'Without keywords or subject tags, the bill is unsearchable across the corpus.',
			expectations: [
				{
					id: 'has-keywords',
					xpath: 'meta/classification/keyword',
					weight: 2,
					kind: 'count',
					min: 1,
					rationale: 'At least one subject keyword.'
				},
				{
					id: 'keywords-without-dictionary',
					xpath: 'meta/classification/keyword[not(@dictionary)]',
					weight: 1,
					kind: 'absence',
					rationale:
						'Keywords should reference an authority dictionary (e.g. EuroVoc, OEIL subjects) so they are comparable.'
				}
			]
		},

		{
			id: 'sponsorship',
			label: 'Sponsors and rapporteurs',
			rationale:
				'Who proposed the bill, who carries it through committee. Carried in the akndiff: namespace because AKN core lacks the rapporteur concept.',
			expectations: [
				{
					id: 'has-sponsor',
					xpath: 'meta/proprietary/akndiff:sponsor',
					weight: 3,
					kind: 'count',
					min: 1,
					rationale: 'A bill always has a sponsor (person OR institution).'
				},
				{
					id: 'has-rapporteur',
					xpath: 'meta/proprietary/akndiff:rapporteur',
					weight: 1,
					optional: true,
					rationale: 'EP / UK style; not all systems have rapporteurs.'
				}
			]
		},

		{
			id: 'body',
			label: 'Articulated text',
			rationale:
				'The actual content. A bill with only a longTitle and no body is a stub — common in early-stage data but worth flagging.',
			expectations: [
				{
					id: 'has-preface',
					xpath: 'preface',
					weight: 2,
					rationale: 'The preface carries the long title and other prefatory matter.'
				},
				{
					id: 'long-title',
					xpath: 'preface/longTitle',
					weight: 2,
					rationale: 'Required by AKN to identify the bill in human-readable form.'
				},
				{
					id: 'has-body',
					xpath: 'body',
					weight: 3,
					rationale: 'The articulated text of the bill itself.'
				},
				{
					id: 'articles',
					xpath: 'body//article',
					weight: 2,
					kind: 'count',
					min: 1,
					rationale: 'Bills are typically split into articles. Zero articles is suspicious.'
				}
			]
		},

		{
			id: 'akndiff',
			label: 'AKN Diff extensions',
			rationale:
				"Our own metadata. Native ID and source URL are non-negotiable; status is bill-shape specific.",
			expectations: [
				{
					id: 'native-id',
					xpath: 'meta/proprietary/akndiff:nativeId',
					weight: 3,
					rationale: 'The original identifier from the source system. Required for traceability.'
				},
				{
					id: 'source-url',
					xpath: 'meta/proprietary/akndiff:sourceUrl',
					weight: 3,
					rationale: 'Where the data came from. Required for verification.'
				},
				{
					id: 'status',
					xpath: 'meta/proprietary/akndiff:billStatus/@normalized',
					weight: 2,
					kind: 'enum',
					allowed: ['pending', 'in_committee', 'enacted', 'rejected', 'withdrawn', 'archived'],
					rationale:
						'Normalized status is what powers cross-country dashboards. Free-text status defeats the comparison.'
				},
				{
					id: 'research-notes',
					xpath: 'meta/proprietary/akndiff:researchNotes',
					weight: 1,
					optional: true,
					rationale: 'Friction notes captured while modeling. Optional but valuable for synthesis.'
				}
			]
		}
	]
};
