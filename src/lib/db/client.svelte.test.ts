import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, getDatabase, getDatabaseStartupReport } from './client';

describe('Dexie client', () => {
	afterEach(async () => {
		await closeDatabase();
	});

	it('opens IndexedDB and exposes cache stores in the browser', async () => {
		expect.assertions(3);

		const db = await getDatabase();
		const report = getDatabaseStartupReport();

		expect(db.cachedRecords).toBeDefined();
		expect(report.status).toBe('ready');
		expect(report.indexedDb).toBe('available');
	});
});
