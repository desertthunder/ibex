import type { DbClient } from './client';
import { upsertCachedRecords, type CachedRecordInput } from './repositories/records';

export type CollectionSyncStateInput = {
	accountDid: string;
	repoDid: string;
	collection: string;
	cursor?: string | null;
	lastSyncedAt?: string | null;
	lastError?: string | null;
};

export async function cacheFetchedRecords(db: DbClient, records: readonly CachedRecordInput[]): Promise<void> {
	if (records.length === 0) return;
	await upsertCachedRecords(db, records);
}

export async function updateCollectionSyncState(_db: DbClient, _state: CollectionSyncStateInput): Promise<void> {
	throw new Error('collection_sync_state schema has not been created yet. Run migrations before storing sync state.');
}
