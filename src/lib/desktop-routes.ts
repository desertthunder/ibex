export type RepoRoute =
	| { kind: 'repo'; did: string }
	| { kind: 'collection'; did: string; collection: string }
	| { kind: 'record'; did: string; collection: string; rkey: string }
	| { kind: 'identity'; did: string }
	| { kind: 'blobs'; did: string }
	| { kind: 'blob'; did: string; cid: string };

export function repoRouteKey(route: RepoRoute) {
	if (route.kind === 'collection') return `${route.kind}/${route.did}/${route.collection}`;
	if (route.kind === 'record') return `${route.kind}/${route.did}/${route.collection}/${route.rkey}`;
	if (route.kind === 'blob') return `${route.kind}/${route.did}/${route.cid}`;
	return `${route.kind}/${route.did}`;
}
