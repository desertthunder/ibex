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

export function repoRouteFromSegments(did: string, encodedSegments: string[]): RepoRoute {
	const [app, second, third, ...rest] = encodedSegments.map((segment) => decodeURIComponent(segment));

	if (!app) return { kind: 'repo', did };
	if (app === 'identity' && !second) return { kind: 'identity', did };
	if (app === 'blobs' && !second) return { kind: 'blobs', did };
	if (app === 'blobs' && second && !third) return { kind: 'blob', did, cid: second };
	if (app === 'collections' && second && !third) return { kind: 'collection', did, collection: second };
	if (app === 'collections' && second && third && rest.length === 0) {
		return { kind: 'record', did, collection: second, rkey: third };
	}

	throw new Error('Unknown repository route.');
}

export function repoPathSegments(url: URL) {
	const segments = url.pathname.split('/').filter(Boolean);
	const reposIndex = segments.indexOf('repos');
	return reposIndex === -1 ? [] : segments.slice(reposIndex + 2);
}
