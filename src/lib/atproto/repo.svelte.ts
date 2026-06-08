import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Nsid } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import type { AccountIdentity } from './identity';

export type CollectionSummary = { name: string; icon: string; loadedCount: number | null };

export type RepoRecordSummary = {
	uri: string;
	cid: string;
	title: string;
	body: string;
	author: string;
	modified: string;
};

class RepoBrowserState {
	collections = $state<CollectionSummary[]>([]);
	selectedCollection = $state<string | null>(null);
	records = $state<RepoRecordSummary[]>([]);
	isLoadingCollections = $state(false);
	isLoadingRecords = $state(false);
	error = $state<string | null>(null);
	loadedDid = $state<string | null>(null);

	get selectedSummary() {
		return this.collections.find((collection) => collection.name === this.selectedCollection) ?? null;
	}

	async load(identity: AccountIdentity) {
		if (this.loadedDid === identity.did && this.collections.length > 0) {
			return;
		}

		this.reset();
		this.loadedDid = identity.did;
		this.isLoadingCollections = true;
		this.error = null;

		try {
			const rpc = createRepoClient(identity);
			const repo = await ok(
				rpc.get('com.atproto.repo.describeRepo', { params: { repo: identity.did as ActorIdentifier } })
			);

			this.collections = repo.collections
				.sort()
				.map((name) => ({ name, icon: iconForCollection(name), loadedCount: null }));
			this.selectedCollection = preferredCollection(this.collections.map((collection) => collection.name));

			if (this.selectedCollection) {
				await this.selectCollection(identity, this.selectedCollection);
			}
		} catch (unknownError) {
			this.error = messageFromError(unknownError, 'Could not load repository collections.');
		} finally {
			this.isLoadingCollections = false;
		}
	}

	async selectCollection(identity: AccountIdentity, collectionName: string) {
		this.selectedCollection = collectionName;
		this.isLoadingRecords = true;
		this.error = null;

		try {
			const rpc = createRepoClient(identity);
			const response = await ok(
				rpc.get('com.atproto.repo.listRecords', {
					params: {
						repo: identity.did as ActorIdentifier,
						collection: collectionName as Nsid,
						limit: 25,
						reverse: true
					}
				})
			);

			this.records = response.records.map((record) => summarizeRecord(record, identity.handle));
			this.collections = this.collections.map((collection) =>
				collection.name === collectionName ? { ...collection, loadedCount: response.records.length } : collection
			);
		} catch (unknownError) {
			this.records = [];
			this.error = messageFromError(unknownError, `Could not load records for ${collectionName}.`);
		} finally {
			this.isLoadingRecords = false;
		}
	}

	reset() {
		this.collections = [];
		this.selectedCollection = null;
		this.records = [];
		this.isLoadingCollections = false;
		this.isLoadingRecords = false;
		this.error = null;
		this.loadedDid = null;
	}
}

export const repoBrowser = new RepoBrowserState();

function createRepoClient(identity: AccountIdentity) {
	return new Client({ handler: simpleFetchHandler({ service: identity.pds ?? 'https://public.api.bsky.app' }) });
}

function preferredCollection(collections: string[]) {
	return collections.includes('app.bsky.feed.post') ? 'app.bsky.feed.post' : (collections[0] ?? null);
}

export function iconForCollection(name: string) {
	if (name.includes('profile') || name.includes('actor')) return '/icons/humanity/places/user-home.svg';
	if (name.includes('chat') || name.includes('convo')) return '/icons/humanity/apps/evolution-mail.svg';
	if (name.includes('feed') || name.includes('post')) return '/icons/humanity/apps/internet-feed-reader.svg';
	if (name.includes('graph') || name.includes('follow')) return '/icons/humanity/places/folder.svg';
	return '/icons/humanity/mimes/text-x-generic.svg';
}

type UnknownRecord = { uri: string; cid: string; value: unknown };

function summarizeRecord(record: UnknownRecord, handle: string): RepoRecordSummary {
	const value = isRecordValue(record.value) ? record.value : {};
	const text = stringifyField(value.text) ?? stringifyField(value.name) ?? stringifyField(value.displayName);
	const type = stringifyField(value.$type) ?? collectionFromUri(record.uri);
	const createdAt = stringifyField(value.createdAt) ?? stringifyField(value.indexedAt);
	const title = text ? truncate(text.replaceAll('\n', ' '), 54) : recordKeyFromUri(record.uri);
	const body = text ?? `Record type: ${type}`;

	return {
		uri: record.uri,
		cid: record.cid,
		title,
		body: truncate(body.replaceAll('\n', ' '), 140),
		author: `@${handle}`,
		modified: formatRecordTime(createdAt)
	};
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function stringifyField(value: unknown) {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function truncate(value: string, maxLength: number) {
	return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function collectionFromUri(uri: string) {
	return uri.split('/')[3] ?? 'unknown.collection';
}

function recordKeyFromUri(uri: string) {
	return uri.split('/').at(-1) ?? uri;
}

function formatRecordTime(value: string | null) {
	if (!value) return '—';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';

	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(date);
}

function messageFromError(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}
