<script lang="ts">
	import { onMount } from 'svelte';
	import type { ThemeRegistration } from 'shiki';
	import { lexiconPath } from '$lib/atproto/lexicon';
	import { blobPath } from '$lib/atproto/routes';
	import { blobReferences, isRenderableBlob, rawBlobUrl, repoBlobs } from '$lib/atproto/blobs.svelte';
	import { repoSession } from '$lib/atproto/session.svelte';
	import { isRecordValue } from '$lib/atproto/types';
	import type { BlobReference, RepoRecordSummary } from '$lib/atproto/types';
	import { truncate } from '$lib/utils/text';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type Props = { record: RepoRecordSummary };
	type TokenLine = Array<{ content: string; color?: string; fontStyle?: number }>;
	type RecordTab = 'json' | 'schema' | 'info';
	type SchemaField = { name: string; valueType: string; preview: string };

	let { record }: Props = $props();
	let tokenLines = $state<TokenLine[]>([]);
	let activeTab = $state<RecordTab>('json');
	let wordWrap = $state(false);
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	type RepoPathname = `/repos/${string}`;
	const navigateTo = goto as (url: string, options?: Parameters<typeof goto>[1]) => ReturnType<typeof goto>;

	const recordType = $derived.by(() => {
		if (!isRecordValue(record.value)) return record.collection;

		const type = record.value.$type;
		if (typeof type === 'string' && type.length > 0) return type;

		return record.collection;
	});

	const schemaFields = $derived.by(() => schemaFieldsForRecord(record.value));
	const attachments = $derived.by(() => blobReferences(record.value, record.uri));
	const identity = $derived(repoSession.identity);
	const rawPdsLink = $derived.by(() => {
		const pds = identity?.pds;
		const repo = identity?.did;
		if (!pds || !repo) return null;
		const params = new URLSearchParams({ repo, collection: record.collection, rkey: record.rkey });
		return `${pds}/xrpc/com.atproto.repo.getRecord?${params.toString()}`;
	});

	const externalLinks = $derived.by(() => linksForRecord(record));

	const themeName = 'ubuntu-iterm2b24';
	const ubuntuTheme: ThemeRegistration = {
		name: themeName,
		type: 'dark',
		colors: {
			'editor.background': '#300a24',
			'editor.foreground': '#eeeeec',
			'editorLineNumber.foreground': '#747772',
			'editor.selectionBackground': '#555753'
		},
		settings: [
			{ settings: { foreground: '#eeeeec', background: '#300a24' } },
			{ scope: ['comment'], settings: { foreground: '#747772', fontStyle: 'italic' } },
			{ scope: ['string', 'string.quoted'], settings: { foreground: '#4e9a06' } },
			{ scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#c4a000' } },
			{
				scope: ['support.type.property-name', 'meta.structure.dictionary.key.json string'],
				settings: { foreground: '#729fcf' }
			},
			{ scope: ['punctuation'], settings: { foreground: '#b3b7b0' } },
			{ scope: ['invalid'], settings: { foreground: '#ef2929' } }
		]
	};

	type P = (code: string, options: { lang: 'json'; theme: string }) => TokenLine[];
	let highlighterPromise: Promise<{ codeToTokensBase: P }> | null = null;

	async function getJsonHighlighter() {
		highlighterPromise ??= Promise.all([
			import('@shikijs/core'),
			import('@shikijs/engine-javascript'),
			import('@shikijs/langs/json')
		]).then(async ([core, engine, json]) => {
			const highlighter = await core.createHighlighterCore({
				themes: [ubuntuTheme],
				langs: [json.default],
				engine: engine.createJavaScriptRegexEngine()
			});

			return {
				codeToTokensBase(code: string, options: { lang: 'json'; theme: string }) {
					return highlighter.codeToTokensBase(code, options) as TokenLine[];
				}
			};
		});

		return highlighterPromise;
	}

	async function highlight() {
		const highlighter = await getJsonHighlighter();
		tokenLines = highlighter.codeToTokensBase(record.json, { lang: 'json', theme: themeName });
	}

	async function copyRecord() {
		await navigator.clipboard.writeText(record.json);
		copied = true;

		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copied = false;
			copyTimeout = null;
		}, 1400);
	}

	function schemaFieldsForRecord(value: unknown): SchemaField[] {
		if (!isRecordValue(value)) return [];

		return Object.entries(value).map(([name, fieldValue]) => ({
			name,
			valueType: valueTypeLabel(fieldValue),
			preview: valuePreview(fieldValue)
		}));
	}

	function valueTypeLabel(value: unknown) {
		if (Array.isArray(value)) return 'array';
		if (value === null) return 'null';
		return typeof value;
	}

	function valuePreview(value: unknown) {
		if (typeof value === 'string') return truncate(value.replaceAll('\n', ' '), 72);
		if (typeof value === 'number' || typeof value === 'boolean') return String(value);
		if (value === null) return 'null';
		if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
		if (isRecordValue(value)) return `${Object.keys(value).length} field object`;

		return 'unknown';
	}

	function linksForRecord(summary: RepoRecordSummary) {
		const links = [
			{ label: 'AT URI', href: summary.uri },
			{ label: 'pds.ls', href: `https://pds.ls/${summary.uri}` }
		];

		if (summary.collection === 'app.bsky.feed.post') {
			links.push({
				label: 'Bluesky',
				href: `https://bsky.app/profile/${identity?.did ?? summary.author.replace(/^@/, '')}/post/${summary.rkey}`
			});
		}

		return links;
	}

	function previewAttachment(attachment: BlobReference) {
		if (!identity || !isRenderableBlob(attachment)) return;

		repoBlobs.openMedia(identity, { ...attachment, sourceIcon: record.icon });
		void navigateTo(resolve(blobPath(identity.did, attachment.cid) as RepoPathname), {
			keepFocus: true,
			noScroll: true
		});
	}

	function openRawAttachment(attachment: BlobReference) {
		if (!identity) return;

		window.open(rawBlobUrl(identity, attachment.cid), '_blank', 'noopener,noreferrer');
	}

	function openSchemaBrowser() {
		void navigateTo(resolve(lexiconPath(recordType) as `/lexicons/${string}`), { keepFocus: true, noScroll: true });
	}

	function attachmentSizeLabel(size: number | null) {
		if (size === null) return 'Unknown size';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}

	function attachmentIcon(attachment: BlobReference) {
		if (attachment.mimeType?.startsWith('image/')) return '/icons/humanity/mimes/image-x-generic.svg';
		if (attachment.mimeType?.startsWith('video/')) return '/icons/humanity/mimes/video-x-generic.svg';
		if (attachment.mimeType === 'application/pdf') return '/icons/humanity/mimes/gnome-mime-application-pdf.svg';
		return '/icons/humanity/mimes/text-x-generic.svg';
	}

	onMount(() => {
		void highlight();
	});
