<script lang="ts">
	import DocumentViewer from '$lib/components/DocumentViewer.svelte';

	let { data }: { data: { slug: string } } = $props();

	const title = $derived(titleFromSlug(data.slug));

	function titleFromSlug(slug: string) {
		return slug
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<svelte:head>
	<title>{title} - Intrepid Ibex</title>
</svelte:head>

<div class="docs-route">
	<DocumentViewer slug={data.slug} />
</div>

<style>
	.docs-route {
		height: 100vh;
	}
</style>
