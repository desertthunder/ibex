import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Nsid } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import type { AccountIdentity, UnknownRecord } from './types';

export type RecordPage = { records: UnknownRecord[]; cursor: string | null };

export type RecordPageRequest = { identity: AccountIdentity; collection: string; limit?: number };

export async function* listRecordPages({
	identity,
	collection,
	limit = 25
}: RecordPageRequest): AsyncGenerator<RecordPage> {
	const rpc = new Client({ handler: simpleFetchHandler({ service: identity.pds ?? 'https://public.api.bsky.app' }) });
	let cursor: string | undefined;

	do {
		const response = await ok(
			rpc.get('com.atproto.repo.listRecords', {
				params: { repo: identity.did as ActorIdentifier, collection: collection as Nsid, limit, reverse: true, cursor }
			})
		);

		cursor = response.cursor;
		yield { records: response.records, cursor: cursor ?? null };
	} while (cursor);
}
