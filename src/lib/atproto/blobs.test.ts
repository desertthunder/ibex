import { describe, expect, it } from 'vitest';
import { blobReferences, firstBlobReference, isRenderableBlob } from './blobs.svelte';

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

		expect(blob).toEqual({
			cid: 'bafkreigoodimage',
			sourceUri: 'at://did:plc:abc123/app.bsky.feed.post/post1',
			mimeType: 'image/png',
			size: 1234,
			path: 'embed.images.[0].image'
		});
	});

	it('returns null when a record has no blob ref', () => {
		expect(firstBlobReference({ text: 'plain record' }, 'at://did:plc:abc123/app.bsky.feed.post/post2')).toBeNull();
	});

	it('collects multiple blob references with MIME metadata', () => {
		const references = blobReferences(
			{
				$type: 'standard.site.document',
				cover: { ref: { $link: 'bafkcover' }, mimeType: 'image/jpeg', size: 256 },
				body: { ref: { $link: 'bafkbody' }, mimeType: 'text/markdown', size: 1024 }
			},
			'at://did:plc:abc123/standard.site.document/home'
		);

		expect(references).toEqual([
			{
				cid: 'bafkcover',
				sourceUri: 'at://did:plc:abc123/standard.site.document/home',
				mimeType: 'image/jpeg',
				size: 256,
				path: 'cover'
			},
			{
				cid: 'bafkbody',
				sourceUri: 'at://did:plc:abc123/standard.site.document/home',
				mimeType: 'text/markdown',
				size: 1024,
				path: 'body'
			}
		]);
	});

	it('only treats image and video blobs as previewable media', () => {
		const [image, document] = blobReferences(
			{
				image: { ref: { $link: 'bafkimage' }, mimeType: 'image/png', size: 1 },
				document: { ref: { $link: 'bafkdocument' }, mimeType: 'text/markdown', size: 1 }
			},
			null
		);

		expect(isRenderableBlob(image!)).toBe(true);
		expect(isRenderableBlob(document!)).toBe(false);
	});
});
