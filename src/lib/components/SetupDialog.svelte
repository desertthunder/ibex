<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { hydratePublicIdentity, resolveAccount, searchActorsTypeahead } from '$lib/atproto/identity';
	import { repoSession } from '$lib/atproto/session.svelte';
	import type { AccountIdentity, ActorTypeaheadResult } from '$lib/atproto/types';
	import { accountSetup, setupDefaults } from '$lib/atproto/setup.svelte';
	import { errorMessage } from '$lib/utils/errors';

	let handle = $state(setupDefaults.handle);
	let resolvedIdentity = $state<AccountIdentity | null>(null);
	let error = $state<string | null>(null);
	let isResolving = $state(false);
	let suggestions = $state<ActorTypeaheadResult[]>([]);
	let activeSuggestionIndex = $state(-1);
	let typeaheadError = $state<string | null>(null);
	let isSearching = $state(false);
	let hasInputFocus = $state(false);
	let typeaheadRequestId = 0;

	const didMatchesKnownAccount = $derived(resolvedIdentity?.did === setupDefaults.did);
	const showTypeahead = $derived(hasInputFocus && (suggestions.length > 0 || isSearching || typeaheadError !== null));

	$effect(() => {
		const query = handle.trim().replace(/^@/, '');

		if (!hasInputFocus || query.length < 2 || resolvedIdentity?.handle === query) {
			suggestions = [];
			activeSuggestionIndex = -1;
			typeaheadError = null;
			isSearching = false;
			return;
		}

		const requestId = ++typeaheadRequestId;
		isSearching = true;
		typeaheadError = null;

		const timeout = window.setTimeout(async () => {
			try {
				const results = await searchActorsTypeahead(query);

				if (requestId === typeaheadRequestId) {
					suggestions = results;
					activeSuggestionIndex = results.length > 0 ? 0 : -1;
				}
			} catch (unknownError) {
				if (requestId === typeaheadRequestId) {
					suggestions = [];
					activeSuggestionIndex = -1;
					typeaheadError = errorMessage(unknownError, 'Could not search handles.');
				}
			} finally {
				if (requestId === typeaheadRequestId) {
					isSearching = false;
				}
			}
		}, 220);

		return () => window.clearTimeout(timeout);
	});

	async function resolveHandle() {
		isResolving = true;
		error = null;
		resolvedIdentity = null;
		hasInputFocus = false;

		try {
			resolvedIdentity = await resolveAccount(handle);
		} catch (unknownError) {
			error = errorMessage(unknownError, 'Could not resolve that handle.');
		} finally {
			isResolving = false;
		}
	}

	function handleInput() {
		resolvedIdentity = null;
		error = null;
		hasInputFocus = true;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showTypeahead || suggestions.length === 0) {
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
		} else if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
			event.preventDefault();
			void selectSuggestion(suggestions[activeSuggestionIndex]);
		} else if (event.key === 'Escape') {
			hasInputFocus = false;
		}
	}

	async function selectSuggestion(suggestion: ActorTypeaheadResult) {
		handle = suggestion.handle;
		hasInputFocus = false;
		suggestions = [];
		activeSuggestionIndex = -1;
		isResolving = true;
		error = null;

		try {
			resolvedIdentity = await hydratePublicIdentity(suggestion.did, suggestion.handle);
		} catch (unknownError) {
			error = errorMessage(unknownError, 'Could not resolve that handle.');
		} finally {
			isResolving = false;
		}
	}

	function useAccount() {
		if (resolvedIdentity) {
			accountSetup.save(resolvedIdentity);
			repoSession.set(resolvedIdentity);
			void goto(resolve('/browse'));
		}
	}
</script>

