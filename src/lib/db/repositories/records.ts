import type { DbCachedRecord, DbClient, SyncStatus } from '../client';

export type CachedRecordInput = {
	accountDid: string;
	repoDid: string;
	collection: string;
	rkey: string;
	uri: string;
	cid: string;
	value: unknown;
	indexedText?: string | null;
	createdAt?: string | null;
	indexedAt?: string | null;
	updatedAt?: string | null;
};

export type CachedRecord = CachedRecordInput & { storedAt: string; syncStatus: SyncStatus };

export type ListCachedRecordsOptions = { repoDid: string; collection?: string; limit?: number; offset?: number };

export type CachedCollectionSummary = { name: string; loadedCount: number; lastStoredAt: string | null };

export async function upsertCachedRecord(db: DbClient, record: CachedRecordInput): Promise<void> {
	await db.transaction('rw', db.cachedRecords, async () => {
		await putCachedRecord(db, record);
	});
}

export async function upsertCachedRecords(db: DbClient, records: readonly CachedRecordInput[]): Promise<void> {
	await db.transaction('rw', db.cachedRecords, async () => {
		for (const record of records) {
			await putCachedRecord(db, record);
		}
	});
}

export async function listCachedRecords(db: DbClient, options: ListCachedRecordsOptions): Promise<CachedRecord[]> {
	const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
	const offset = Math.max(0, options.offset ?? 0);
	const rows = options.collection
		? await db.cachedRecords.where('[repoDid+collection]').equals([options.repoDid, options.collection]).toArray()
		: await db.cachedRecords.where('repoDid').equals(options.repoDid).toArray();

	return rows
		.filter((row) => row.syncStatus !== 'deleted')
		.sort(compareCachedRecords)
		.slice(offset, offset + limit)
		.map(rowToCachedRecord);
}

export async function listCachedCollections(db: DbClient, repoDid: string): Promise<CachedCollectionSummary[]> {
	const rows = await db.cachedRecords.where('repoDid').equals(repoDid).toArray();
	const summaries = new Map<string, { loadedCount: number; lastStoredAt: string | null }>();

	for (const row of rows) {
		if (row.syncStatus === 'deleted') continue;

		const summary = summaries.get(row.collection) ?? { loadedCount: 0, lastStoredAt: null };
		summary.loadedCount += 1;
		summary.lastStoredAt = latestIsoTimestamp(summary.lastStoredAt, row.storedAt);
		summaries.set(row.collection, summary);
	}

	return [...summaries.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([name, summary]) => ({ name, ...summary }));
}

export async function getCachedRecordByUri(db: DbClient, uri: string): Promise<CachedRecord | null> {
	const row = await db.cachedRecords.where('uri').equals(uri).first();
	return row ? rowToCachedRecord(row) : null;
}

export function rowToCachedRecord(row: DbCachedRecord): CachedRecord {
	return {
		accountDid: row.accountDid,
		repoDid: row.repoDid,
		collection: row.collection,
		rkey: row.rkey,
		uri: row.uri,
		cid: row.cid,
		value: row.value,
		indexedText: row.indexedText,
		createdAt: row.createdAt,
		indexedAt: row.indexedAt,
		updatedAt: row.updatedAt,
		storedAt: row.storedAt,
		syncStatus: row.syncStatus
	};
}

async function putCachedRecord(db: DbClient, record: CachedRecordInput): Promise<void> {
	const now = new Date().toISOString();
	const existing = await db.cachedRecords
		.where('[repoDid+collection+rkey]')
		.equals([record.repoDid, record.collection, record.rkey])
		.first();
	const sortKey = record.createdAt ?? record.indexedAt ?? record.updatedAt ?? now;

	await db.cachedRecords.put({
		id: existing?.id,
		accountDid: record.accountDid,
		repoDid: record.repoDid,
		collection: record.collection,
		rkey: record.rkey,
		uri: record.uri,
		cid: record.cid,
		value: record.value,
		indexedText: record.indexedText ?? '',
		createdAt: record.createdAt ?? null,
		indexedAt: record.indexedAt ?? null,
		updatedAt: record.updatedAt ?? null,
		storedAt: now,
		sortKey,
		syncStatus: 'fresh'
	});
}

function compareCachedRecords(left: DbCachedRecord, right: DbCachedRecord): number {
	return right.sortKey.localeCompare(left.sortKey) || right.rkey.localeCompare(left.rkey);
}

function latestIsoTimestamp(left: string | null, right: string): string {
	return left && left > right ? left : right;
}