</script>

<section class="gedit" aria-label={`${record.title} JSON record`}>
	<header class="gedit-toolbar">
		<div class="tool-group" aria-label="Document actions">
			<button type="button" class:copied aria-live="polite" onclick={copyRecord}>{copied ? 'Copied!' : 'Copy'}</button>
			<button type="button" class:active={wordWrap} aria-pressed={wordWrap} onclick={() => (wordWrap = !wordWrap)}>
				Word Wrap
			</button>
		</div>
		<nav class="record-tabs" aria-label="Record tabs">
			<button
				type="button"
				class:active={activeTab === 'json'}
				aria-pressed={activeTab === 'json'}
				onclick={() => (activeTab = 'json')}>JSON</button>
			<button
				type="button"
				class:active={activeTab === 'schema'}
				aria-pressed={activeTab === 'schema'}
				onclick={() => (activeTab = 'schema')}>Schema</button>
			<button
				type="button"
				class:active={activeTab === 'info'}
				aria-pressed={activeTab === 'info'}
				onclick={() => (activeTab = 'info')}>Info</button>
		</nav>
		<div class="document-path">
			<img src={record.icon} alt="" width="18" height="18" />
			<span>{record.collection}/{record.rkey}.json</span>
			{#if record.appLabel}
				<strong>{record.appLabel}</strong>
			{/if}
		</div>
	</header>

	{#if activeTab === 'json'}
		<div class="editor-shell" class:word-wrap={wordWrap}>
			<aside class="line-gutter" aria-hidden="true">
				{#each record.json.split('\n') as line, index (`line-${record.uri}-${index}`)}
					<span aria-label={line}>{index + 1}</span>
				{/each}
			</aside>

			<div class="code-pane">
				<pre class="gedit-code"><code
						>{#if tokenLines.length > 0}{#each tokenLines as line, lineIndex (`${record.uri}-${lineIndex}`)}<span
									class="code-line"
									>{#each line as token, tokenIndex (`${record.uri}-${lineIndex}-${tokenIndex}`)}<span
											style:color={token.color}>{token.content}</span
										>{/each}</span
								>{/each}{:else}{#each record.json.split('\n') as line, index (`fallback-${record.uri}-${index}`)}<span
									class="code-line">{line}</span
								>{/each}{/if}</code></pre>
			</div>
		</div>
	{:else if activeTab === 'schema'}
		<div class="tab-panel schema-panel">
			<section class="schema-summary" aria-label="Record schema summary">
				<img src={record.icon} alt="" width="38" height="38" />
				<div>
					<p class="panel-label">Lexicon</p>
					<h2>{recordType}</h2>
					<p>{record.collection}</p>
				</div>
				<button type="button" onclick={openSchemaBrowser}>Open in Web Browser</button>
			</section>

			<table>
				<thead>
					<tr>
						<th>Field</th>
						<th>Type</th>
						<th>Preview</th>
					</tr>
				</thead>
				<tbody>
					{#each schemaFields as field (field.name)}
						<tr>
							<td>{field.name}</td>
							<td>{field.valueType}</td>
							<td>{field.preview}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="3">Record value is not a JSON object.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="tab-panel info-panel">
			<dl>
				<div>
					<dt>AT URI</dt>
					<dd>{record.uri}</dd>
				</div>
				<div>
					<dt>CID</dt>
					<dd>
						{#if record.cid}
							{record.cid}
						{:else}
							No CID returned
						{/if}
					</dd>
				</div>
				<div>
					<dt>Collection</dt>
					<dd>{record.collection}</dd>
				</div>
				<div>
					<dt>Record key</dt>
					<dd>{record.rkey}</dd>
				</div>
				<div>
					<dt>Read-only?</dt>
					<dd>
						{#if record.cid}
							Loaded as a public repo record with an immutable CID.
						{:else}
							Loaded as a public repo record; the PDS did not include a CID.
						{/if}
					</dd>
				</div>
				<div>
					<dt>Raw PDS link</dt>
					<dd>
						{#if rawPdsLink}
							<a href={rawPdsLink} target="_blank" rel="external noreferrer">{record.rkey}</a>
						{:else}
							No PDS endpoint is available for this record.
						{/if}
					</dd>
				</div>
			</dl>

			<section class="external-links" aria-label="External app links">
				<h2>External app links</h2>
				<ul>
					{#each externalLinks as link (link.label)}
						<li><a href={link.href} target="_blank" rel="external noreferrer">{link.label}</a></li>
					{/each}
				</ul>
			</section>

			{#if attachments.length > 0}
				<section class="attachment-list" aria-label="Blob attachments">
					<h2>Blob attachments</h2>
					<ul>
						{#each attachments as attachment (`${attachment.path}-${attachment.cid}`)}
							<li>
								<img src={attachmentIcon(attachment)} alt="" width="24" height="24" />
								<div>
									<strong>{attachment.path}</strong>
									<span>{attachment.mimeType ?? 'Unknown MIME'} · {attachmentSizeLabel(attachment.size)}</span>
									<code>{attachment.cid}</code>
								</div>
								<div class="attachment-actions">
									{#if isRenderableBlob(attachment)}
										<button type="button" onclick={() => previewAttachment(attachment)}>Preview</button>
									{/if}
									<button type="button" onclick={() => openRawAttachment(attachment)}>Raw blob</button>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	{/if}

	<footer class="statusbar">
		<span>{record.uri}</span>
		<span>{activeTab}</span>
		<span>{wordWrap ? 'Wrap on' : 'Wrap off'}</span>
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

	.record-tabs {
		display: flex;
		align-items: end;
		gap: 2px;
		align-self: stretch;
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

	.record-tabs button {
		align-self: end;
		border-bottom-color: #777a75;
		border-radius: var(--radius-2) var(--radius-2) 0 0;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.55) inset;
	}

	button.active,
	button.copied {
		color: white;
		background: linear-gradient(#729fcf, #3465a4);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.5);
	}

	button.copied {
		background: linear-gradient(#8ae234, #4e9a06);
		border-color: #3b7c09;
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.5) inset,
			0 0 0 1px rgb(138 226 52 / 0.35);
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

	.tab-panel {
		overflow: auto;
		min-width: 0;
		min-height: 0;
		padding: var(--space-3);
		color: var(--base07);
		background: var(--base00);
	}

	.schema-summary {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
		padding: var(--space-3);
		background: var(--base10);
		border: 1px solid var(--base02);
	}

	.schema-summary img {
		object-fit: contain;
	}

	.panel-label {
		color: var(--base04);
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.schema-summary h2,
	.external-links h2 {
		color: var(--base07);
		font-size: var(--text-3);
		line-height: var(--leading-tight);
	}

	.schema-summary p:last-child {
		color: var(--base05);
		font-size: var(--text-1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	th,
	td {
		padding: var(--space-2);
		border: 1px solid var(--base02);
		text-align: left;
		vertical-align: top;
	}

	th {
		color: var(--base01);
		background: linear-gradient(#d3d7cf, #b3b7b0);
		font-family: var(--font-sans);
		font-size: var(--text-0);
		text-transform: uppercase;
	}

	td {
		background: var(--base10);
	}

	td:first-child,
	td:nth-child(2) {
		width: 1%;
		color: var(--base0a);
		white-space: nowrap;
	}

	td:nth-child(3) {
		overflow-wrap: break-word;
		word-break: normal;
	}

	.info-panel {
		display: grid;
		gap: var(--space-4);
		align-content: start;
	}

	dl {
		display: grid;
		gap: 1px;
		margin: 0;
		border: 1px solid var(--base02);
		background: var(--base02);
	}

	dl div {
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr);
		background: var(--base10);
	}

	dt,
	dd {
		margin: 0;
		padding: var(--space-2);
	}

	dt {
		color: var(--base06);
		background: var(--base01);
		font-weight: 700;
	}

	dd {
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	a {
		color: var(--base16);
		text-decoration: underline;
	}

	.external-links {
		display: grid;
		gap: var(--space-2);
	}

	.external-links ul,
	.attachment-list ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.external-links a,
	.attachment-actions button {
		display: flex;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		color: var(--base01);
		background: linear-gradient(#eeeeec, #b3b7b0);
		border: 1px solid var(--base03);
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-family: var(--font-sans);
		font-size: var(--text-1);
		font-weight: 700;
		text-decoration: none;
	}

	.attachment-list {
		display: grid;
		gap: var(--space-2);
	}

	.attachment-list h2 {
		color: var(--base07);
		font-size: var(--text-3);
		line-height: var(--leading-tight);
	}

	.attachment-list ul {
		display: grid;
	}

	.attachment-list li {
		display: grid;
		grid-template-columns: 24px minmax(0, 1fr) auto;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-2);
		background: var(--base10);
		border: 1px solid var(--base02);
	}

	.attachment-list li > div {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.attachment-list strong,
	.attachment-list span,
	.attachment-list code {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-list strong {
		color: var(--base07);
		font-size: var(--text-1);
	}

	.attachment-list span,
	.attachment-list code {
		color: var(--base05);
		font-family: var(--font-mono);
		font-size: var(--text-0);
	}

	.attachment-actions {
		display: flex;
		gap: var(--space-1);
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

	.code-line {
		display: block;
		min-height: 1.45em;
		white-space: pre;
	}

	.word-wrap .code-line {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
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
