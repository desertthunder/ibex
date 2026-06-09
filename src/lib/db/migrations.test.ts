import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { IntrepidIbexDb } from './client';
import { getMigrationStatus, runMigrations } from './migrations';
import { TABLES } from './schema';

const clients: IntrepidIbexDb[] = [];

async function createDb() {
	const db = new IntrepidIbexDb(`test-migrations-${crypto.randomUUID()}`);
	clients.push(db);
	return db;
}

afterEach(async () => {
	for (const db of clients.splice(0)) {
		await db.delete();
	}
});

describe('migrations', () => {
	it('opens the Dexie schema on a fresh database', async () => {
		expect.assertions(3);
		const db = await createDb();

		const status = await runMigrations(db);
		const storeNames = db.tables.map((table) => table.name).sort();

		expect(status.pending).toHaveLength(0);
		expect(status.currentVersion).toBe('202606090001_dexie_cache_schema');
		expect(storeNames).toEqual(
			expect.arrayContaining([TABLES.accounts, TABLES.cachedRecords, TABLES.collectionSyncState])
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

	it('reports no pending migrations because Dexie applies versions during open', async () => {
		expect.assertions(2);
		const db = await createDb();

		const status = await getMigrationStatus(db);

		expect(status.applied).toHaveLength(1);
		expect(status.pending).toHaveLength(0);
	});
});
