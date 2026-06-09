import type { DbClient } from './client';
import { DB_DATA_DIR, INDEXES, TABLES } from './schema';

export type MigrationConnection = Pick<DbClient, 'exec' | 'query'>;

export type Migration = { id: string; description: string; up: (db: MigrationConnection) => Promise<void> };

export type AppliedMigration = { version: string; appliedAt: string };

export type MigrationStatus = {
	pending: readonly Migration[];
	applied: readonly AppliedMigration[];
	currentVersion: string | null;
};

export const migrations: readonly Migration[] = validateMigrations([
	{
		id: '202606090001_initial_cache_schema',
		description: 'Create local cache tables and record search index.',
		up: async (db) => {
			await db.exec(`
				create table ${TABLES.accounts} (
					did text primary key,
					handle text not null,
					pds text,
					label text,
					created_at text not null default (timezone('utc', now())::text),
					updated_at text not null default (timezone('utc', now())::text)
				);

				create table ${TABLES.cachedRecords} (
					id bigserial primary key,
					account_did text not null,
					repo_did text not null,
					collection text not null,
					rkey text not null,
					uri text not null unique,
					cid text not null,
					raw_json jsonb not null,
					indexed_text text not null default '',
					created_at text,
					indexed_at text,
					updated_at text,
					stored_at text not null default (timezone('utc', now())::text),
					sync_status text not null default 'fresh',
					unique (repo_did, collection, rkey)
				);

				create table ${TABLES.collectionSyncState} (
					account_did text not null,
					repo_did text not null,
					collection text not null,
					cursor text,
					last_synced_at text,
					last_error text,
					updated_at text not null default (timezone('utc', now())::text),
					primary key (account_did, repo_did, collection)
				);

				create table ${TABLES.recordSearch} (
					record_uri text primary key references ${TABLES.cachedRecords}(uri) on delete cascade,
					repo_did text not null,
					collection text not null,
					search_text text not null,
					search_vector tsvector generated always as (to_tsvector('simple', search_text)) stored
				);

				create index ${INDEXES.cachedRecordsCollection}
					on ${TABLES.cachedRecords} (repo_did, collection, rkey);
				create index ${INDEXES.cachedRecordsUri}
					on ${TABLES.cachedRecords} (uri);
				create index ${INDEXES.cachedRecordsRecent}
					on ${TABLES.cachedRecords} (repo_did, collection, coalesce(created_at, indexed_at, updated_at, stored_at) desc);
				create index ${INDEXES.collectionSyncStateAccount}
					on ${TABLES.collectionSyncState} (account_did, repo_did);
				create index ${INDEXES.recordSearchText}
					on ${TABLES.recordSearch} using gin (search_vector);
			`);
		}
	}
]);

export async function getMigrationStatus(db: DbClient): Promise<MigrationStatus> {
	await ensureMigrationsTable(db);
	const applied = await getAppliedMigrations(db);
	const appliedVersions = new Set(applied.map((migration) => migration.version));

	return {
		pending: migrations.filter((migration) => !appliedVersions.has(migration.id)),
		applied,
		currentVersion: applied.at(-1)?.version ?? null
	};
}

export async function runMigrations(db: DbClient): Promise<MigrationStatus> {
	await ensureMigrationsTable(db);
	const status = await getMigrationStatus(db);

	for (const migration of status.pending) {
		await db.transaction(async (tx) => {
			await migration.up(tx);
			await tx.query(
				`insert into ${TABLES.migrations} (version, applied_at) values ($1, timezone('utc', now())::text)`,
				[migration.id]
			);
		});
	}

	return getMigrationStatus(db);
}

export async function resetLocalCacheDatabase(): Promise<void> {
	if (!import.meta.env.DEV) {
		throw new Error('Resetting the local cache is only available in development builds.');
	}

	if (typeof indexedDB === 'undefined') {
		return;
	}

	const databaseNames = new Set([DB_DATA_DIR, DB_DATA_DIR.replace(/^idb:\/\//, '')]);

	if ('databases' in indexedDB) {
		const databases = await indexedDB.databases();
		for (const database of databases) {
			if (database.name?.includes('intrepid-ibex-cache')) {
				databaseNames.add(database.name);
			}
		}
	}

	await Promise.all([...databaseNames].map((name) => deleteIndexedDbDatabase(name)));
}

async function ensureMigrationsTable(db: DbClient): Promise<void> {
	await db.exec(`
		create table if not exists ${TABLES.migrations} (
			version text primary key,
			applied_at text not null
		);
	`);
}

async function getAppliedMigrations(db: DbClient): Promise<AppliedMigration[]> {
	const result = await db.query<{ version: string; applied_at: string }>(
		`select version, applied_at from ${TABLES.migrations} order by version asc`
	);

	return result.rows.map((row) => ({ version: row.version, appliedAt: row.applied_at }));
}

function validateMigrations(items: readonly Migration[]): readonly Migration[] {
	const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
	const ids = new Set<string>();

	for (const migration of sorted) {
		if (ids.has(migration.id)) {
			throw new Error(`Duplicate migration id: ${migration.id}`);
		}
		ids.add(migration.id);
	}

	return sorted;
}

function deleteIndexedDbDatabase(name: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase(name);
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error ?? new Error(`Could not delete IndexedDB database ${name}.`));
		request.onblocked = () => reject(new Error(`Could not delete IndexedDB database ${name} because it is open.`));
	});
}
