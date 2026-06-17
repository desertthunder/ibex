<script lang="ts">
	import { onMount } from 'svelte';
	import { accountSetup } from '$lib/atproto/setup.svelte';
	import { desktopSession } from '$lib/desktop-session.svelte';
	import { startupSound } from '$lib/sounds.svelte';

	let now = $state(new Date());
	let isSoundMenuOpen = $state(false);

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
		startupSound.initialize();

		const interval = window.setInterval(() => {
			now = new Date();
		}, 1000);

		return () => window.clearInterval(interval);
	});

	function replayStartupSound() {
		isSoundMenuOpen = false;
		void startupSound.replay();
	}

	function syncSoundMenuState(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLDetailsElement)) return;

		isSoundMenuOpen = target.open;
	}

	function setStartupSoundMuted(event: Event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;

		startupSound.setMuted(target.checked);
	}
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
	<details class="sound-menu" open={isSoundMenuOpen} ontoggle={syncSoundMenuState}>
		<summary class="tray-button" title="Sound">
			{#if startupSound.isMuted}
				<img src="/icons/humanity/status/audio-volume-muted.svg" alt="Sound muted" width="16" height="16" />
			{:else}
				<img src="/icons/humanity/status/audio-volume-medium.svg" alt="Sound" width="16" height="16" />
			{/if}
		</summary>
		<div class="sound-popover">
			<button class="sound-menu-item" type="button" onclick={replayStartupSound} disabled={startupSound.isMuted}>
				<img src="/icons/humanity/status/audio-volume-medium.svg" alt="" width="16" height="16" />
				<span>Replay startup sound</span>
			</button>
			<label class="sound-menu-item">
				<input type="checkbox" checked={startupSound.isMuted} onchange={setStartupSoundMuted} />
				<span>Mute startup sound</span>
			</label>
		</div>
	</details>
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
	.tray-button:hover,
	.sound-menu[open] .tray-button {
		background: rgb(255 238 203 / 0.16);
		border-color: rgb(255 255 255 / 0.18) rgb(0 0 0 / 0.35) rgb(0 0 0 / 0.45) rgb(255 255 255 / 0.16);
	}

	.sound-menu {
		position: relative;
	}

	.sound-menu summary {
		list-style: none;
	}

	.sound-menu summary::-webkit-details-marker {
		display: none;
	}

	.sound-popover {
		position: absolute;
		top: calc(100% + 3px);
		right: 0;
		display: grid;
		gap: 1px;
		min-width: 13rem;
		padding: var(--space-1);
		color: var(--text);
		background: linear-gradient(#f4e6cc, #cfb58c);
		border: 1px solid #4d2c17;
		box-shadow: 0 10px 22px rgb(0 0 0 / 0.42);
		text-shadow: none;
		z-index: 10;
	}

	.sound-menu-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		min-height: 1.6rem;
		padding: 0 var(--space-2);
		color: var(--text);
		border: 1px solid transparent;
		border-radius: var(--radius-1);
	}

	button.sound-menu-item {
		cursor: default;
	}

	button.sound-menu-item:hover:not(:disabled),
	.sound-menu-item:has(input:hover) {
		color: white;
		background: var(--selection);
	}

	button.sound-menu-item:disabled {
		opacity: 0.55;
	}

	.sound-menu-item input {
		margin: 0;
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
