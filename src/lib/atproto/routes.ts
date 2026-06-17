export type RecordRouteParams = { did: string; collection: string; rkey: string };

export type CollectionRouteParams = Pick<RecordRouteParams, 'did' | 'collection'>;

export function repoPath(did: string) {
	return `/repos/${did}`;
}

export function identityPath(did: string) {
	return `${repoPath(did)}/identity`;
}

export function collectionPath({ did, collection }: CollectionRouteParams) {
	return `${repoPath(did)}/collections/${collection}`;
}

export function recordPath({ did, collection, rkey }: RecordRouteParams) {
	return `${collectionPath({ did, collection })}/${encodeURIComponent(rkey)}`;
}
