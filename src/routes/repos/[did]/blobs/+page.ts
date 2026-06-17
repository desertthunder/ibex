import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: { kind: 'blobs', did: params.did }
});
