<script lang="ts">
	import { onMount } from 'svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { desktopSession } from '$lib/desktop-session.svelte';

	let now = $state(new Date());

	const panelTime = $derived(
		now.toLocaleString([], {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit',
			timeZoneName: 'short'
		})
	);

	onMount(() => {
		const interval = window.setInterval(() => {
			now = new Date();
		}, 1000);

		return () => window.clearInterval(interval);
	});
</script>

<aside class="panel-tray" aria-label="Status tray">
	{#if accountSetup.identity}
		<a
			class="account-chip"
			href={`https://aturi.to/profile/${encodeURIComponent(accountSetup.identity.handle)}`}
			target="_blank"
			rel="noopener noreferrer"
			title={`Open @${accountSetup.identity.handle} on aturi.to`}>
			{#if accountSetup.identity.avatar}
				<img src={accountSetup.identity.avatar} alt="" width="16" height="16" />
			{:else}
				<img src="/icons/humanity/places/user-home.svg" alt="" width="16" height="16" />
			{/if}
			<span>@{accountSetup.identity.handle}</span>
		</a>
	{/if}
	<button class="tray-button" type="button" onclick={() => desktopSession.lock()} title="Lock screen">
		<img src="/icons/humanity/status/network-wireless-encrypted.svg" alt="Lock screen" width="16" height="16" />
	</button>
	<a class="tray-button" href="https://plyr.fm" target="_blank" rel="noopener noreferrer" title="Open plyr.fm">
		<img src="/icons/humanity/status/audio-volume-medium.svg" alt="Open plyr.fm" width="16" height="16" />
	</a>
	<a class="tray-button" href="https://time.is" target="_blank">
		<time datetime={now.toISOString()}>{panelTime}</time>
	</a>
</aside>

<style>
	.panel-tray {
		order: 100;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.account-chip,
	.tray-button {
		display: inline-flex;
		align-items: center;
		height: 1.35rem;
		border: 1px solid transparent;
		border-radius: var(--radius-1);
		cursor: default;
	}

	.account-chip {
		gap: var(--space-1);
		max-width: 12rem;
		padding: 0 var(--space-1);
	}

	.tray-button {
		justify-content: center;
		min-width: 1.35rem;
	}

	.account-chip:hover,
	.tray-button:hover {
		background: rgb(255 238 203 / 0.16);
		border-color: rgb(255 255 255 / 0.18) rgb(0 0 0 / 0.35) rgb(0 0 0 / 0.45) rgb(255 255 255 / 0.16);
	}

	.account-chip img {
		border-radius: var(--radius-1);
	}

	.account-chip span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.panel-tray time {
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 760px) {
		.account-chip span {
			display: none;
		}
	}
</style>
