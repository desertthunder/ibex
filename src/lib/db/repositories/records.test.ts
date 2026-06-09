import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../migrations';
import { searchCachedRecords } from '../search';
import { getCachedRecordByUri, listCachedRecords, upsertCachedRecord } from './records';

const clients: PGlite[] = [];

async function createMigratedDb() {
	const db = await PGlite.create();
	clients.push(db);
	await runMigrations(db);
	return db;
}

afterEach(async () => {
	await Promise.all(clients.splice(0).map((db) => db.close()));
});

describe('cached records repository', () => {
	it('stores raw records and indexes searchable text', async () => {
		expect.assertions(5);
		const db = await createMigratedDb();

		await upsertCachedRecord(db, {
			accountDid: 'did:plc:viewer',
			repoDid: 'did:plc:repo',
			collection: 'app.bsky.feed.post',
			rkey: 'abc123',
			uri: 'at://did:plc:repo/app.bsky.feed.post/abc123',
			cid: 'bafy-test',
			value: { $type: 'app.bsky.feed.post', text: 'Intrepid Ibex cache search works' },
			indexedText: 'Intrepid Ibex cache search works',
			createdAt: '2026-06-09T12:00:00.000Z'
		});

		const listed = await listCachedRecords(db, { repoDid: 'did:plc:repo', collection: 'app.bsky.feed.post' });
		const record = await getCachedRecordByUri(db, 'at://did:plc:repo/app.bsky.feed.post/abc123');
		const results = await searchCachedRecords(db, 'cache search', { repoDid: 'did:plc:repo' });

		expect(listed).toHaveLength(1);
		expect(record?.value).toEqual({ $type: 'app.bsky.feed.post', text: 'Intrepid Ibex cache search works' });
		expect(results).toHaveLength(1);
		expect(results[0]?.rkey).toBe('abc123');
		expect(results[0]?.rank).toBeGreaterThan(0);
	});
});
