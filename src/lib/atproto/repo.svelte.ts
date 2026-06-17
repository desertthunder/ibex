import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Nsid } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import type { CachedRecordInput } from '$lib/db';
import { errorMessage } from '$lib/utils/errors';
import { appLabelForCollection, collectionIconMatch } from './collection-icons';
import { listRecordPages, type RecordPage } from './pagination';
import { isRecordValue } from './types';
import type { AccountIdentity, CollectionSummary, RepoRecordSummary, UnknownRecord } from './types';
import { truncate } from '$lib/utils/text';

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
	recordPageSize = $state(25);
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

	async loadCollectionRoute(identity: AccountIdentity, collectionName: string) {
		if (this.loadedDid === identity.did && this.collections.length > 0) {
			this.ensureCollection(collectionName);
			await this.selectCollection(identity, collectionName);
			return;
		}

		this.reset();
		this.loadedDid = identity.did;
		this.selectedCollection = collectionName;
		this.isLoadingCollections = true;
		this.error = null;

		try {
			const repo = await describeRepo(identity);
			const collectionNames = repo.collections.some((name) => name === collectionName)
				? repo.collections
				: [collectionName, ...repo.collections];

			this.collections = collectionNames.sort().map((name) => collectionSummaryForName(name, null));
			await this.selectCollection(identity, collectionName);
		} catch (unknownError) {
			const loadedFromCache = await this.loadRecordsFromCache(identity, collectionName);
			if (this.collections.length === 0) {
				this.collections = [collectionSummaryForName(collectionName, null)];
			}
			this.error = loadedFromCache
				? `Showing cached records. ${errorMessage(unknownError, `Could not load records for ${collectionName}.`)}`
				: errorMessage(unknownError, `Could not load records for ${collectionName}.`);
		} finally {
			this.isLoadingCollections = false;
		}
	}

	private ensureCollection(collectionName: string) {
		if (this.collections.some((collection) => collection.name === collectionName)) return;

		this.collections = [...this.collections, collectionSummaryForName(collectionName, null)].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	async selectCollection(identity: AccountIdentity, collectionName: string) {
		this.selectedCollection = collectionName;
		this.selectedRecord = null;
		this.searchQuery = '';
		this.isLoadingRecords = true;
		this.canLoadMoreRecords = false;
		this.error = null;

		try {
			this.records = [];
			this.recordPages = listRecordPages({ identity, collection: collectionName, limit: this.recordPageSize });
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
			const { getDatabase, listCachedCollections } = await import('$lib/db');
			const db = await getDatabase();
			const collections = await listCachedCollections(db, identity.did);

			if (collections.length === 0) return false;

			this.collections = collections.map((collection) =>
				collectionSummaryForName(collection.name, collection.loadedCount)
			);
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
			const { getDatabase, searchCachedRecords } = await import('$lib/db');
			const db = await getDatabase();
			const results = await searchCachedRecords(db, normalizedQuery, {
				repoDid: identity.did,
				collection: this.selectedCollection ?? undefined
			});
			this.records = results.map((record) => {
				return summarizeRecord({ uri: record.uri, cid: record.cid, value: record.value }, identity.handle);
			});
		} catch (searchError) {
			this.records = [];
			this.error = errorMessage(searchError, 'Could not search records.');
		} finally {
			this.isSearching = false;
		}
	}

	async openRecordRoute(identity: AccountIdentity, collectionName: string, rkey: string) {
		this.reset();
		this.loadedDid = identity.did;
		this.selectedCollection = collectionName;
		this.isLoadingCollections = true;
		this.isLoadingRecords = true;
		this.error = null;

		try {
			const [repo, record] = await Promise.all([
				describeRepo(identity),
				getRepoRecord(identity, collectionName, rkey)
			]);
			const collectionNames = repo.collections.some((name) => name === collectionName)
				? repo.collections
				: [collectionName, ...repo.collections];

			this.collections = collectionNames.sort().map((name) => collectionSummaryForName(name, null));
			this.selectedCollection = collectionName;
			this.recordPages = listRecordPages({ identity, collection: collectionName, limit: this.recordPageSize });
			await this.loadNextRecordPage(identity, { throwOnError: false });

			const summary = summarizeRecord(record, identity.handle);
			this.selectedRecord = summary;

			if (!this.records.some((existingRecord) => existingRecord.uri === summary.uri)) {
				this.records = [summary, ...this.records];
			}

			this.collections = this.collections.map((collection) =>
				collection.name === collectionName ? { ...collection, loadedCount: this.records.length } : collection
			);
		} catch (unknownError) {
			this.error = errorMessage(unknownError, `Could not open ${collectionName}/${rkey}.`);
		} finally {
			this.isLoadingCollections = false;
			this.isLoadingRecords = false;
		}
	}

	async loadRecordsFromCache(identity: AccountIdentity, collectionName: string) {
		try {
			const { getDatabase, listCachedRecords } = await import('$lib/db');
			const db = await getDatabase();
			const records = await listCachedRecords(db, {
				repoDid: identity.did,
				collection: collectionName,
				limit: this.recordPageSize
			});

			if (records.length === 0) return false;

			this.recordPages = null;
			this.canLoadMoreRecords = false;
			this.records = records.map((record) => {
				return summarizeRecord({ uri: record.uri, cid: record.cid, value: record.value }, identity.handle);
			});

			this.collections = this.collections.map((collection) =>
				collection.name === collectionName ? { ...collection, loadedCount: records.length } : collection
			);
			return true;
		} catch (cacheError) {
			console.warn('Could not read cached records.', cacheError);
			return false;
		}
	}

	async setRecordPageSize(identity: AccountIdentity, pageSize: number) {
		if (this.recordPageSize === pageSize) return;

		this.recordPageSize = pageSize;

		if (this.selectedCollection && !this.searchQuery) {
			await this.selectCollection(identity, this.selectedCollection);
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
		this.recordPageSize = 25;
		this.error = null;
		this.loadedDid = null;
		this.recordPages = null;
	}
}

function createRepoClient(identity: AccountIdentity) {
	return new Client({ handler: simpleFetchHandler({ service: identity.pds ?? 'https://public.api.bsky.app' }) });
}

function describeRepo(identity: AccountIdentity) {
	const rpc = createRepoClient(identity);
	return ok(rpc.get('com.atproto.repo.describeRepo', { params: { repo: identity.did as ActorIdentifier } }));
}

async function getRepoRecord(identity: AccountIdentity, collectionName: string, rkey: string): Promise<UnknownRecord> {
	const rpc = createRepoClient(identity);
	const record = await ok(
		rpc.get('com.atproto.repo.getRecord', {
			params: { repo: identity.did as ActorIdentifier, collection: collectionName as Nsid, rkey }
		})
	);

	return { uri: record.uri, cid: record.cid ?? '', value: record.value };
}

function preferredCollection(collections: string[]) {
	return collections.includes('app.bsky.feed.post') ? 'app.bsky.feed.post' : (collections[0] ?? null);
}

function collectionSummaryForName(name: string, loadedCount: number | null): CollectionSummary {
	return { name, icon: iconForCollection(name), appLabel: appLabelForCollection(name), loadedCount };
}

function summarizeRecord(record: UnknownRecord, handle: string): RepoRecordSummary {
	const value = isRecordValue(record.value) ? record.value : {};
	const text = stringifyField(value.text) ?? stringifyField(value.name) ?? stringifyField(value.displayName);
	const type = stringifyField(value.$type) ?? collectionFromUri(record.uri);
	const createdAt = stringifyField(value.createdAt) ?? stringifyField(value.indexedAt);
	// TODO: we should probably only show rkey
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
		value: record.value,
		icon: iconForCollection(collectionFromUri(record.uri)),
		appLabel: appLabelForCollection(collectionFromUri(record.uri))
	};
}

