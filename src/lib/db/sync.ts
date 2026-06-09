import type { DbClient } from './client';
import { upsertCachedRecords, type CachedRecordInput } from './repositories/records';
import { TABLES } from './schema';

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
	await db.query(
		`
			insert into ${TABLES.collectionSyncState} (
				account_did, repo_did, collection, cursor, last_synced_at, last_error, updated_at
			) values ($1, $2, $3, $4, $5, $6, timezone('utc', now())::text)
			on conflict (account_did, repo_did, collection) do update set
				cursor = excluded.cursor,
				last_synced_at = excluded.last_synced_at,
				last_error = excluded.last_error,
				updated_at = excluded.updated_at
		`,
		[
			state.accountDid,
			state.repoDid,
			state.collection,
			state.cursor ?? null,
			state.lastSyncedAt ?? null,
			state.lastError ?? null
		]
	);
}
