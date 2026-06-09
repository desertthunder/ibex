export const DB_DATA_DIR = 'idb://intrepid-ibex-cache-v1';

export const TABLES = {
	migrations: 'schema_migrations',
	accounts: 'accounts',
	cachedRecords: 'cached_records',
	collectionSyncState: 'collection_sync_state',
	recordSearch: 'record_search'
} as const;

export const INDEXES = {
	cachedRecordsCollection: 'cached_records_repo_collection_idx',
	cachedRecordsUri: 'cached_records_uri_idx',
	cachedRecordsRecent: 'cached_records_recent_idx',
	collectionSyncStateAccount: 'collection_sync_state_account_idx',
	recordSearchText: 'record_search_text_idx'
} as const;

export const SQL = { ping: 'select 1::int as ok', currentTimestamp: "timezone('utc', now())" } as const;
