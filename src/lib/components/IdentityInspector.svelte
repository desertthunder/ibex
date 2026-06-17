<script lang="ts">
	import { onMount } from 'svelte';
	import { repoSession } from '$lib/atproto/session.svelte';
	import { inspectIdentity, type IdentityCheck, type IdentityInspection } from '$lib/atproto/identity-inspector';
	import { errorMessage } from '$lib/utils/errors';

	let inspection = $state<IdentityInspection | null>(null);
	let selectedSection = $state<'overview' | 'aliases' | 'services' | 'keys' | 'raw'>('overview');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let copiedValue = $state<string | null>(null);

	const identity = $derived(repoSession.identity);
	const keyrings = $derived.by(() => {
		if (!inspection) return [];

		return [
			{ id: 'overview', label: 'Identity', icon: '/icons/humanity/status/network-wireless-encrypted.svg', count: 1 },
			{
				id: 'aliases',
				label: 'Handle aliases',
				icon: '/icons/humanity/places/user-home.svg',
				count: inspection.aliases.length
			},
			{
				id: 'services',
				label: 'Services',
				icon: '/icons/humanity/apps/internet-feed-reader.svg',
				count: inspection.services.length
			},
			{
				id: 'keys',
				label: 'Verification keys',
				icon: '/icons/humanity/status/network-wireless-encrypted.svg',
				count: inspection.verificationMethods.length + inspection.rotationKeys.length
			},
			{ id: 'raw', label: 'DID document', icon: '/icons/humanity/mimes/text-x-generic.svg', count: 1 }
		] as const;
	});

	onMount(() => {
		void loadInspection();
	});

	async function loadInspection() {
		if (!identity) {
			error = 'No repository identity is loaded.';
			return;
		}

		isLoading = true;
		error = null;

		try {
			inspection = await inspectIdentity(identity.did, identity.handle);
		} catch (unknownError) {
			error = errorMessage(unknownError, 'Could not inspect that identity.');
		} finally {
			isLoading = false;
		}
	}

	async function copyValue(value: string | null | undefined) {
		if (!value) return;

		try {
			await navigator.clipboard.writeText(value);
			copiedValue = value;
			window.setTimeout(() => {
				if (copiedValue === value) copiedValue = null;
			}, 1600);
		} catch {
			copiedValue = null;
		}
	}

	function statusLabel(status: IdentityCheck['status']) {
		if (status === 'valid') return 'Trusted';
		if (status === 'mismatch') return 'Mismatch';
		if (status === 'unsupported') return 'Unsupported';
		return 'Unavailable';
	}
</script>

