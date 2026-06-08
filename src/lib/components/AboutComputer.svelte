<script lang="ts">
	import { accountSetup } from '$lib/atproto/setup.svelte';
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

	<div class="details-panel">
		<dl>
			<div>
				<dt>Operating system</dt>
				<dd>Intrepid Ibex Desktop 0.1</dd>
			</div>
			<div>
				<dt>Desktop environment</dt>
				<dd>Classic GNOME-style shell</dd>
			</div>
			<div>
				<dt>Protocol</dt>
				<dd>AT Protocol, public read-only mode</dd>
			</div>
			<div>
				<dt>Account</dt>
				<dd>{accountSetup.identity ? `@${accountSetup.identity.handle}` : 'No account configured'}</dd>
			</div>
			<div>
				<dt>DID</dt>
				<dd>{accountSetup.identity?.did ?? '—'}</dd>
			</div>
			<div>
				<dt>PDS</dt>
				<dd>{accountSetup.identity?.pds ?? '—'}</dd>
			</div>
		</dl>
	</div>

	<p class="note">
		View the project on
		<a href="https://tangled.org/desertthunder.dev/ibex" target="_blank" rel="noreferrer">Tangled</a>.
	</p>
</section>

<style>
	.about-computer {
		display: grid;
		gap: var(--space-4);
		height: 100%;
		padding: var(--space-5);
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

	.hero p:last-child,
	.note {
		margin-top: var(--space-1);
		color: var(--text-muted);
		font-size: var(--text-2);
	}

	.details-panel {
		padding: var(--space-4);
		background: #fffdf7;
		border: 1px solid #b29165;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
	}

	dl {
		display: grid;
		gap: var(--space-2);
	}

	dl div {
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr);
		gap: var(--space-3);
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

	dl div:nth-last-child(-n + 2) dd {
		font-family: var(--font-mono);
	}

	.note {
		align-self: end;
	}

	.note a {
		color: var(--blue-700);
		font-weight: 700;
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.about-computer {
			padding: var(--space-3);
		}

		.hero,
		dl div {
			grid-template-columns: 1fr;
		}
	}
</style>
