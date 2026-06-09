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

export async function updateCollectionSyncState(db: DbClient, state: CollectionSyncStateInput): Promise<void> {
	await db.collectionSyncState.put({
		key: `${state.accountDid}|${state.repoDid}|${state.collection}`,
		accountDid: state.accountDid,
		repoDid: state.repoDid,
		collection: state.collection,
		cursor: state.cursor ?? null,
		lastSyncedAt: state.lastSyncedAt ?? null,
		lastError: state.lastError ?? null,
		updatedAt: new Date().toISOString()
	});
}
