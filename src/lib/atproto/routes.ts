import type { CollectionRouteParams, RecordRouteParams } from './types';

export const repoPath = (did: string) => `/repos/${did}`;

export const identityPath = (did: string) => `${repoPath(did)}/identity`;

export const blobsPath = (did: string) => `${repoPath(did)}/blobs`;

export function blobPath(did: string, cid: string) {
	return `${blobsPath(did)}/${encodeURIComponent(cid)}`;
}

export function collectionPath({ did, collection }: CollectionRouteParams) {
	return `${repoPath(did)}/collections/${collection}`;
}

export function recordPath({ did, collection, rkey }: RecordRouteParams) {
	return `${collectionPath({ did, collection })}/${encodeURIComponent(rkey)}`;
}
