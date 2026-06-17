import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: { kind: 'blob', did: params.did, cid: params.cid }
});
