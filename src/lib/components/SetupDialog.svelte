<script lang="ts">
	import { resolveAccount } from '$lib/atproto/identity';
	import type { AccountIdentity } from '$lib/atproto/types';
	import { accountSetup, setupDefaults } from '$lib/atproto/setup.svelte';
	import { errorMessage } from '$lib/utils/errors';

	let handle = $state(setupDefaults.handle);
	let resolvedIdentity = $state<AccountIdentity | null>(null);
	let error = $state<string | null>(null);
	let isResolving = $state(false);

	const didMatchesKnownAccount = $derived(resolvedIdentity?.did === setupDefaults.did);

	async function resolveHandle() {
		isResolving = true;
		error = null;
		resolvedIdentity = null;

		try {
			resolvedIdentity = await resolveAccount(handle);
		} catch (unknownError) {
			error = errorMessage(unknownError, 'Could not resolve that handle.');
		} finally {
			isResolving = false;
		}
	}

	function useAccount() {
		if (resolvedIdentity) {
			accountSetup.save(resolvedIdentity);
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
			<input id="handle" bind:value={handle} placeholder="desertthunder.dev" autocomplete="username" />
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

	input {
		height: 2rem;
		padding: 0 var(--space-3);
		color: var(--text);
		background: #fffdf7;
		border: 1px solid #8e7654;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
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
