export type LiveStreamKind = 'jetstream' | 'firehose' | 'spacedust';

export type LiveEvent = {
	id: string;
	stream: LiveStreamKind;
	time: string;
	kind: string;
	operation: string | null;
	did: string | null;
	collection: string | null;
	source: string | null;
	summary: string;
	bytes: number | null;
	json: string;
};

export const streamDefaults: Record<LiveStreamKind, { instance: string; collection: string }> = {
	jetstream: { instance: 'wss://jetstream.us-east.bsky.network', collection: 'app.bsky.feed.post' },
	firehose: { instance: 'wss://relay1.us-east.bsky.network', collection: '' },
	spacedust: { instance: 'wss://spacedust.microcosm.blue', collection: 'app.bsky.feed.like:subject.uri' }
};

const streamPaths: Record<LiveStreamKind, string> = {
	jetstream: '/xrpc/network.bsky.jetstream.subscribeEvents',
	firehose: '/xrpc/com.atproto.sync.subscribeRepos',
	spacedust: '/subscribe'
};

export function buildLiveStreamUrl(
	kind: LiveStreamKind,
	options: { instance: string; did?: string; collection?: string; cursor?: string }
) {
	const url = new URL(options.instance.trim());
	if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
		throw new Error('Stream instances must use a WebSocket URL (wss:// or ws://).');
	}

	if (url.pathname === '/' || url.pathname === '') url.pathname = streamPaths[kind];

	const did = options.did?.trim();
	const collection = options.collection?.trim();
	const cursor = options.cursor?.trim();

	if (kind === 'jetstream') {
		if (did) url.searchParams.append('dids', did);
		if (collection) url.searchParams.append('collections', collection);
	}

	if (kind === 'spacedust') {
		if (did) url.searchParams.append('wantedSubjectDids', did);
		if (collection?.includes(':')) url.searchParams.append('wantedSources', collection);
	}

	if (kind !== 'spacedust' && cursor) url.searchParams.set('cursor', cursor);
	return url.toString();
}

export function parseTextLiveEvent(kind: Exclude<LiveStreamKind, 'firehose'>, raw: string, receivedAt = new Date()) {
	const parsed: unknown = JSON.parse(raw);
	if (!isObject(parsed)) throw new Error('The stream returned a JSON value that was not an event object.');

	if (kind === 'spacedust') return parseSpacedustEvent(parsed, raw, receivedAt);
	return parseJetstreamEvent(parsed, raw, receivedAt);
}

export function parseFirehoseEvent(message: unknown, receivedAt = new Date()): LiveEvent {
	if (!isObject(message)) throw new Error('The firehose returned a value that was not an event object.');

	const type = stringValue(message.$type) ?? 'event';
	const kind = type.includes('#') ? (type.split('#').pop() ?? type) : type;
	const did = stringValue(message.repo) ?? stringValue(message.did);
	const operations = Array.isArray(message.ops) ? message.ops.filter(isObject) : [];
	const firstOperation = operations[0];
	const operation = stringValue(firstOperation?.action);
	const path = stringValue(firstOperation?.path);
	const collection = path?.split('/')[0] ?? null;
	const time = stringValue(message.time) ?? receivedAt.toISOString();
	const json = JSON.stringify(message, firehoseJsonReplacer, 2);
	const operationSummary =
		operations.length === 1 ? path : operations.length > 1 ? `${operations.length} record operations` : null;

	return {
		id: `firehose-${String(message.seq ?? receivedAt.getTime())}-${cryptoId()}`,
		stream: 'firehose',
		time,
		kind,
		operation,
		did,
		collection,
		source: collection ?? 'Relay event',
		summary: [operation, operationSummary ?? did ?? kind].filter(Boolean).join(' '),
		bytes: new Blob([json]).size,
		json
	};
}

function parseJetstreamEvent(parsed: Record<string, unknown>, raw: string, receivedAt: Date): LiveEvent {
	const payload = isObject(parsed.payload) ? parsed.payload : parsed;
	const nestedCommit = isObject(payload.commit) ? payload.commit : null;
	const type = stringValue(payload.$type) ?? stringValue(payload.kind) ?? 'event';
	const kind = type.includes('#') ? (type.split('#').pop() ?? type) : type;
	const operation = stringValue(payload.operation) ?? stringValue(nestedCommit?.operation);
	const collection = stringValue(payload.collection) ?? stringValue(nestedCommit?.collection);
	const did = stringValue(payload.did) ?? stringValue(payload.repo);
	const rkey = stringValue(payload.rkey) ?? stringValue(nestedCommit?.rkey);
	const time = stringValue(payload.time) ?? microsecondsToIso(payload.time_us) ?? receivedAt.toISOString();
	const subject = [collection, rkey].filter(Boolean).join('/');

	return {
		id: `jetstream-${String(payload.seq ?? payload.cursor ?? receivedAt.getTime())}-${cryptoId()}`,
		stream: 'jetstream',
		time,
		kind,
		operation,
		did,
		collection,
		source: collection,
		summary: [operation, subject || kind].filter(Boolean).join(' '),
		bytes: new Blob([raw]).size,
		json: JSON.stringify(parsed, null, 2)
	};
}

function parseSpacedustEvent(parsed: Record<string, unknown>, raw: string, receivedAt: Date): LiveEvent {
	const link = isObject(parsed.link) ? parsed.link : {};
	const source = stringValue(link.source);
	const sourceRecord = stringValue(link.source_record);
	const subject = stringValue(link.subject);
	const collection = source?.split(':', 1)[0] ?? null;
	const did = didFromAtUri(sourceRecord);
	const operation = stringValue(link.operation);

	return {
		id: `spacedust-${receivedAt.getTime()}-${cryptoId()}`,
		stream: 'spacedust',
		time: receivedAt.toISOString(),
		kind: stringValue(parsed.kind) ?? 'link',
		operation,
		did,
		collection,
		source,
		summary: `${source ?? 'link'} → ${subject ?? 'unknown target'}`,
		bytes: new Blob([raw]).size,
		json: JSON.stringify(parsed, null, 2)
	};
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
	return typeof value === 'string' ? value : null;
}

function microsecondsToIso(value: unknown) {
	if (typeof value !== 'number') return null;
	return new Date(value / 1000).toISOString();
}

function didFromAtUri(value: string | null) {
	if (!value?.startsWith('at://')) return null;
	return value.slice(5).split('/')[0] || null;
}

function firehoseJsonReplacer(_key: string, value: unknown) {
	if (value instanceof Uint8Array) return `[${value.byteLength} bytes]`;
	if (typeof value === 'bigint') return value.toString();
	return value;
}

function cryptoId() {
	return typeof crypto === 'undefined' ? Math.random().toString(36).slice(2) : crypto.randomUUID();
}
