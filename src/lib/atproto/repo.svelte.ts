import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import {
	cacheFetchedRecords,
	getDatabase,
	listCachedCollections,
	listCachedRecords,
	searchCachedRecords,
	updateCollectionSyncState,
	type CachedRecord,
	type CachedRecordInput
} from '$lib/db';
import { errorMessage } from '$lib/utils/errors';
import { appLabelForCollection, collectionIconMatch } from './collection-icons';
import { listRecordPages, type RecordPage } from './pagination';
import {
	isRecordValue,
	type AccountIdentity,
	type CollectionSummary,
	type RepoRecordSummary,
	type UnknownRecord
} from './types';

export type { CollectionSummary, RepoRecordSummary } from './types';

class RepoBrowserState {
	collections = $state<CollectionSummary[]>([]);
	selectedCollection = $state<string | null>(null);
	records = $state<RepoRecordSummary[]>([]);
	isLoadingCollections = $state(false);
	isLoadingRecords = $state(false);
	isLoadingMoreRecords = $state(false);
	canLoadMoreRecords = $state(false);
	isSearching = $state(false);
	searchQuery = $state('');
	error = $state<string | null>(null);
	loadedDid = $state<string | null>(null);
	selectedRecord = $state<RepoRecordSummary | null>(null);
	private recordPages: AsyncGenerator<RecordPage> | null = null;

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

			this.collections = repo.collections.sort().map((name) => collectionSummaryForName(name, null));
			this.selectedCollection = preferredCollection(this.collections.map((collection) => collection.name));

			if (this.selectedCollection) {
				await this.selectCollection(identity, this.selectedCollection);
			}
		} catch (unknownError) {
			const loadedFromCache = await this.loadCollectionsFromCache(identity);
			this.error = loadedFromCache
				? `Showing cached collections. ${errorMessage(unknownError, 'Could not load repository collections.')}`
				: errorMessage(unknownError, 'Could not load repository collections.');
		} finally {
			this.isLoadingCollections = false;
		}
	}

	async selectCollection(identity: AccountIdentity, collectionName: string) {
		this.selectedCollection = collectionName;
		this.searchQuery = '';
		this.isLoadingRecords = true;
		this.canLoadMoreRecords = false;
		this.error = null;

		try {
			this.records = [];
			this.recordPages = listRecordPages({ identity, collection: collectionName, limit: 25 });
			await this.loadNextRecordPage(identity, { throwOnError: true });
		} catch (unknownError) {
			const loadedFromCache = await this.loadRecordsFromCache(identity, collectionName);
			this.error = loadedFromCache
				? `Showing cached records. ${errorMessage(unknownError, `Could not load records for ${collectionName}.`)}`
				: errorMessage(unknownError, `Could not load records for ${collectionName}.`);
		} finally {
			this.isLoadingRecords = false;
		}
	}

	async loadNextRecordPage(identity: AccountIdentity, options: { throwOnError?: boolean } = {}) {
		if (!this.recordPages || !this.selectedCollection || this.isLoadingMoreRecords) return;

		this.isLoadingMoreRecords = true;
		this.error = null;

		try {
			const page = await this.recordPages.next();
			this.canLoadMoreRecords = !page.done && page.value.cursor !== null;

			if (page.done) return;

			const nextRecords = page.value.records.map((record) => summarizeRecord(record, identity.handle));
			this.records = [...this.records, ...nextRecords];
			this.collections = this.collections.map((collection) =>
				collection.name === this.selectedCollection ? { ...collection, loadedCount: this.records.length } : collection
			);
			void cacheLiveRecords(identity, this.selectedCollection, page.value.records, page.value.cursor);
		} catch (unknownError) {
			this.canLoadMoreRecords = false;
			this.error = errorMessage(unknownError, `Could not load more records for ${this.selectedCollection}.`);
			if (options.throwOnError) throw unknownError;
		} finally {
			this.isLoadingMoreRecords = false;
		}
	}

	async loadCollectionsFromCache(identity: AccountIdentity) {
		try {
			const db = await getDatabase();
			const collections = await listCachedCollections(db, identity.did);

			if (collections.length === 0) return false;

			this.collections = collections.map((collection) => collectionSummaryForName(collection.name, collection.loadedCount));
			this.selectedCollection = preferredCollection(this.collections.map((collection) => collection.name));

			if (this.selectedCollection) {
				await this.loadRecordsFromCache(identity, this.selectedCollection);
			}

			return true;
		} catch (cacheError) {
			console.warn('Could not read cached collections.', cacheError);
			return false;
		}
	}

	async searchRecords(identity: AccountIdentity, query: string) {
		const normalizedQuery = query.trim();
		this.searchQuery = normalizedQuery;

		if (!normalizedQuery) {
			if (this.selectedCollection) {
				await this.selectCollection(identity, this.selectedCollection);
			}
			return;
		}

		this.isSearching = true;
		this.canLoadMoreRecords = false;
		this.error = null;

		try {
			const db = await getDatabase();
			const results = await searchCachedRecords(db, normalizedQuery, {
				repoDid: identity.did,
				collection: this.selectedCollection ?? undefined
			});
			this.records = results.map((record) => summarizeCachedRecord(record, identity.handle));
		} catch (searchError) {
			this.records = [];
			this.error = errorMessage(searchError, 'Could not search cached records.');
		} finally {
			this.isSearching = false;
		}
	}

	async loadRecordsFromCache(identity: AccountIdentity, collectionName: string) {
		try {
			const db = await getDatabase();
			const records = await listCachedRecords(db, { repoDid: identity.did, collection: collectionName, limit: 25 });

			if (records.length === 0) return false;

			this.recordPages = null;
			this.canLoadMoreRecords = false;
			this.records = records.map((record) => summarizeCachedRecord(record, identity.handle));
			this.collections = this.collections.map((collection) =>
				collection.name === collectionName ? { ...collection, loadedCount: records.length } : collection
			);
			return true;
		} catch (cacheError) {
			console.warn('Could not read cached records.', cacheError);
			return false;
		}
	}

	reset() {
		this.collections = [];
		this.selectedCollection = null;
		this.records = [];
		this.selectedRecord = null;
		this.isLoadingCollections = false;
		this.isLoadingRecords = false;
		this.isLoadingMoreRecords = false;
		this.canLoadMoreRecords = false;
		this.isSearching = false;
		this.searchQuery = '';
		this.error = null;
		this.loadedDid = null;
		this.recordPages = null;
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
	const appIcon = collectionIconMatch(name)?.icon;
	if (appIcon) return appIcon;
	if (name.includes('profile') || name.includes('actor')) return '/icons/humanity/places/user-home.svg';
	if (name.includes('chat') || name.includes('convo')) return '/icons/humanity/apps/evolution-mail.svg';
	if (name.includes('feed') || name.includes('post')) return '/icons/humanity/apps/internet-feed-reader.svg';
	if (name.includes('graph') || name.includes('follow')) return '/icons/humanity/places/folder.svg';
	return '/icons/humanity/mimes/text-x-generic.svg';
}

