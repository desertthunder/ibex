<script lang="ts">
	import type { LexiconDocument } from '$lib/atproto/lexicon';
	import { defRows, referenceNsid } from './schema';

	type Props = { lexicon: LexiconDocument; onreference: (nsid: string) => void };

	let { lexicon, onreference }: Props = $props();
	const schemaRows = $derived.by(() => defRows(lexicon.defs));
</script>

<div class="schema-document">
	<header>
		<p>Lexicon {lexicon.lexicon}</p>
		<h1>{lexicon.id}</h1>
	</header>

	{#each schemaRows as def (def.name)}
		<section class="definition">
			<div class="definition-heading">
				<div>
					<p>{def.type}</p>
					<h2>#{def.name}</h2>
				</div>
				{#if def.required.length > 0}
					<span>{def.required.length} required</span>
				{/if}
			</div>

			{#if def.description}
				<p class="definition-description">{def.description}</p>
			{/if}

			{#if def.properties.length > 0}
				<table>
					<thead>
						<tr>
							<th>Field</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						{#each def.properties as property (property.name)}
							<tr>
								<td>
									<strong>{property.name}</strong>
									{#if def.required.includes(property.name)}
										<small>required</small>
									{/if}
								</td>
								<td>{property.type}</td>
								<td>{property.description || 'No description'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}

			{#if def.refs.length > 0}
				<div class="reference-list" aria-label={`References for ${def.name}`}>
					<span>References</span>
					{#each def.refs as ref (ref)}
						{@const nsid = referenceNsid(ref)}
						{#if nsid}
							<button type="button" onclick={() => onreference(nsid)}>{ref}</button>
						{:else}
							<code>{ref}</code>
						{/if}
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	.schema-document {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
	}

	.schema-document > header {
		padding-bottom: var(--space-3);
		border-bottom: 1px solid #d1b183;
	}

	.schema-document > header p,
	.definition-heading p {
		color: #6b401e;
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.schema-document h1 {
		font-size: var(--text-6);
		line-height: var(--leading-tight);
		overflow-wrap: anywhere;
	}

	.definition {
		border: 1px solid #b89a70;
		background: #fffdf7;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.75) inset;
	}

	.definition-heading {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3);
		background: linear-gradient(#f2ead9, #dfcfaf);
		border-bottom: 1px solid #b89a70;
	}

	.definition-heading h2 {
		font-size: var(--text-4);
		overflow-wrap: anywhere;
	}

	.definition-heading span {
		padding: 0.1rem var(--space-2);
		color: #fffaf0;
		background: #6b401e;
		border: 1px solid #4a2d1a;
		font-size: var(--text-0);
		font-weight: 700;
		white-space: nowrap;
	}

	.definition-description {
		padding: var(--space-3);
		color: #4d4740;
		border-bottom: 1px solid #e1d0b2;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-1);
	}

	th,
	td {
		padding: var(--space-2);
		border: 1px solid #d7c6a9;
		text-align: left;
		vertical-align: top;
	}

	th {
		background: #ede2cf;
		color: #4b3824;
		font-size: var(--text-0);
		text-transform: uppercase;
	}

	td {
		overflow-wrap: anywhere;
	}

	th:first-child,
	th:nth-child(2),
	td:first-child,
	td:nth-child(2) {
		width: 1%;
		white-space: nowrap;
	}

	td:nth-child(2) {
		font-family: var(--font-mono);
		color: #235a97;
	}

	td:nth-child(3) {
		overflow-wrap: break-word;
		word-break: normal;
	}

	td small {
		display: block;
		width: fit-content;
		margin-top: var(--space-1);
		padding: 0 var(--space-1);
		color: #fffaf0;
		background: #8a5527;
		font-size: var(--text-0);
	}

	.reference-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-3);
		border-top: 1px solid #e1d0b2;
	}

	.reference-list span {
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.reference-list code,
	.reference-list button {
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	button {
		min-height: 1.65rem;
		padding: 0 var(--space-2);
		color: #251b13;
		background: linear-gradient(#fffaf0, #d7c6a9);
		border: 1px solid #8d704b;
		border-radius: var(--radius-1);
		box-shadow: var(--shadow-raised);
		font: inherit;
		cursor: default;
	}
</style>
