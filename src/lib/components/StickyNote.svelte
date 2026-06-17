<script lang="ts">
	import { buildVersion } from '$lib/version';
	import { REPO_URL } from '$lib/constants';
	let { onclose }: { onclose: () => void } = $props();
</script>

<aside class="sticky-note" aria-label="Design note">
	<button type="button" aria-label="Close note" onclick={onclose}>x</button>
	<h2>Intrepid Ibex</h2>
	<p>This app is a recreation of the spirit of Ubuntu 8.10</p>
	<hr />
	<p class="version-label">
		<a href={REPO_URL} target="_blank" rel="external">{buildVersion.display}</a>
	</p>
</aside>

<style>
	.sticky-note {
		position: relative;
		align-self: end;
		width: min(18rem, 100%);
		margin-bottom: var(--space-8);
		padding: var(--space-4);
		transform: rotate(1.2deg);
		color: #3a250e;
		background: linear-gradient(135deg, #fff1a9, #e9bf51);
		border: 1px solid #946b19;
		border-radius: var(--radius-2);
		box-shadow:
			0 12px 24px rgb(0 0 0 / 0.25),
			0 1px 0 rgb(255 255 255 / 0.72) inset;
	}

	.sticky-note button {
		position: absolute;
		top: var(--space-1);
		right: var(--space-1);
		width: 1.25rem;
		height: 1.25rem;
		color: #6b4a12;
		font-weight: 700;
		cursor: default;
	}

	.sticky-note h2 {
		font-size: var(--text-4);
		line-height: var(--leading-tight);
	}

	.sticky-note p {
		margin-top: var(--space-2);
		font-size: var(--text-2);
	}

	.sticky-note hr {
		margin: var(--space-3) 0 var(--space-2);
		border: 0;
		border-top: 1px solid rgb(104 74 18 / 0.48);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.42);
	}

	.version-label {
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	.version-label a {
		color: inherit;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
	}

	.version-label a:hover {
		color: #211205;
	}

	@media (max-width: 1000px) {
		.sticky-note {
			display: none;
		}
	}
</style>
