<script lang="ts">
	import { repoSession } from '$lib/atproto/session.svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { buildCommitUrl, buildVersion } from '$lib/version';
	import { REPO_URL } from '$lib/constants';

	const identity = $derived(repoSession.identity ?? accountSetup.identity);
	const identitySource = $derived(repoSession.identity ? 'Current public repository' : 'Default public repository');
	const profileName = $derived(identity?.displayName ?? (identity ? `@${identity.handle}` : 'No repository'));
	const repositorySource = $derived(identity ? identitySource : 'Unavailable');
	const repositoryHandle = $derived(identity ? `@${identity.handle}` : '—');
</script>

<section class="about-computer" aria-labelledby="about-title">
	<div class="hero">
		<img src="/icons/humanity/devices/computer.svg" alt="" width="64" height="64" />
		<div>
			<p class="eyebrow">About this computer</p>
			<h2 id="about-title">Intrepid Ibex Browser</h2>
			<p>Ubuntu 8.10-inspired AT Protocol workstation</p>
		</div>
	</div>

	<div class="details-grid">
		<section class="details-panel" aria-labelledby="system-title">
			<h3 id="system-title">System</h3>
			<dl>
				<div>
					<dt>Operating System*</dt>
					<dd>Intrepid Ibex (Ubuntu 8.10)</dd>
				</div>
				<div>
					<dt>Desktop Environment</dt>
					<dd>GNOME 2</dd>
				</div>
				<div>
					<dt>GTK Theme</dt>
					<dd>Ubuntu 8.10 Human</dd>
				</div>
				<div>
					<dt>Icon Theme</dt>
					<dd>Humanity</dd>
				</div>
				<div>
					<dt>Protocol</dt>
					<dd>at://</dd>
				</div>
				<div>
					<dt>Version</dt>
					<dd>{buildVersion.version}</dd>
				</div>
				<div>
					<dt>Commit</dt>
					<dd class="mono">
						<a href={buildCommitUrl} target="_blank" rel="external">{buildVersion.commit}</a>
					</dd>
				</div>
			</dl>
		</section>

		<section class="details-panel" aria-labelledby="repo-title">
			<h3 id="repo-title">Public Repository</h3>
			{#if identity}
				<div class="identity-card">
					<img src={identity.avatar ?? '/icons/humanity/apps/identity-inspector.svg'} alt="" width="48" height="48" />
					<div>
						<strong>{profileName}</strong>
						<span>@{identity.handle}</span>
					</div>
				</div>
			{:else}
				<p class="empty-state">No public repository is configured yet.</p>
			{/if}

			<dl>
				<div>
					<dt>Source</dt>
					<dd>{repositorySource}</dd>
				</div>
				<div>
					<dt>Handle</dt>
					<dd>{repositoryHandle}</dd>
				</div>
				<div>
					<dt>DID</dt>
					<dd class="mono">{identity?.did ?? '—'}</dd>
				</div>
				<div>
					<dt>PDS</dt>
					<dd class="mono">{identity?.pds ?? 'Not advertised'}</dd>
				</div>
				<div>
					<dt>Display name</dt>
					<dd>{identity?.displayName ?? 'Not set'}</dd>
				</div>
				<div>
					<dt>Description</dt>
					<dd>{identity?.description ?? 'Not set'}</dd>
				</div>
			</dl>
		</section>
	</div>

	<div class="status-strip" aria-label="System status">
		<div>
			<span>Cache</span>
			<a href="https://dexie.org/" target="_blank"><strong>IndexedDb</strong></a>
		</div>
		<div>
			<span>Network</span>
			<a href="https://atproto.com/" target="_blank"><strong>ATmosphere</strong></a>
		</div>
		<div>
			<span>Login</span>
			<strong>No authentication required</strong>
		</div>
	</div>

	<p class="note">
		View the project on
		<a href={REPO_URL} target="_blank" rel="external">Tangled</a>. Atmosphere logos courtesy of
		<a href="https://tangled.org/cozylittle.house/atmologos" target="_blank" rel="noreferrer">atmologos</a>.
	</p>
	<p class="note"><em>*not really</em></p>
</section>

<style>
	.about-computer {
		display: grid;
		gap: var(--space-4);
		height: 100%;
		padding: var(--space-5);
		overflow: auto;
		background:
			radial-gradient(circle at 18% 18%, rgb(244 186 98 / 0.35), transparent 10rem), linear-gradient(#fff8eb, #decaac);
	}

	.hero {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-4);
		background: linear-gradient(#fffaf0, #ead8ba);
		border: 1px solid #b29165;
		border-radius: var(--radius-3);
		box-shadow: var(--shadow-raised);
	}

	.hero img {
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.24));
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

	h3 {
		margin-bottom: var(--space-3);
		padding: var(--space-1) var(--space-2);
		color: #fff8ea;
		font-size: var(--text-1);
		background: linear-gradient(#7b5733, #4f321e);
		border: 1px solid #3d2415;
		border-radius: var(--radius-1);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.65);
	}

	.hero p:last-child,
	.note {
		margin-top: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-2);
	}

	.details-grid {
		display: grid;
		gap: var(--space-4);
	}

	.details-panel,
	.status-strip {
		padding: var(--space-3);
		background: #fffdf7;
		border: 1px solid #b29165;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
	}

	.identity-card {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-3);
		padding: var(--space-2);
		background: linear-gradient(#fff8e8, #ead9bd);
		border: 1px solid #c2a072;
		border-radius: var(--radius-2);
	}

	.identity-card img {
		border: 1px solid #8e6d43;
		border-radius: var(--radius-1);
		object-fit: cover;
		background: #f4e4c8;
	}

	.identity-card div {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	.identity-card strong,
	.identity-card span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.identity-card span,
	.empty-state {
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	dl {
		display: grid;
		gap: var(--space-2);
	}

	dl div {
		display: grid;
		grid-template-columns: 8.5rem minmax(0, 1fr);
		gap: var(--space-3);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid #ead9bd;
	}

	dl div:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}

	dt {
		color: var(--text-muted);
		font-size: var(--text-1);
		font-weight: 700;
	}

	dd {
		overflow-wrap: anywhere;
		font-size: var(--text-1);
	}

	.mono {
		font-family: var(--font-mono);
	}

	dd a {
		color: var(--blue-700);
		font-weight: 700;
		text-decoration: underline;
	}

	.status-strip {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-2);
	}

	.status-strip div {
		display: grid;
		gap: 0.1rem;
		padding: var(--space-2);
		background: linear-gradient(#f8ecd5, #e2caa5);
		border: 1px solid #c2a072;
		border-radius: var(--radius-1);
	}

	.status-strip span {
		color: var(--text-muted);
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.status-strip strong {
		overflow-wrap: anywhere;
		font-size: var(--text-1);
	}

	.note {
		align-self: end;
	}

	.note a {
		color: var(--blue-700);
		font-weight: 700;
		text-decoration: underline;
	}

	@media (max-width: 760px) {
		.about-computer {
			padding: var(--space-3);
		}

		.hero,
		.details-grid,
		.status-strip,
		dl div {
			grid-template-columns: 1fr;
		}
	}
</style>
