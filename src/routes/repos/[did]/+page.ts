import { repoRouteFromSegments } from '$lib/desktop-routes';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	repoRoute: repoRouteFromSegments(params.did, [])
});
