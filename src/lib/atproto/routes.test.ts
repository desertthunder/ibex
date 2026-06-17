/** Move to test/routes.test.ts */
import { describe, expect, it } from 'vitest';
import { blobPath, blobsPath, collectionPath, identityPath, recordPath, repoPath } from './routes';

describe('ATProto route helpers', () => {
	it('builds canonical repo routes', () => {
		expect(repoPath('did:plc:abc123')).toBe('/repos/did:plc:abc123');
	});

	it('builds canonical collection routes', () => {
		expect(collectionPath({ did: 'did:plc:abc123', collection: 'app.bsky.feed.post' })).toBe(
			'/repos/did:plc:abc123/collections/app.bsky.feed.post'
		);
	});

	it('builds canonical identity inspector routes', () => {
		expect(identityPath('did:plc:abc123')).toBe('/repos/did:plc:abc123/identity');
	});

	it('builds canonical blob browser routes', () => {
		expect(blobsPath('did:plc:abc123')).toBe('/repos/did:plc:abc123/blobs');
	});

	it('encodes blob CIDs in canonical blob routes', () => {
		expect(blobPath('did:plc:abc123', 'bafy/test')).toBe('/repos/did:plc:abc123/blobs/bafy%2Ftest');
	});

	it('encodes record keys in canonical record routes', () => {
		expect(recordPath({ did: 'did:plc:abc123', collection: 'app.bsky.feed.post', rkey: 'post/key' })).toBe(
			'/repos/did:plc:abc123/collections/app.bsky.feed.post/post%2Fkey'
		);
	});
});