<section class="identity-inspector" aria-label="Identity Inspector">
	<aside class="keyring-sidebar" aria-label="Identity keyrings">
		<header>
			<img src="/icons/humanity/apps/identity-inspector.svg" alt="" width="36" height="36" />
			<div>
				<h2>Passwords and Encryption Keys</h2>
				<p>{identity ? `@${identity.handle}` : 'No identity loaded'}</p>
			</div>
		</header>

		<nav aria-label="Identity sections">
			{#if keyrings.length === 0}
				<p class="sidebar-empty">Loading keyrings...</p>
			{:else}
				{#each keyrings as keyring (keyring.id)}
					<button
						type="button"
						class:active={selectedSection === keyring.id}
						aria-current={selectedSection === keyring.id ? 'page' : undefined}
						onclick={() => (selectedSection = keyring.id)}>
						<img src={keyring.icon} alt="" width="24" height="24" />
						<span>{keyring.label}</span>
						<small>{keyring.count}</small>
					</button>
				{/each}
			{/if}
		</nav>
	</aside>

	<div class="detail-pane">
		<div class="keyring-toolbar" aria-label="Identity actions">
			<button type="button" onclick={loadInspection} disabled={isLoading}>
				<img src="/icons/humanity/actions/mail-send-receive.svg" alt="" width="18" height="18" />
				<span>{isLoading ? 'Refreshing' : 'Refresh'}</span>
			</button>
			<button type="button" onclick={() => copyValue(inspection?.did)} disabled={!inspection}>
				<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="18" height="18" />
				<span>Copy DID</span>
			</button>
			{#if inspection?.pds}
				<button type="button" onclick={() => window.open(inspection?.pds ?? '', '_blank', 'noopener,noreferrer')}>
					<img src="/icons/humanity/apps/web-browser.svg" alt="" width="18" height="18" />
					<span>Open PDS</span>
				</button>
			{/if}
		</div>

		{#if error}
			<div class="inspector-message error">
				<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="" width="32" height="32" />
				<p>{error}</p>
			</div>
		{:else if isLoading || !inspection}
			<div class="inspector-message">
				<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="" width="32" height="32" />
				<p>Unlocking public identity material...</p>
			</div>
		{:else}
			<header class="identity-heading">
				<img
					src={identity?.avatar ?? '/icons/humanity/status/network-wireless-encrypted.svg'}
					alt=""
					width="48"
					height="48" />
				<div>
					<p>Default public keyring</p>
					<h2>{inspection.handle ? `@${inspection.handle}` : inspection.did}</h2>
					<span>{inspection.did}</span>
				</div>
			</header>

			{#if selectedSection === 'overview'}
				<section class="property-section" aria-label="Identity overview">
					<h3>Identity Properties</h3>
					<div class="property-grid">
						{@render PropertyRow('DID', inspection.did, copyValue, copiedValue === inspection.did)}
						{@render PropertyRow(
							'Handle',
							inspection.handle ?? 'No handle alias',
							copyValue,
							copiedValue === inspection.handle
						)}
						{@render PropertyRow('PDS', inspection.pds ?? 'Not advertised', copyValue, copiedValue === inspection.pds)}
						{@render PropertyRow(
							'DID document',
							inspection.didDocumentUrl,
							copyValue,
							copiedValue === inspection.didDocumentUrl
						)}
					</div>

					{#if inspection.handleValidation}
						<div class="validation-list" aria-label="Handle validation">
							{#each [inspection.handleValidation.resolveHandle, inspection.handleValidation.wellKnown, inspection.handleValidation.dnsTxt] as check (check.label)}
								<div
									class="validation-row"
									class:mismatch={check.status === 'mismatch'}
									class:valid={check.status === 'valid'}>
									<img
										src={check.status === 'valid'
											? '/icons/humanity/status/network-wireless-encrypted.svg'
											: check.status === 'mismatch'
												? '/icons/humanity/status/audio-volume-medium.svg'
												: '/icons/humanity/apps/identity-inspector.svg'}
										alt=""
										width="24"
										height="24" />
									<div>
										<strong>{check.label}</strong>
										<p>{check.detail}</p>
										{#if check.value}
											<code>{check.value}</code>
										{/if}
									</div>
									<span>{statusLabel(check.status)}</span>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{:else if selectedSection === 'aliases'}
				<section class="property-section" aria-label="Handle aliases">
					<h3>Aliases</h3>
					<div class="list-box">
						{#each inspection.aliases as alias (alias)}
							{@render PropertyRow('alsoKnownAs', alias, copyValue, copiedValue === alias)}
						{:else}
							<p class="empty-row">No aliases are listed in the DID document.</p>
						{/each}
					</div>
				</section>
			{:else if selectedSection === 'services'}
				<section class="property-section" aria-label="Services">
					<h3>Services</h3>
					<div class="list-box">
						{#each inspection.services as service, index (`${service.id}-${index}`)}
							<div class="object-row">
								<img src="/icons/humanity/apps/internet-feed-reader.svg" alt="" width="28" height="28" />
								<div>
									<strong>{service.id ?? 'Unnamed service'}</strong>
									<p>{service.type ?? 'Unknown service type'}</p>
									<code
										>{typeof service.serviceEndpoint === 'string'
											? service.serviceEndpoint
											: JSON.stringify(service.serviceEndpoint)}</code>
								</div>
							</div>
						{:else}
							<p class="empty-row">No services are listed in the DID document.</p>
						{/each}
					</div>
				</section>
			{:else if selectedSection === 'keys'}
				<section class="property-section" aria-label="Keys">
					<h3>Verification Methods</h3>
					<div class="list-box">
						{#each inspection.verificationMethods as method, index (`${method.id}-${index}`)}
							<div class="object-row">
								<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="" width="28" height="28" />
								<div>
									<strong>{method.id ?? 'Unnamed verification method'}</strong>
									<p>{method.type ?? 'Unknown key type'}</p>
									<code>{method.publicKeyMultibase ?? method.controller ?? 'No public key material'}</code>
								</div>
							</div>
						{:else}
							<p class="empty-row">No verification methods are listed in the DID document.</p>
						{/each}
					</div>

					<h3>Rotation Keys</h3>
					<div class="list-box">
						{#each inspection.rotationKeys as key (key)}
							{@render PropertyRow('PLC rotation key', key, copyValue, copiedValue === key)}
						{:else}
							<p class="empty-row">No PLC rotation keys were available.</p>
						{/each}
					</div>
				</section>
			{:else}
				<section class="property-section raw-section" aria-label="Raw DID document">
					<h3>Raw DID Document</h3>
					<pre>{inspection.rawJson}</pre>
				</section>
			{/if}
		{/if}
	</div>
</section>

{#snippet PropertyRow(label: string, value: string, oncopy: (value: string) => unknown, copied = false)}
	<div class="property-row">
		<dt>{label}</dt>
		<dd>
			<code>{value}</code>
			<button type="button" onclick={() => oncopy(value)}>
				<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="16" height="16" />
				<span>{copied ? 'Copied' : 'Copy'}</span>
			</button>
		</dd>
	</div>
{/snippet}

<style>
	.identity-inspector {
		display: grid;
		grid-template-columns: minmax(13rem, 16rem) minmax(0, 1fr);
		height: 100%;
		overflow: hidden;
		color: #2f2218;
		background: #f7f0e3;
		border: 1px solid #8d7557;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.7) inset;
	}

	.keyring-sidebar {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
		background: linear-gradient(90deg, #c9b38f, #e7d8bf);
		border-right: 1px solid #8f704d;
	}

	.keyring-sidebar header {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		padding: var(--space-3);
		border-bottom: 1px solid #9a7b57;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
	}

	.keyring-sidebar h2 {
		font-size: var(--text-2);
		line-height: var(--leading-tight);
		text-wrap: balance;
	}

	.keyring-sidebar p,
	.sidebar-empty,
	.identity-heading p,
	.identity-heading span,
	.validation-row p,
	.object-row p,
	.empty-row {
		color: #68513a;
		font-size: var(--text-1);
	}

	.keyring-sidebar nav {
		display: grid;
		align-content: start;
		gap: 1px;
		min-height: 0;
		padding: var(--space-2);
		overflow: auto;
	}

	.keyring-sidebar button {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr) auto;
		gap: var(--space-2);
		align-items: center;
		min-height: 2.35rem;
		padding: var(--space-1) var(--space-2);
		text-align: left;
		border: 1px solid transparent;
		border-radius: var(--radius-1);
		cursor: default;
	}

	.keyring-sidebar button:hover,
	.keyring-sidebar button.active {
		background: linear-gradient(#f8edda, #cdb38e);
		border-color: #fff8ea #987755 #765533 #f0dcc0;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.72) inset;
	}

	.keyring-sidebar button span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.keyring-sidebar small {
		min-width: 1.4rem;
		padding: 0 0.3rem;
		color: #3b2919;
		text-align: center;
		background: #efe1c8;
		border: 1px solid #a58a63;
		border-radius: 999px;
		box-shadow: var(--shadow-sunken);
		font-variant-numeric: tabular-nums;
	}

	.detail-pane {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		background: #fffaf0;
	}

	.keyring-toolbar {
		display: flex;
		gap: var(--space-1);
		align-items: center;
		min-height: 2.35rem;
		padding: var(--space-1) var(--space-2);
		background: linear-gradient(#f7ead5, #cfb48f);
		border-bottom: 1px solid #9a7b57;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.62) inset;
	}

	.keyring-toolbar button,
	.property-row button {
		display: inline-flex;
		gap: var(--space-1);
		align-items: center;
		min-height: 1.75rem;
		padding: 0 var(--space-2);
		color: #2f2218;
		text-decoration: none;
		background: linear-gradient(#fff8e8, #d7bd99);
		border: 1px solid #a1845f;
		border-radius: var(--radius-1);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.65) inset;
		cursor: default;
		transition-property: filter, scale;
		transition-duration: 120ms;
	}

	.keyring-toolbar button:active,
	.property-row button:active {
		scale: 0.96;
	}

	.keyring-toolbar button:disabled {
		opacity: 0.58;
	}

	.inspector-message {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin: var(--space-4);
		padding: var(--space-3);
		background: #f2e5ca;
		border: 1px solid #b99a70;
		border-radius: var(--radius-1);
	}

	.inspector-message.error {
		color: #5b160f;
		background: #f3d5ca;
		border-color: #b46b55;
	}

	.identity-heading {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		min-width: 0;
		padding: var(--space-3) var(--space-4);
		background: #f8efdf;
		border-bottom: 1px solid #d6c2a5;
	}

	.identity-heading img {
		width: 3rem;
		height: 3rem;
		object-fit: cover;
		border: 1px solid rgb(68 45 22 / 0.28);
		border-radius: var(--radius-1);
	}

	.identity-heading h2 {
		font-size: var(--text-5);
		line-height: var(--leading-tight);
		text-wrap: balance;
	}

	.identity-heading span {
		display: block;
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
	}

	.property-section {
		min-height: 0;
		padding: var(--space-4);
		overflow: auto;
	}

	.property-section h3 {
		margin-bottom: var(--space-2);
		font-size: var(--text-3);
		line-height: var(--leading-tight);
	}

	.property-section h3:not(:first-child) {
		margin-top: var(--space-4);
	}

	.property-grid,
	.list-box,
	.validation-list {
		display: grid;
		gap: var(--space-2);
	}

	.property-row,
	.object-row,
	.validation-row {
		background: #fff8ed;
		border: 1px solid #d0b895;
		border-radius: var(--radius-1);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.72) inset;
	}

	.property-row {
		display: grid;
		grid-template-columns: minmax(7rem, 10rem) minmax(0, 1fr);
	}

	.property-row dt {
		padding: var(--space-2);
		color: #5c442f;
		background: #ebdbc1;
		border-right: 1px solid #d0b895;
		font-weight: 700;
	}

	.property-row dd {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-2);
		align-items: center;
		min-width: 0;
		padding: var(--space-1) var(--space-2);
	}

	code,
	pre {
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	code {
		overflow-wrap: anywhere;
	}

	.validation-row,
	.object-row {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr) auto;
		gap: var(--space-2);
		align-items: start;
		padding: var(--space-2);
	}

	.object-row {
		grid-template-columns: 2rem minmax(0, 1fr);
	}

	.validation-row.valid {
		border-color: #8ca05f;
	}

	.validation-row.mismatch {
		border-color: #b27a4c;
	}

	.validation-row span {
		padding: 0.12rem var(--space-2);
		color: #3d2a1a;
		background: #ead8b9;
		border: 1px solid #b89a71;
		border-radius: 999px;
		font-size: var(--text-1);
		font-weight: 700;
	}

	.raw-section pre {
		min-height: 20rem;
		margin: 0;
		padding: var(--space-3);
		overflow: auto;
		color: #28190f;
		background: #fff8ed;
		border: 1px solid #c6ad89;
		border-radius: var(--radius-1);
		box-shadow: var(--shadow-sunken);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.empty-row,
	.sidebar-empty {
		padding: var(--space-2);
	}

	@media (max-width: 700px) {
		.identity-inspector {
			grid-template-columns: 1fr;
			grid-template-rows: auto minmax(0, 1fr);
		}

		.keyring-sidebar {
			grid-template-rows: auto auto;
			border-right: 0;
			border-bottom: 1px solid #8f704d;
		}

		.keyring-sidebar nav {
			grid-auto-flow: column;
			grid-auto-columns: minmax(10rem, 1fr);
			overflow-x: auto;
		}

		.property-row {
			grid-template-columns: 1fr;
		}

		.property-row dt {
			border-right: 0;
			border-bottom: 1px solid #d0b895;
		}
	}
</style>
