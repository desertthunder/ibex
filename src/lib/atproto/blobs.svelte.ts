import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import { errorMessage } from '$lib/utils/errors';
import type { AccountIdentity, BlobReference, RepoBlobSummary } from './types';

class RepoBlobState {
	blobs = $state<RepoBlobSummary[]>([]);
	selectedCid = $state<string | null>(null);
	isLoading = $state(false);
	isLoadingMore = $state(false);
	canLoadMore = $state(false);
	error = $state<string | null>(null);
	loadedDid = $state<string | null>(null);
	private cursor = $state<string | null>(null);

	// TODO: should be $derived
	get selectedBlob() {
		return this.blobs.find((blob) => blob.cid === this.selectedCid) ?? null;
	}

	// TODO: should be $derived
	get selectedIndex() {
		return this.blobs.findIndex((blob) => blob.cid === this.selectedCid);
	}

	async load(identity: AccountIdentity, selectedCid?: string | null) {
		if (this.loadedDid === identity.did && this.blobs.length > 0) {
			if (selectedCid) this.select(identity, selectedCid);
			return;
		}

		this.reset();
		this.loadedDid = identity.did;
		this.isLoading = true;
		this.error = null;

		try {
			const page = await listBlobPage(identity);
			this.blobs = page.cids.map((cid) => blobSummary(identity, cid, null));
			this.cursor = page.cursor ?? null;
			this.canLoadMore = Boolean(page.cursor);

			if (selectedCid) {
				this.select(identity, selectedCid);
			} else {
				this.selectedCid = this.blobs[0]?.cid ?? null;
			}
		} catch (unknownError) {
			if (selectedCid) {
				this.blobs = [blobSummary(identity, selectedCid, null)];
				this.selectedCid = selectedCid;
			}
			this.error = errorMessage(unknownError, 'Could not load repository blobs.');
		} finally {
			this.isLoading = false;
		}
	}

	async loadMore(identity: AccountIdentity) {
		if (!this.cursor || this.isLoadingMore) return;

		this.isLoadingMore = true;
		this.error = null;

		try {
			const page = await listBlobPage(identity, this.cursor);
			const knownCids = new Set(this.blobs.map((blob) => blob.cid));
			const nextBlobs = page.cids.filter((cid) => !knownCids.has(cid)).map((cid) => blobSummary(identity, cid, null));

			this.blobs = [...this.blobs, ...nextBlobs];
			this.cursor = page.cursor ?? null;
			this.canLoadMore = Boolean(page.cursor);
		} catch (unknownError) {
			this.canLoadMore = false;
			this.error = errorMessage(unknownError, 'Could not load more blobs.');
		} finally {
			this.isLoadingMore = false;
		}
	}

	openMedia(identity: AccountIdentity, media: BlobReference) {
		this.loadedDid = identity.did;
		const summary = blobSummary(identity, media.cid, media.sourceUri);

		if (!this.blobs.some((blob) => blob.cid === media.cid)) {
			this.blobs = [summary, ...this.blobs];
		}

		this.selectedCid = media.cid;
		this.error = null;
	}

	select(identity: AccountIdentity, cid: string) {
		if (!this.blobs.some((blob) => blob.cid === cid)) {
			this.blobs = [blobSummary(identity, cid, null), ...this.blobs];
		}

		this.selectedCid = cid;
	}

	selectPrevious() {
		if (this.selectedIndex <= 0) return;
		this.selectedCid = this.blobs[this.selectedIndex - 1]?.cid ?? this.selectedCid;
	}

	selectNext() {
		if (this.selectedIndex < 0 || this.selectedIndex >= this.blobs.length - 1) return;
		this.selectedCid = this.blobs[this.selectedIndex + 1]?.cid ?? this.selectedCid;
	}

	reset() {
		this.blobs = [];
		this.selectedCid = null;
		this.isLoading = false;
		this.isLoadingMore = false;
		this.canLoadMore = false;
		this.error = null;
		this.loadedDid = null;
		this.cursor = null;
	}
}

function isBlobObject(value: object): value is { ref: { $link: string } } {
	if (!('ref' in value)) return false;
	const { ref } = value;
	return (
		typeof ref === 'object' && ref !== null && '$link' in ref && typeof (ref as { $link?: unknown }).$link === 'string'
	);
}

async function listBlobPage(identity: AccountIdentity, cursor?: string | null) {
	const rpc = new Client({ handler: simpleFetchHandler({ service: identity.pds ?? 'https://public.api.bsky.app' }) });
	return ok(
		rpc.get('com.atproto.sync.listBlobs', {
			params: { did: identity.did as Did, limit: 50, cursor: cursor ?? undefined }
		})
	);
}

function blobSummary(identity: AccountIdentity, cid: string, sourceUri: string | null): RepoBlobSummary {
	return { cid, sourceUri, rawUrl: rawBlobUrl(identity, cid) };
}

function rawBlobUrl(identity: AccountIdentity, cid: string) {
	const service = identity.pds ?? 'https://public.api.bsky.app';
	const url = new URL('/xrpc/com.atproto.sync.getBlob', service);
	url.searchParams.set('did', identity.did);
	url.searchParams.set('cid', cid);
	return url.toString();
}

export function firstBlobReference(value: unknown, sourceUri: string | null): BlobReference | null {
	if (typeof value !== 'object' || value === null) return null;

	if (isBlobObject(value)) {
		return { cid: value.ref.$link, sourceUri };
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const found = firstBlobReference(item, sourceUri);
			if (found) return found;
		}
		return null;
	}

	for (const child of Object.values(value)) {
		const found = firstBlobReference(child, sourceUri);
		if (found) return found;
	}

	return null;
}

export const repoBlobs = new RepoBlobState();
