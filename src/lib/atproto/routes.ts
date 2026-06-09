export type RecordRouteParams = { did: string; collection: string; rkey: string };

export function recordPath({ did, collection, rkey }: RecordRouteParams) {
	return `/records/${did}/${collection}/${encodeURIComponent(rkey)}`;
}
