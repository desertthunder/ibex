import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: {
		kind: 'record',
		did: params.did,
		collection: params.collection,
		rkey: params.rkey
	}
});
