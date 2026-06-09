import { PGlite } from '@electric-sql/pglite';
import { errorMessage } from '$lib/utils/errors';
import { resetLocalCacheDatabase } from './migrations';
import { DB_DATA_DIR, SQL } from './schema';

export type DbClient = PGlite;

export type DatabaseStartupReport = {
	status: 'idle' | 'loading' | 'ready' | 'error';
	dataDir: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	wasm: 'not_checked' | 'loaded' | 'error';
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
		await database.close();
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
	const dataDir = getDefaultDataDir();
	startupReport = {
		status: 'loading',
		dataDir: dataDir ?? null,
		startedAt: new Date().toISOString(),
		finishedAt: null,
		wasm: 'not_checked',
		indexedDb: getIndexedDbStatus(dataDir),
		persisted: null,
		error: null
	};

	try {
		const client = await PGlite.create(dataDir);
		await client.query(SQL.ping);

		database = client;
		startupReport = {
			...startupReport,
			status: 'ready',
			finishedAt: new Date().toISOString(),
			wasm: 'loaded',
			persisted: dataDir?.startsWith('idb://') === true && startupReport.indexedDb === 'available'
		};

		return client;
	} catch (error) {
		startupReport = {
			...startupReport,
			status: 'error',
			finishedAt: new Date().toISOString(),
			wasm: 'error',
			error: errorMessage(error)
		};
		databasePromise = null;
		throw error;
	}
}

function getDefaultDataDir() {
	return isBrowser() ? DB_DATA_DIR : undefined;
}

function getIndexedDbStatus(dataDir: string | undefined): DatabaseStartupReport['indexedDb'] {
	if (!dataDir?.startsWith('idb://')) return 'not_used';
	return isBrowser() && 'indexedDB' in globalThis ? 'available' : 'unavailable';
}

function isBrowser() {
	return typeof globalThis.window !== 'undefined';
}

function createIdleReport(): DatabaseStartupReport {
	return {
		status: 'idle',
		dataDir: null,
		startedAt: null,
		finishedAt: null,
		wasm: 'not_checked',
		indexedDb: 'not_used',
		persisted: null,
		error: null
	};
}
