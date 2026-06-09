import type { DbClient } from './client';
import type { CachedRecord } from './repositories/records';

export type SearchScope = { repoDid: string; collection?: string };

export type SearchResult = CachedRecord & { rank: number; snippet: string | null };

export function normalizeSearchQuery(query: string): string {
	return query.trim().replace(/\s+/g, ' ');
}

export async function searchCachedRecords(_db: DbClient, _query: string, _scope: SearchScope): Promise<SearchResult[]> {
	throw new Error('record_search schema has not been created yet. Run migrations before searching records.');
}