function collectionSummaryForName(name: string, loadedCount: number | null): CollectionSummary {
	return { name, icon: iconForCollection(name), appLabel: appLabelForCollection(name), loadedCount };
}

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
		modified: formatRecordTime(createdAt),
		collection: collectionFromUri(record.uri),
		rkey: recordKeyFromUri(record.uri),
		json: JSON.stringify(record.value, null, 2),
		icon: iconForCollection(collectionFromUri(record.uri)),
		appLabel: appLabelForCollection(collectionFromUri(record.uri))
	};
}

function summarizeCachedRecord(record: CachedRecord, handle: string): RepoRecordSummary {
	return summarizeRecord({ uri: record.uri, cid: record.cid, value: record.value }, handle);
}

async function cacheLiveRecords(
	identity: AccountIdentity,
	collectionName: string,
	records: readonly UnknownRecord[],
	cursor: string | null
) {
	try {
		const db = await getDatabase();
		await cacheFetchedRecords(
			db,
			records.map((record) => toCachedRecordInput(identity, collectionName, record))
		);
		await updateCollectionSyncState(db, {
			accountDid: identity.did,
			repoDid: identity.did,
			collection: collectionName,
			cursor,
			lastSyncedAt: new Date().toISOString(),
			lastError: null
		});
	} catch (cacheError) {
		console.warn('Could not write records to local cache.', cacheError);
	}
}

function toCachedRecordInput(
	identity: AccountIdentity,
	collectionName: string,
	record: UnknownRecord
): CachedRecordInput {
	const value = isRecordValue(record.value) ? record.value : {};
	const text = stringifyField(value.text) ?? stringifyField(value.name) ?? stringifyField(value.displayName) ?? '';
	const type = stringifyField(value.$type) ?? collectionName;
	const createdAt = stringifyField(value.createdAt);
	const indexedAt = stringifyField(value.indexedAt);
	const updatedAt = stringifyField(value.updatedAt);

	return {
		accountDid: identity.did,
		repoDid: identity.did,
		collection: collectionName,
		rkey: recordKeyFromUri(record.uri),
		uri: record.uri,
		cid: record.cid,
		value: record.value,
		indexedText: [type, text, record.uri].filter(Boolean).join('\n'),
		createdAt,
		indexedAt,
		updatedAt
	};
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
