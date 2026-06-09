import type { DbClient } from '../client';

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

export type CachedRecord = CachedRecordInput & { storedAt: string; syncStatus: 'fresh' | 'stale' | 'deleted' };

export type ListCachedRecordsOptions = { repoDid: string; collection?: string; limit?: number; offset?: number };

export async function upsertCachedRecord(_db: DbClient, _record: CachedRecordInput): Promise<void> {
	throw new Error('cached_records schema has not been created yet. Run migrations before writing records.');
}

export async function upsertCachedRecords(db: DbClient, records: readonly CachedRecordInput[]): Promise<void> {
	for (const record of records) {
		await upsertCachedRecord(db, record);
	}
}

export async function listCachedRecords(_db: DbClient, _options: ListCachedRecordsOptions): Promise<CachedRecord[]> {
	throw new Error('cached_records schema has not been created yet. Run migrations before reading records.');
}

export async function getCachedRecordByUri(_db: DbClient, _uri: string): Promise<CachedRecord | null> {
	throw new Error('cached_records schema has not been created yet. Run migrations before reading records.');
}
