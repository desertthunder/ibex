import { Index, type Id } from 'flexsearch';
import type { DbCachedRecord, DbClient } from './client';
import { rowToCachedRecord, type CachedRecord } from './repositories/records';

export type SearchScope = { repoDid: string; collection?: string };

export type SearchResult = CachedRecord & { rank: number; snippet: string | null };

export function normalizeSearchQuery(query: string): string {
	return query.trim().replace(/\s+/g, ' ');
}

export async function searchCachedRecords(db: DbClient, query: string, scope: SearchScope): Promise<SearchResult[]> {
	const normalizedQuery = normalizeSearchQuery(query);
	if (!normalizedQuery) return [];

	const rows = scope.collection
		? await db.cachedRecords.where('[repoDid+collection]').equals([scope.repoDid, scope.collection]).toArray()
		: await db.cachedRecords.where('repoDid').equals(scope.repoDid).toArray();
	const searchableRows = rows.filter((row) => row.syncStatus !== 'deleted' && row.indexedText.trim());
	if (searchableRows.length === 0) return [];

	const index = new Index({ tokenize: 'forward', resolution: 9, cache: false });
	const recordsByUri = new Map<string, DbCachedRecord>();

	for (const row of searchableRows) {
		recordsByUri.set(row.uri, row);
		index.add(row.uri, row.indexedText);
	}

	const ids = index.search(normalizedQuery, { limit: 50, suggest: true }) as Id[];

	return ids
		.map((id) => recordsByUri.get(String(id)))
		.filter((row): row is DbCachedRecord => row !== undefined)
		.map((row) => ({
			...rowToCachedRecord(row),
			rank: rankRecord(row.indexedText, normalizedQuery),
			snippet: makeSnippet(row.indexedText, normalizedQuery)
		}))
		.sort((left, right) => right.rank - left.rank || right.storedAt.localeCompare(left.storedAt));
}

function rankRecord(text: string, query: string): number {
	const lowerText = text.toLowerCase();
	const terms = searchTerms(query);
	const exactBonus = lowerText.includes(query.toLowerCase()) ? terms.length : 0;
	const termScore = terms.reduce((score, term) => score + countOccurrences(lowerText, term), 0);

	return exactBonus + termScore;
}

function countOccurrences(text: string, term: string): number {
	if (!term) return 0;
	return text.split(term).length - 1;
}

function makeSnippet(text: string, query: string): string | null {
	const lowerText = text.toLowerCase();
	const indexes = searchTerms(query)
		.map((term) => lowerText.indexOf(term))
		.filter((index) => index >= 0);
	const firstMatch = Math.min(...indexes);

	if (!Number.isFinite(firstMatch)) return text.slice(0, 180) || null;

	const start = Math.max(0, firstMatch - 80);
	const end = Math.min(text.length, firstMatch + 160);
	return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

function searchTerms(query: string): string[] {
	return query
		.toLowerCase()
		.split(/[^\p{L}\p{N}_:@.-]+/u)
		.map((term) => term.trim())
		.filter(Boolean);
}