async function cacheLiveRecords(
	id: AccountIdentity,
	name: string,
	records: readonly UnknownRecord[],
	cursor: string | null
) {
	try {
		const { cacheFetchedRecords, getDatabase, updateCollectionSyncState } = await import('$lib/db');
		const db = await getDatabase();
		await cacheFetchedRecords(
			db,
			records.map((record) => toCachedRecordInput(id, name, record))
		);
		await updateCollectionSyncState(db, {
			accountDid: id.did,
			repoDid: id.did,
			collection: name,
			cursor,
			lastSyncedAt: new Date().toISOString(),
			lastError: null
		});
	} catch (err) {
		console.warn('Could not write records to local cache.', err);
	}
}

function toCachedRecordInput(id: AccountIdentity, name: string, record: UnknownRecord): CachedRecordInput {
	const value = isRecordValue(record.value) ? record.value : {};
	const text = stringifyField(value.text) ?? stringifyField(value.name) ?? stringifyField(value.displayName) ?? '';
	const type = stringifyField(value.$type) ?? name;
	const createdAt = stringifyField(value.createdAt);
	const indexedAt = stringifyField(value.indexedAt);
	const updatedAt = stringifyField(value.updatedAt);

	return {
		accountDid: id.did,
		repoDid: id.did,
		collection: name,
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

export function iconForCollection(name: string) {
	const appIcon = collectionIconMatch(name)?.icon;
	if (appIcon) return appIcon;
	if (name.includes('profile') || name.includes('actor')) return '/icons/humanity/places/user-home.svg';
	if (name.includes('chat') || name.includes('convo')) return '/icons/humanity/apps/evolution-mail.svg';
	if (name.includes('feed') || name.includes('post')) return '/icons/humanity/apps/internet-feed-reader.svg';
	if (name.includes('graph') || name.includes('follow')) return '/icons/humanity/places/folder.svg';
	return '/icons/humanity/mimes/text-x-generic.svg';
}

export const repoBrowser = new RepoBrowserState();
