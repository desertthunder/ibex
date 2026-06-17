import { repoPathSegments, repoRouteFromSegments } from '$lib/desktop-routes';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => ({
	repoRoute: repoRouteFromSegments(params.did, repoPathSegments(url))
});