<section class="setup-dialog" aria-labelledby="setup-title">
	<div class="intro-panel">
		<div class="identity-icon" aria-hidden="true">
			{#if resolvedIdentity?.avatar}
				<img src={resolvedIdentity.avatar} alt="" />
			{:else}
				<img src="/icons/humanity/places/user-home.svg" alt="" />
			{/if}
		</div>

		<div>
			<p class="eyebrow">First run setup</p>
			<h2 id="setup-title">Welcome to Intrepid Ibex Browser</h2>
			<p>Enter an AT Protocol handle to browse public collections from that repository.</p>
		</div>
	</div>

	<form class="handle-form" onsubmit={(event) => event.preventDefault()}>
		<label for="handle">Handle</label>
		<div class="handle-row">
			<div class="typeahead-field">
				<input
					id="handle"
					bind:value={handle}
					placeholder="desertthunder.dev"
					autocomplete="off"
					aria-autocomplete="list"
					aria-controls="handle-suggestions"
					aria-expanded={showTypeahead}
					onfocus={() => (hasInputFocus = true)}
					onblur={() => (hasInputFocus = false)}
					oninput={handleInput}
					onkeydown={handleKeydown} />

				{#if showTypeahead}
					<div id="handle-suggestions" class="typeahead-menu" role="listbox" aria-label="Suggested handles">
						{#if isSearching}
							<p class="typeahead-status">Searching public profiles…</p>
						{:else if typeaheadError}
							<p class="typeahead-status error-text">{typeaheadError}</p>
						{:else}
							{#each suggestions as suggestion, index (suggestion.did)}
								<button
									type="button"
									class:active={index === activeSuggestionIndex}
									role="option"
									aria-selected={index === activeSuggestionIndex}
									onmousedown={(event) => event.preventDefault()}
									onclick={() => selectSuggestion(suggestion)}>
									{#if suggestion.avatar}
										<img src={suggestion.avatar} alt="" />
									{:else}
										<img src="/icons/humanity/places/user-home.svg" alt="" />
									{/if}
									<span>
										<strong>{suggestion.displayName ?? suggestion.handle}</strong>
										<small>@{suggestion.handle}</small>
									</span>
								</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
			<button type="button" onclick={resolveHandle} disabled={isResolving}>
				{isResolving ? 'Resolving…' : 'Resolve'}
			</button>
		</div>
	</form>

	<div class="status-box" class:verified={resolvedIdentity} class:error role="status">
		{#if isResolving}
			<p>Looking up handle through the public AT Protocol API…</p>
		{:else if error}
			<p>{error}</p>
		{:else if resolvedIdentity}
			<div class="resolved-header">
				<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="" width="16" height="16" />
				<strong>Identity found</strong>
				{#if didMatchesKnownAccount}
					<span>known account</span>
				{/if}
			</div>

			<dl>
				<div>
					<dt>Handle</dt>
					<dd>{resolvedIdentity.handle}</dd>
				</div>
				<div>
					<dt>DID</dt>
					<dd>{resolvedIdentity.did}</dd>
				</div>
				<div>
					<dt>PDS</dt>
					<dd>{resolvedIdentity.pds ?? 'Not advertised in DID document'}</dd>
				</div>
			</dl>
		{:else}
			<p>Ready to resolve <strong>{handle}</strong>.</p>
		{/if}
	</div>

	<div class="setup-actions">
		<button type="button" class="secondary" onclick={() => (resolvedIdentity = null)} disabled={!resolvedIdentity}>
			Change Handle
		</button>
		<button
			type="button"
			class="primary"
			onclick={resolvedIdentity ? useAccount : resolveHandle}
			disabled={isResolving}>
			{resolvedIdentity ? 'Use This Account' : 'Resolve Handle'}
		</button>
	</div>
</section>

<style>
	.setup-dialog {
		display: grid;
		align-content: start;
		gap: var(--space-4);
		height: 100%;
		padding: var(--space-5);
		background:
			linear-gradient(90deg, rgb(255 255 255 / 0.65), rgb(255 255 255 / 0.18)), linear-gradient(#f8edda, #decaac);
	}

	.intro-panel {
		display: grid;
		grid-template-columns: 4rem minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-4);
		background: linear-gradient(#fffaf0, #ead8ba);
		border: 1px solid #b29165;
		border-radius: var(--radius-3);
		box-shadow: var(--shadow-raised);
	}

	.identity-icon {
		display: grid;
		place-items: center;
		width: 4rem;
		height: 4rem;
		overflow: hidden;
		background: linear-gradient(#fff5dd, #cba16c);
		border: 1px solid #8f673f;
		border-radius: var(--radius-3);
		box-shadow: var(--shadow-sunken);
	}

	.identity-icon img {
		width: 48px;
		height: 48px;
		object-fit: cover;
	}

	.eyebrow {
		color: var(--orange-700);
		font-size: var(--text-0);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h2 {
		margin-top: var(--space-1);
		font-size: var(--text-5);
		line-height: var(--leading-tight);
	}

	.intro-panel p:last-child {
		margin-top: var(--space-2);
		color: var(--text-muted);
		font-size: var(--text-2);
	}

	.handle-form {
		display: grid;
		gap: var(--space-2);
	}

	.handle-form label {
		font-size: var(--text-1);
		font-weight: 700;
	}

	.handle-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-2);
	}

	.typeahead-field {
		position: relative;
		min-width: 0;
	}

	input {
		width: 100%;
		height: 2rem;
		padding: 0 var(--space-3);
		color: var(--text);
		background: #fffdf7;
		border: 1px solid #8e7654;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
	}

	.typeahead-menu {
		position: absolute;
		z-index: 20;
		top: calc(100% + 2px);
		left: 0;
		right: 0;
		max-height: 15rem;
		overflow-y: auto;
		padding: 2px;
		background: #fffdf7;
		border: 1px solid #8e7654;
		border-radius: var(--radius-2);
		box-shadow: 0 4px 10px rgb(62 42 20 / 0.28);
	}

	.typeahead-menu button {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		align-items: center;
		width: 100%;
		height: auto;
		min-height: 2.5rem;
		padding: var(--space-1) var(--space-2);
		gap: var(--space-2);
		text-align: left;
		background: transparent;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		font-weight: 400;
	}

	.typeahead-menu button.active,
	.typeahead-menu button:hover {
		color: white;
		background: #c66b1f;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
	}

	.typeahead-menu img {
		width: 2rem;
		height: 2rem;
		object-fit: cover;
		background: #ead8ba;
		border: 1px solid #b29165;
		border-radius: var(--radius-2);
	}

	.typeahead-menu span {
		display: grid;
		min-width: 0;
	}

	.typeahead-menu strong,
	.typeahead-menu small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.typeahead-menu small {
		color: var(--text-muted);
		font-size: var(--text-0);
	}

	.typeahead-menu button.active small,
	.typeahead-menu button:hover small {
		color: #fff0d8;
	}

	.typeahead-status {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-1);
	}

	.error-text {
		color: #721c0d;
	}

	button {
		height: 2rem;
		padding: 0 var(--space-4);
		border: 1px solid #9b7d55;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-size: var(--text-1);
		font-weight: 700;
		cursor: default;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.56;
	}

	button:not(:disabled):active {
		box-shadow: var(--shadow-sunken);
	}

	.secondary,
	.handle-row button {
		background: linear-gradient(#fff9ec, #ceb48a);
	}

	.primary {
		color: white;
		background: linear-gradient(#e98b34, #ae4f12);
		border-color: #f4b46b #8d3c0b #713009 #f1a35e;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.55);
	}

	.status-box {
		min-height: 7rem;
		padding: var(--space-4);
		background: #fffaf0;
		border: 1px solid #b29165;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
		font-size: var(--text-2);
	}

	.status-box.error {
		color: #721c0d;
		background: #f7d6c9;
		border-color: #b55a38;
	}

	.status-box.verified {
		background: #fffdf6;
	}

	.resolved-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.resolved-header span {
		padding: 1px var(--space-2);
		color: white;
		background: var(--green-700);
		border-radius: var(--radius-round);
		font-size: var(--text-0);
		font-weight: 700;
	}

	dl {
		display: grid;
		gap: var(--space-2);
	}

	dl div {
		display: grid;
		grid-template-columns: 4rem minmax(0, 1fr);
		gap: var(--space-3);
	}

	dt {
		color: var(--text-muted);
		font-weight: 700;
	}

	dd {
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	.setup-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid rgb(142 118 84 / 0.45);
	}

	@media (max-width: 640px) {
		.setup-dialog {
			padding: var(--space-3);
		}

		.intro-panel,
		.handle-row,
		dl div {
			grid-template-columns: 1fr;
		}

		.identity-icon {
			display: none;
		}

		.setup-actions {
			justify-content: stretch;
		}

		.setup-actions button {
			flex: 1;
		}
	}
</style>
