import { describe, expect, it } from 'vitest';
import { repoPathSegments, repoRouteFromSegments } from './desktop-routes';

describe('desktop repo route parsing', () => {
	it('parses repo roots', () => {
		expect(repoRouteFromSegments('did:plc:abc123', [])).toEqual({ kind: 'repo', did: 'did:plc:abc123' });
	});

	it('parses identity routes', () => {
		expect(repoRouteFromSegments('did:plc:abc123', ['identity'])).toEqual({
			kind: 'identity',
			did: 'did:plc:abc123'
		});
	});

	it('parses blob routes with encoded slashes', () => {
		expect(repoRouteFromSegments('did:plc:abc123', ['blobs', 'bafy%2Ftest'])).toEqual({
			kind: 'blob',
			did: 'did:plc:abc123',
			cid: 'bafy/test'
		});
	});

	it('parses collection and record routes', () => {
		expect(repoRouteFromSegments('did:plc:abc123', ['collections', 'app.bsky.feed.post'])).toEqual({
			kind: 'collection',
			did: 'did:plc:abc123',
			collection: 'app.bsky.feed.post'
		});
		expect(repoRouteFromSegments('did:plc:abc123', ['collections', 'app.bsky.feed.post', 'post%2Fkey'])).toEqual({
			kind: 'record',
			did: 'did:plc:abc123',
			collection: 'app.bsky.feed.post',
			rkey: 'post/key'
		});
	});

	it('extracts encoded repo path segments from URLs', () => {
		const url = new URL('https://example.com/base/repos/did:plc:abc123/collections/app.bsky.feed.post/post%2Fkey');

		expect(repoPathSegments(url)).toEqual(['collections', 'app.bsky.feed.post', 'post%2Fkey']);
	});

	it('rejects unknown repo routes', () => {
		expect(() => repoRouteFromSegments('did:plc:abc123', ['unknown'])).toThrow('Unknown repository route.');
	});
});
