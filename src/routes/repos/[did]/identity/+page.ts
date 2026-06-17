import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: { kind: 'identity', did: params.did }
});
