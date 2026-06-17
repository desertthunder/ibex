import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: { kind: 'repo', did: params.did }
});
