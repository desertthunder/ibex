import type { DbClient } from '../client';
import { TABLES } from '../schema';

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

type CachedRecordRow = {
	account_did: string;
	repo_did: string;
	collection: string;
	rkey: string;
	uri: string;
	cid: string;
	raw_json: unknown;
	indexed_text: string;
	created_at: string | null;
	indexed_at: string | null;
	updated_at: string | null;
	stored_at: string;
	sync_status: CachedRecord['syncStatus'];
};

export async function upsertCachedRecord(db: DbClient, record: CachedRecordInput): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.query(
			`
				insert into ${TABLES.cachedRecords} (
					account_did, repo_did, collection, rkey, uri, cid, raw_json,
					indexed_text, created_at, indexed_at, updated_at, stored_at, sync_status
				) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, timezone('utc', now())::text, 'fresh')
				on conflict (repo_did, collection, rkey) do update set
					account_did = excluded.account_did,
					uri = excluded.uri,
					cid = excluded.cid,
					raw_json = excluded.raw_json,
					indexed_text = excluded.indexed_text,
					created_at = excluded.created_at,
					indexed_at = excluded.indexed_at,
					updated_at = excluded.updated_at,
					stored_at = excluded.stored_at,
					sync_status = 'fresh'
			`,
			[
				record.accountDid,
				record.repoDid,
				record.collection,
				record.rkey,
				record.uri,
				record.cid,
				JSON.stringify(record.value),
				record.indexedText ?? '',
				record.createdAt ?? null,
				record.indexedAt ?? null,
				record.updatedAt ?? null
			]
		);

		await tx.query(
			`
				insert into ${TABLES.recordSearch} (record_uri, repo_did, collection, search_text)
				values ($1, $2, $3, $4)
				on conflict (record_uri) do update set
					repo_did = excluded.repo_did,
					collection = excluded.collection,
					search_text = excluded.search_text
			`,
			[record.uri, record.repoDid, record.collection, record.indexedText ?? '']
		);
	});
}

export async function upsertCachedRecords(db: DbClient, records: readonly CachedRecordInput[]): Promise<void> {
	for (const record of records) {
		await upsertCachedRecord(db, record);
	}
}

export async function listCachedRecords(db: DbClient, options: ListCachedRecordsOptions): Promise<CachedRecord[]> {
	const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
	const offset = Math.max(0, options.offset ?? 0);
	const params: unknown[] = [options.repoDid, limit, offset];
	const collectionFilter = options.collection ? 'and collection = $4' : '';

	if (options.collection) {
		params.push(options.collection);
	}

	const result = await db.query<CachedRecordRow>(
		`
			select account_did, repo_did, collection, rkey, uri, cid, raw_json, indexed_text,
				created_at, indexed_at, updated_at, stored_at, sync_status
			from ${TABLES.cachedRecords}
			where repo_did = $1 ${collectionFilter}
			order by coalesce(created_at, indexed_at, updated_at, stored_at) desc, rkey desc
			limit $2 offset $3
		`,
		params
	);

	return result.rows.map(rowToCachedRecord);
}

export async function getCachedRecordByUri(db: DbClient, uri: string): Promise<CachedRecord | null> {
	const result = await db.query<CachedRecordRow>(
		`
			select account_did, repo_did, collection, rkey, uri, cid, raw_json, indexed_text,
				created_at, indexed_at, updated_at, stored_at, sync_status
			from ${TABLES.cachedRecords}
			where uri = $1
			limit 1
		`,
		[uri]
	);

	return result.rows[0] ? rowToCachedRecord(result.rows[0]) : null;
}

export function rowToCachedRecord(row: CachedRecordRow): CachedRecord {
	return {
		accountDid: row.account_did,
		repoDid: row.repo_did,
		collection: row.collection,
		rkey: row.rkey,
		uri: row.uri,
		cid: row.cid,
		value: row.raw_json,
		indexedText: row.indexed_text,
		createdAt: row.created_at,
		indexedAt: row.indexed_at,
		updatedAt: row.updated_at,
		storedAt: row.stored_at,
		syncStatus: row.sync_status
	};
}
