import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, getDatabase, getDatabaseStartupReport } from './client';

describe('PGlite client', () => {
	afterEach(async () => {
		await closeDatabase();
	});

	it('loads the WASM bundle and answers a query in the browser', async () => {
		expect.assertions(3);

		const db = await getDatabase();
		const result = await db.query<{ ok: number }>('select 1::int as ok');
		const report = getDatabaseStartupReport();

		expect(result.rows[0]?.ok).toBe(1);
		expect(report.status).toBe('ready');
		expect(report.wasm).toBe('loaded');
	});
});
