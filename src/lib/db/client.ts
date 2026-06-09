import Dexie, { type EntityTable } from 'dexie';
import { errorMessage } from '$lib/utils/errors';
import { resetLocalCacheDatabase } from './migrations';
import { DB_NAME } from './schema';

export type SyncStatus = 'fresh' | 'stale' | 'deleted';

export type DbAccount = {
	did: string;
	handle: string;
	pds: string | null;
	label: string | null;
	createdAt: string;
	updatedAt: string;
};

export type DbCachedRecord = {
	id?: number;
	accountDid: string;
	repoDid: string;
	collection: string;
	rkey: string;
	uri: string;
	cid: string;
	value: unknown;
	indexedText: string;
	createdAt: string | null;
	indexedAt: string | null;
	updatedAt: string | null;
	storedAt: string;
	sortKey: string;
	syncStatus: SyncStatus;
};

export type DbCollectionSyncState = {
	key: string;
	accountDid: string;
	repoDid: string;
	collection: string;
	cursor: string | null;
	lastSyncedAt: string | null;
	lastError: string | null;
	updatedAt: string;
};

export class IntrepidIbexDb extends Dexie {
	accounts!: EntityTable<DbAccount, 'did'>;
	cachedRecords!: EntityTable<DbCachedRecord, 'id'>;
	collectionSyncState!: EntityTable<DbCollectionSyncState, 'key'>;

	constructor(name = DB_NAME) {
		super(name);

		this.version(1).stores({
			accounts: '&did, handle',
			cachedRecords:
				'++id, &uri, &[repoDid+collection+rkey], repoDid, collection, [repoDid+collection], [repoDid+collection+sortKey]',
			collectionSyncState: '&key, [accountDid+repoDid], [accountDid+repoDid+collection]'
		});
	}
}

export type DbClient = IntrepidIbexDb;

export type DatabaseStartupReport = {
	status: 'idle' | 'loading' | 'ready' | 'error';
	dataDir: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	driver: 'not_checked' | 'loaded' | 'error';
	indexedDb: 'not_used' | 'available' | 'unavailable';
	persisted: boolean | null;
	error: string | null;
};

let databasePromise: Promise<DbClient> | null = null;
let database: DbClient | null = null;
let startupReport: DatabaseStartupReport = createIdleReport();

export function getDatabaseStartupReport(): DatabaseStartupReport {
	return { ...startupReport };
}

export async function getDatabase(): Promise<DbClient> {
	if (!databasePromise) {
		databasePromise = initializeDatabase();
	}

	return databasePromise;
}

export async function closeDatabase(): Promise<void> {
	if (database) {
		database.close();
	}

	database = null;
	databasePromise = null;
	startupReport = createIdleReport();
}

export async function resetDatabaseForTests(): Promise<void> {
	await closeDatabase();
}

export async function resetLocalDatabase(): Promise<void> {
	await closeDatabase();
	await resetLocalCacheDatabase();
}

async function initializeDatabase(): Promise<DbClient> {
	startupReport = {
		status: 'loading',
		dataDir: DB_NAME,
		startedAt: new Date().toISOString(),
		finishedAt: null,
		driver: 'not_checked',
		indexedDb: getIndexedDbStatus(),
		persisted: null,
		error: null
	};

	try {
		const client = new IntrepidIbexDb();
		await client.open();

		database = client;
		startupReport = {
			...startupReport,
			status: 'ready',
			finishedAt: new Date().toISOString(),
			driver: 'loaded',
			persisted: startupReport.indexedDb === 'available'
		};

		return client;
	} catch (error) {
		startupReport = {
			...startupReport,
			status: 'error',
			finishedAt: new Date().toISOString(),
			driver: 'error',
			error: errorMessage(error)
		};
		databasePromise = null;
		throw error;
	}
}

function getIndexedDbStatus(): DatabaseStartupReport['indexedDb'] {
	return typeof globalThis.indexedDB === 'undefined' ? 'unavailable' : 'available';
}

function createIdleReport(): DatabaseStartupReport {
	return {
		status: 'idle',
		dataDir: null,
		startedAt: null,
		finishedAt: null,
		driver: 'not_checked',
		indexedDb: 'not_used',
		persisted: null,
		error: null
	};
}
