export type AccountIdentity = {
	handle: string;
	did: string;
	pds: string | null;
	displayName: string | null;
	avatar: string | null;
	description: string | null;
};

export type ActorTypeaheadResult = Pick<AccountIdentity, 'handle' | 'did' | 'displayName' | 'avatar'>;

export type DidDocument = {
	service?: Array<{ id?: string; type?: string; serviceEndpoint?: string | string[] | Record<string, unknown> }>;
};

export type CollectionSummary = { name: string; icon: string; appLabel: string | null; loadedCount: number | null };

export type RepoRecordSummary = {
	uri: string;
	cid: string;
	title: string;
	body: string;
	author: string;
	modified: string;
	collection: string;
	rkey: string;
	json: string;
	icon: string;
	appLabel: string | null;
};

export type UnknownRecord = { uri: string; cid: string; value: unknown };

export function isRecordValue(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
