<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { repoBlobs } from '$lib/atproto/blobs.svelte';
	import { hydratePublicIdentity } from '$lib/atproto/identity';
	import { repoSession } from '$lib/atproto/session.svelte';
	import { repoBrowser } from '$lib/atproto/repo.svelte';
	import CollectionBrowser from '$lib/components/CollectionBrowser.svelte';
	import { repoRouteKey, type RepoRoute } from '$lib/desktop-routes';
	import { errorMessage } from '$lib/utils/errors';
	import { windowManager } from '$lib/window-manager.svelte';

	let { children } = $props();
	let handledRouteKey: string | null = null;

	onMount(() => {
		openCurrentRoute();
	});

	afterNavigate(() => {
		openCurrentRoute();
	});

	function openCurrentRoute() {
		const route = page.data.repoRoute;
		if (!route) return;

		const routeKey = repoRouteKey(route);
		if (handledRouteKey === routeKey) return;

		handledRouteKey = routeKey;
		void openRepoRoute(route);
	}

	onDestroy(() => {
		closeRoutedWindows();
	});

	async function openRepoRoute(route: RepoRoute) {
		try {
			const identity = await hydratePublicIdentity(route.did);
			repoSession.set(identity);
			windowManager.restore('main');
			closeWindowsOutsideRoute(route);

			if (route.kind === 'identity') {
				await repoBrowser.load(identity);
				windowManager.setTitle('identity-inspector', `${identity.handle} - Identity Inspector`);
				windowManager.open('identity-inspector');
				return;
			}

			if (route.kind === 'blobs' || route.kind === 'blob') {
				await repoBrowser.load(identity);
				await repoBlobs.load(identity, route.kind === 'blob' ? route.cid : null);
				windowManager.setTitle(
					'eog',
					route.kind === 'blob' ? `${route.cid} - Eye of GNOME` : `${identity.handle} - Eye of GNOME`
				);
				windowManager.open('eog');
				return;
			}

			if (route.kind === 'record') {
				await repoBrowser.openRecordRoute(identity, route.collection, route.rkey);
				if (repoBrowser.selectedRecord) {
					windowManager.setTitle(
						'gedit',
						`${repoBrowser.selectedRecord.rkey}.json - gedit`,
						repoBrowser.selectedRecord.icon
					);
					windowManager.open('gedit');
				}
				return;
			}

			if (route.kind === 'collection') {
				await repoBrowser.loadCollectionRoute(identity, route.collection);
				return;
			}

			await repoBrowser.load(identity);
		} catch (unknownError) {
			repoBrowser.error = errorMessage(unknownError, 'Could not open that repository route.');
		}
	}

	function closeWindowsOutsideRoute(route: RepoRoute) {
		if (route.kind !== 'record') {
			windowManager.close('gedit');
		}

		if (route.kind !== 'identity') {
			windowManager.close('identity-inspector');
		}

		if (route.kind !== 'blobs' && route.kind !== 'blob') {
			windowManager.close('eog');
		}
	}

	function closeRoutedWindows() {
		windowManager.close('gedit');
		windowManager.close('identity-inspector');
		windowManager.close('eog');
	}
</script>

<CollectionBrowser />
{@render children()}
