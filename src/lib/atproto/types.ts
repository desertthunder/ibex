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
	'@context'?: unknown;
	id?: string;
	alsoKnownAs?: string[];
	verificationMethod?: DidVerificationMethod[];
	service?: DidService[];
};

export type DidService = { id?: string; type?: string; serviceEndpoint?: string | string[] | Record<string, unknown> };

export type DidVerificationMethod = { id?: string; type?: string; controller?: string; publicKeyMultibase?: string };

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
	value: unknown;
	icon: string;
	appLabel: string | null;
};

export type BlobReference = { cid: string; sourceUri: string | null };

export type RepoBlobSummary = { cid: string; rawUrl: string; sourceUri: string | null };

export type RecordRouteParams = { did: string; collection: string; rkey: string };

export type CollectionRouteParams = Pick<RecordRouteParams, 'did' | 'collection'>;

export type UnknownRecord = { uri: string; cid: string; value: unknown };

export function isRecordValue(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
