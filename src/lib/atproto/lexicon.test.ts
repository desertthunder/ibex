import { describe, expect, it } from 'vitest';
import { lexiconApiUrl, lexiconPath, normalizeLexiconInput } from './lexicon';

describe('lexicon helpers', () => {
	it('normalizes NSID input', () => {
		expect(normalizeLexiconInput(' app.bsky.feed.post ')).toBe('app.bsky.feed.post');
	});

	it('normalizes at:// lexicon records', () => {
		expect(normalizeLexiconInput('at://did:plc:abc/com.atproto.lexicon.schema/app.bsky.feed.post#main')).toBe(
			'app.bsky.feed.post'
		);
	});

	it('normalizes lexdns and app route URLs', () => {
		expect(normalizeLexiconInput('https://lex.desertthunder.dev/api/resolve/com.atproto.repo.getRecord')).toBe(
			'com.atproto.repo.getRecord'
		);
		expect(normalizeLexiconInput('https://ibex.example/lexicons/app.bsky.actor.profile')).toBe(
			'app.bsky.actor.profile'
		);
	});

	it('builds lexdns and app URLs', () => {
		expect(lexiconApiUrl('app.bsky.feed.post')).toBe('https://lex.desertthunder.dev/api/resolve/app.bsky.feed.post');
		expect(lexiconPath('app.bsky.feed.post')).toBe('/lexicons/app.bsky.feed.post');
	});
});
