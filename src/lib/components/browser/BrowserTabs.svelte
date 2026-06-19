<script lang="ts">
	// should go in types.ts
	export type BrowserTab = 'schema' | 'json' | 'trace';
	type Props = { activeTab: BrowserTab; onselect: (tab: BrowserTab) => void };

	let { activeTab, onselect }: Props = $props();
</script>

<nav class="browser-tabs" aria-label="Browser view tabs">
	<button
		type="button"
		class:active={activeTab === 'schema'}
		aria-pressed={activeTab === 'schema'}
		onclick={() => onselect('schema')}>Schema</button>
	<button
		type="button"
		class:active={activeTab === 'json'}
		aria-pressed={activeTab === 'json'}
		onclick={() => onselect('json')}>JSON</button>
	<button
		type="button"
		class:active={activeTab === 'trace'}
		aria-pressed={activeTab === 'trace'}
		onclick={() => onselect('trace')}>Trace</button>
</nav>

<style>
	.browser-tabs {
		display: flex;
		gap: 2px;
		padding: var(--space-2) var(--space-2) 0;
		background: #d8c7ab;
		border-bottom: 1px solid #8d704b;
	}

	button {
		min-height: 1.65rem;
		padding: 0 var(--space-2);
		color: #251b13;
		background: linear-gradient(#fffaf0, #d7c6a9);
		border: 1px solid #8d704b;
		border-bottom: 0;
		border-radius: var(--radius-2) var(--radius-2) 0 0;
		box-shadow: var(--shadow-raised);
		font: inherit;
		font-size: var(--text-1);
		cursor: default;
	}

	button.active {
		color: #fffaf0;
		background: linear-gradient(#cf7125, #8a5527);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.45);
	}
</style>
