<script lang="ts">
	type Props = { label: string; icon: string; selected?: boolean };

	let { label, icon, selected = false }: Props = $props();
</script>

<button class:selected class="desktop-icon" type="button" aria-label={label}>
	<img src={icon} alt="" width="48" height="48" />
	<span>{label}</span>
</button>

<style>
	.desktop-icon {
		display: grid;
		justify-items: center;
		gap: var(--space-1);
		width: 5.75rem;
		padding: var(--space-2) var(--space-1);
		color: var(--desktop-text);
		text-align: center;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.95);
		border: 1px solid transparent;
		border-radius: var(--radius-2);
		cursor: default;
	}

	.desktop-icon img {
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.4));
	}

	.desktop-icon span {
		padding: 1px 4px 2px;
		font-size: var(--text-1);
		line-height: var(--leading-tight);
		border-radius: var(--radius-1);
	}

	.desktop-icon:hover,
	.desktop-icon.selected {
		background: rgb(238 168 82 / 0.2);
		border-color: rgb(255 246 213 / 0.36);
	}

	.desktop-icon.selected span {
		background: rgb(177 81 19 / 0.82);
	}
</style>
