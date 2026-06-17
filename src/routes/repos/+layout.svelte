<script lang="ts">
	import CollectionBrowser from '$lib/components/CollectionBrowser.svelte';

	let { children } = $props();
</script>

<CollectionBrowser />
{@render children()}
