import type { DbClient } from './client';
import { TABLES } from './schema';
import { rowToCachedRecord, type CachedRecord } from './repositories/records';

export type SearchScope = { repoDid: string; collection?: string };

export type SearchResult = CachedRecord & { rank: number; snippet: string | null };

type SearchResultRow = Parameters<typeof rowToCachedRecord>[0] & { rank: number; snippet: string | null };

export function normalizeSearchQuery(query: string): string {
	return query.trim().replace(/\s+/g, ' ');
}

export async function searchCachedRecords(db: DbClient, query: string, scope: SearchScope): Promise<SearchResult[]> {
	const normalizedQuery = normalizeSearchQuery(query);
	if (!normalizedQuery) return [];

	const params: unknown[] = [scope.repoDid, normalizedQuery];
	const collectionFilter = scope.collection ? 'and cr.collection = $3' : '';
	if (scope.collection) params.push(scope.collection);

	const result = await db.query<SearchResultRow>(
		`
			select cr.account_did, cr.repo_did, cr.collection, cr.rkey, cr.uri, cr.cid,
				cr.raw_json, cr.indexed_text, cr.created_at, cr.indexed_at, cr.updated_at,
				cr.stored_at, cr.sync_status,
				ts_rank(rs.search_vector, plainto_tsquery('simple', $2)) as rank,
				ts_headline('simple', rs.search_text, plainto_tsquery('simple', $2), 'MaxFragments=2, MinWords=4, MaxWords=18') as snippet
			from ${TABLES.recordSearch} rs
			join ${TABLES.cachedRecords} cr on cr.uri = rs.record_uri
			where cr.repo_did = $1 ${collectionFilter}
				and rs.search_vector @@ plainto_tsquery('simple', $2)
			order by rank desc, coalesce(cr.created_at, cr.indexed_at, cr.updated_at, cr.stored_at) desc
			limit 50
		`,
		params
	);

	return result.rows.map((row) => ({ ...rowToCachedRecord(row), rank: row.rank, snippet: row.snippet }));
}
