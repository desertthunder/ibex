import { describe, expect, it } from 'vitest';

import { appLabelForCollection, collectionIconMatch } from './collection-icons';

describe('collection icon registry', () => {
	it('maps chat.bsky collections to the Bluesky app icon', () => {
		expect(collectionIconMatch('chat.bsky.convo.defs')?.icon).toBe('/atmologos/color/bluesky.svg');
		expect(appLabelForCollection('chat.bsky.convo.defs')).toBe('Bluesky');
	});

	it('maps explicit namespace icons to their static namespace path', () => {
		expect(collectionIconMatch('at.inlay.record.comment')?.icon).toBe('/icons/namespaces/at/inlay/icon.svg');
		expect(appLabelForCollection('at.inlay.record.comment')).toBe('Inlay');
	});

	it('uses the most specific matching prefix', () => {
		expect(collectionIconMatch('app.bsky.feed.post')?.icon).toBe('/atmologos/color/bluesky.svg');
	});
});
