<script lang="ts">
	import { onMount } from 'svelte';
	import type { BundledLanguage, ThemeRegistration } from 'shiki';
	import type { RepoRecordSummary } from '$lib/atproto/repo.svelte';

	type Props = { record: RepoRecordSummary };
	type TokenLine = Array<{ content: string; color?: string; fontStyle?: number }>;

	let { record }: Props = $props();
	let tokenLines = $state<TokenLine[]>([]);

	const ubuntuTheme: ThemeRegistration = {
		name: 'ubuntu-iterm2b24',
		type: 'dark',
		colors: {
			'editor.background': '#300a24',
			'editor.foreground': '#eeeeec',
			'editorLineNumber.foreground': '#747772',
			'editor.selectionBackground': '#555753'
		},
		tokenColors: [
			{ scope: ['comment'], settings: { foreground: '#747772', fontStyle: 'italic' } },
			{ scope: ['string'], settings: { foreground: '#4e9a06' } },
			{ scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#c4a000' } },
			{ scope: ['keyword', 'storage'], settings: { foreground: '#729fcf' } },
			{ scope: ['entity.name', 'support.type'], settings: { foreground: '#34e2e2' } },
			{ scope: ['variable', 'support.variable'], settings: { foreground: '#ad7fa8' } },
			{ scope: ['punctuation'], settings: { foreground: '#b3b7b0' } },
			{ scope: ['invalid'], settings: { foreground: '#ef2929' } }
		]
	};

	async function highlight() {
		const { codeToTokensBase } = await import('shiki');

		tokenLines = await codeToTokensBase(record.json, { lang: 'json' satisfies BundledLanguage, theme: ubuntuTheme });
	}

	onMount(() => {
		void highlight();
	});

	$effect(() => {
		if (record.uri) void highlight();
	});
</script>

<section class="gedit" aria-label={`${record.title} JSON record`}>
	<header class="gedit-toolbar">
		<div class="tool-group" aria-label="Document actions">
			<button type="button">Open</button>
			<button type="button">Save</button>
			<button type="button">Print</button>
		</div>
		<div class="document-path">
			<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="18" height="18" />
			<span>{record.collection}/{record.rkey}.json</span>
		</div>
	</header>

	<div class="editor-shell">
		<aside class="line-gutter" aria-hidden="true">
			{#each record.json.split('\n') as line, index (`line-${record.uri}-${index}`)}
				<span>{line ? index + 1 : index + 1}</span>
			{/each}
		</aside>

		<div class="code-pane">
			<pre class="gedit-code"><code
					>{#if tokenLines.length > 0}{#each tokenLines as line, lineIndex (`${record.uri}-${lineIndex}`)}{#each line as token, tokenIndex (`${record.uri}-${lineIndex}-${tokenIndex}`)}<span
									style:color={token.color}>{token.content}</span
								>{/each}{#if lineIndex < tokenLines.length - 1}{/if}{/each}{:else}{record.json}{/if}</code></pre>
		</div>
	</div>

	<footer class="statusbar">
		<span>{record.uri}</span>
		<span>JSON</span>
		<span>Ln 1, Col 1</span>
	</footer>
</section>

<style>
	.gedit {
		--base00: #300a24;
		--base01: #2e3436;
		--base02: #555753;
		--base03: #747772;
		--base04: #949791;
		--base05: #b3b7b0;
		--base06: #d3d7cf;
		--base07: #eeeeec;
		--base08: #cc0000;
		--base09: #c4a000;
		--base0a: #729fcf;
		--base0b: #4e9a06;
		--base0c: #06989a;
		--base0d: #3465a4;
		--base0e: #75507b;
		--base0f: #660000;
		--base10: #383a37;
		--base11: #1c1d1b;
		--base12: #ef2929;
		--base13: #fce94f;
		--base14: #8ae234;
		--base15: #34e2e2;
		--base16: #729fcf;
		--base17: #ad7fa8;

		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		height: 100%;
		overflow: hidden;
		background: var(--base00);
	}

	.gedit-toolbar {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2);
		background: linear-gradient(#eeeeec, #b3b7b0);
		border-bottom: 1px solid var(--base02);
	}

	.tool-group {
		display: flex;
		gap: var(--space-1);
	}

	button {
		height: 1.65rem;
		padding: 0 var(--space-3);
		color: var(--base01);
		background: linear-gradient(#eeeeec, #d3d7cf);
		border: 1px solid var(--base03);
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-size: var(--text-1);
		cursor: default;
	}

	.document-path {
		display: flex;
		align-items: center;
		min-width: 0;
		gap: var(--space-2);
		color: var(--base01);
		font-size: var(--text-1);
		font-weight: 700;
	}

	.document-path span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.editor-shell {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		min-height: 0;
		overflow: hidden;
		background: var(--base00);
	}

	.line-gutter {
		overflow: hidden;
		padding: var(--space-3) var(--space-2);
		color: var(--base03);
		background: var(--base11);
		border-right: 1px solid var(--base01);
		font-family: var(--font-mono);
		font-size: var(--text-1);
		line-height: 1.45;
		text-align: right;
		user-select: none;
	}

	.line-gutter span {
		display: block;
		min-width: 2ch;
	}

	.code-pane {
		overflow: auto;
		min-width: 0;
	}

	.gedit-code {
		min-height: 100%;
		margin: 0;
		padding: var(--space-3);
		color: var(--base07);
		background: var(--base00);
		font-family: var(--font-mono);
		font-size: var(--text-1);
		line-height: 1.45;
	}

	.statusbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: var(--space-3);
		padding: 2px var(--space-2);
		color: var(--base01);
		background: linear-gradient(#d3d7cf, #b3b7b0);
		border-top: 1px solid var(--base02);
		font-size: var(--text-0);
	}

	.statusbar span:first-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
