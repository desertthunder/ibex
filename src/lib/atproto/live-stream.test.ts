import { describe, expect, it } from 'vitest';
import { buildLiveStreamUrl, parseFirehoseEvent, parseTextLiveEvent } from './live-stream';

describe('live stream helpers', () => {
	it('builds Jetstream v2 URLs with server-side filters and a cursor', () => {
		const url = new URL(
			buildLiveStreamUrl('jetstream', {
				instance: 'wss://jetstream.us-east.bsky.network',
				did: 'did:plc:example',
				collection: 'app.bsky.feed.post',
				cursor: '12345'
			})
		);

		expect(url.pathname).toBe('/xrpc/network.bsky.jetstream.subscribeEvents');
		expect(url.searchParams.get('dids')).toBe('did:plc:example');
		expect(url.searchParams.get('collections')).toBe('app.bsky.feed.post');
		expect(url.searchParams.get('cursor')).toBe('12345');
	});

	it('uses Spacedust backlink filters but does not add unsupported cursors', () => {
		const url = new URL(
			buildLiveStreamUrl('spacedust', {
				instance: 'wss://spacedust.microcosm.blue',
				did: 'did:plc:target',
				collection: 'app.bsky.feed.like:subject.uri',
				cursor: '12345'
			})
		);

		expect(url.pathname).toBe('/subscribe');
		expect(url.searchParams.get('wantedSubjectDids')).toBe('did:plc:target');
		expect(url.searchParams.get('wantedSources')).toBe('app.bsky.feed.like:subject.uri');
		expect(url.searchParams.has('cursor')).toBe(false);
	});

	it('normalizes Jetstream and Spacedust JSON events', () => {
		const jetstream = parseTextLiveEvent(
			'jetstream',
			JSON.stringify({
				$type: 'message',
				payload: {
					$type: 'network.bsky.jetstream.subscribeEvents#commit',
					did: 'did:plc:author',
					seq: 42,
					time: '2026-08-13T06:47:43.959Z',
					operation: 'create',
					collection: 'app.bsky.feed.post',
					rkey: '3example'
				}
			})
		);
		const spacedust = parseTextLiveEvent(
			'spacedust',
			JSON.stringify({
				kind: 'link',
				origin: 'live',
				link: {
					operation: 'create',
					source: 'app.bsky.feed.like:subject.uri',
					source_record: 'at://did:plc:author/app.bsky.feed.like/3example',
					subject: 'at://did:plc:target/app.bsky.feed.post/3target'
				}
			})
		);

		expect(jetstream).toMatchObject({
			kind: 'commit',
			operation: 'create',
			did: 'did:plc:author',
			collection: 'app.bsky.feed.post'
		});
		expect(spacedust).toMatchObject({
			kind: 'link',
			did: 'did:plc:author',
			collection: 'app.bsky.feed.like',
			source: 'app.bsky.feed.like:subject.uri'
		});
	});

	it('normalizes decoded firehose commits and summarizes binary fields', () => {
		const event = parseFirehoseEvent({
			$type: 'com.atproto.sync.subscribeRepos#commit',
			seq: 123,
			repo: 'did:plc:author',
			time: '2026-01-01T00:00:00Z',
			ops: [{ action: 'create', path: 'app.bsky.feed.post/3example' }],
			blocks: new Uint8Array(2048)
		});

		expect(event).toMatchObject({
			kind: 'commit',
			operation: 'create',
			did: 'did:plc:author',
			collection: 'app.bsky.feed.post',
			source: 'app.bsky.feed.post',
			summary: 'create app.bsky.feed.post/3example'
		});
		expect(event.json).toContain('[2048 bytes]');
	});

	it('rejects non-WebSocket instances', () => {
		expect(() => buildLiveStreamUrl('jetstream', { instance: 'https://example.com' })).toThrow('WebSocket URL');
	});
});
