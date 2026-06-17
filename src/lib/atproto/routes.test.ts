import { describe, expect, it } from 'vitest';
import { collectionPath, recordPath, repoPath } from './routes';

describe('ATProto route helpers', () => {
	it('builds canonical repo routes', () => {
		expect(repoPath('did:plc:abc123')).toBe('/repos/did:plc:abc123');
	});

	it('builds canonical collection routes', () => {
		expect(collectionPath({ did: 'did:plc:abc123', collection: 'app.bsky.feed.post' })).toBe(
			'/repos/did:plc:abc123/collections/app.bsky.feed.post'
		);
	});

	it('encodes record keys in canonical record routes', () => {
		expect(recordPath({ did: 'did:plc:abc123', collection: 'app.bsky.feed.post', rkey: 'post/key' })).toBe(
			'/repos/did:plc:abc123/collections/app.bsky.feed.post/post%2Fkey'
		);
	});
});
