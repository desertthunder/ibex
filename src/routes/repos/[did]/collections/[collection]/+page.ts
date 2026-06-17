import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: { kind: 'collection', did: params.did, collection: params.collection }
});
