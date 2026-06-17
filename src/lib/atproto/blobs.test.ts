import { describe, expect, it } from 'vitest';
import { firstBlobReference } from './blobs.svelte';

describe('ATProto blob helpers', () => {
	it('finds the first embedded blob CID in a post image record', () => {
		const blob = firstBlobReference(
			{
				$type: 'app.bsky.feed.post',
				embed: {
					$type: 'app.bsky.embed.images',
					images: [
						{ alt: 'screenshot', image: { ref: { $link: 'bafkreigoodimage' }, mimeType: 'image/png', size: 1234 } }
					]
				}
			},
			'at://did:plc:abc123/app.bsky.feed.post/post1'
		);

		expect(blob).toEqual({ cid: 'bafkreigoodimage', sourceUri: 'at://did:plc:abc123/app.bsky.feed.post/post1' });
	});

	it('returns null when a record has no blob ref', () => {
		expect(firstBlobReference({ text: 'plain record' }, 'at://did:plc:abc123/app.bsky.feed.post/post2')).toBeNull();
	});
});
