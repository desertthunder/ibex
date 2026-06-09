import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';
import { getMigrationStatus, runMigrations } from './migrations';
import { TABLES } from './schema';

const clients: PGlite[] = [];

async function createDb() {
	const db = await PGlite.create();
	clients.push(db);
	return db;
}

afterEach(async () => {
	await Promise.all(clients.splice(0).map((db) => db.close()));
});

describe('migrations', () => {
	it('applies the initial schema on a fresh database', async () => {
		expect.assertions(3);
		const db = await createDb();

		const status = await runMigrations(db);
		const tables = await db.query<{ table_name: string }>(
			`select table_name from information_schema.tables where table_schema = 'public' order by table_name`
		);

		expect(status.pending).toHaveLength(0);
		expect(status.currentVersion).toBe('202606090001_initial_cache_schema');
		expect(tables.rows.map((row) => row.table_name)).toEqual(
			expect.arrayContaining([
				TABLES.migrations,
				TABLES.accounts,
				TABLES.cachedRecords,
				TABLES.collectionSyncState,
				TABLES.recordSearch
			])
		);
	});

	it('is idempotent when migrations are already applied', async () => {
		expect.assertions(2);
		const db = await createDb();

		await runMigrations(db);
		const status = await runMigrations(db);

		expect(status.pending).toHaveLength(0);
		expect(status.applied).toHaveLength(1);
	});

	it('reports pending migrations before the runner is called', async () => {
		expect.assertions(2);
		const db = await createDb();

		const status = await getMigrationStatus(db);

		expect(status.applied).toHaveLength(0);
		expect(status.pending.map((migration) => migration.id)).toEqual(['202606090001_initial_cache_schema']);
	});
});
