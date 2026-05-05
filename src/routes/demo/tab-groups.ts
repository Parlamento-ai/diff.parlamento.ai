import type { EntityType } from './entity-types';

export const TAB_GROUPS = [
	{
		id: 'home',
		label: 'Home',
		types: [] as EntityType[]
	},
	{
		id: 'bills',
		label: 'Bills',
		types: ['bill', 'amendment'] as EntityType[]
	},
	{
		id: 'sessions',
		label: 'Sessions',
		types: ['citation', 'debate'] as EntityType[]
	},
	{
		id: 'questions',
		label: 'Questions',
		types: ['question', 'statement', 'communication'] as EntityType[]
	},
	{
		id: 'acts',
		label: 'Acts & Records',
		types: [
			'act',
			'journal',
			'judgment',
			'document_collection',
			'change_set',
			'portion',
			'doc'
		] as EntityType[]
	}
] as const;

export type TabGroupId = (typeof TAB_GROUPS)[number]['id'];

export function tabGroupForType(type: EntityType): TabGroupId | null {
	for (const g of TAB_GROUPS) {
		if ((g.types as readonly EntityType[]).includes(type)) return g.id;
	}
	return null;
}

export function getTabGroup(id: string) {
	return TAB_GROUPS.find((g) => g.id === id);
}
