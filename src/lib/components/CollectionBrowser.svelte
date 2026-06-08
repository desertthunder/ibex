<script lang="ts">
	const collections = [
		{
			name: 'app.bsky.feed.post',
			count: '18,204',
			icon: '/icons/humanity/apps/internet-feed-reader.svg',
			active: true
		},
		{ name: 'app.bsky.actor.profile', count: '1,282', icon: '/icons/humanity/places/user-home.svg' },
		{ name: 'app.bsky.graph.follow', count: '6,914', icon: '/icons/humanity/places/folder.svg' },
		{ name: 'chat.bsky.convo.defs', count: '126', icon: '/icons/humanity/apps/evolution-mail.svg' },
		{ name: 'com.atproto.repo.strongRef', count: '42', icon: '/icons/humanity/mimes/text-x-generic.svg' }
	];

	const records = [
		{
			author: '@intrepid-ibex.test',
			time: '10:08',
			title: 'Classic GNOME shell mockup',
			body: 'Panels, textured chrome, collection folders, and a very 2008 address bar are now static and ready to wire into AT Protocol data.'
		},
		{
			author: '@desktop.example',
			time: '09:44',
			title: 'Humanity icon import',
			body: 'Using archived Ubuntu Humanity assets for launchers, desktop shortcuts, window icons, and status tray affordances.'
		},
		{
			author: '@repo.tools',
			time: 'Yesterday',
			title: 'Collection-first browsing',
			body: 'Each application can become a focused browser for a different collection namespace without losing the GNOME desktop metaphor.'
		}
	];
</script>

<div class="collection-browser">
	<aside class="sidebar" aria-label="Collections">
		<header>
			<h2>Collections</h2>
			<p>at:// repo folders</p>
		</header>

		<ul>
			{#each collections as collection (collection.name)}
				<li>
					<button class:active={collection.active} type="button">
						<img src={collection.icon} alt="" width="24" height="24" />
						<span>{collection.name}</span>
						<small>{collection.count}</small>
					</button>
				</li>
			{/each}
		</ul>
	</aside>

	<section class="record-pane" aria-label="Collection records">
		<div class="summary-card">
			<img src="/icons/humanity/apps/internet-feed-reader.svg" alt="" width="48" height="48" />
			<div>
				<p class="eyebrow">Selected collection</p>
				<h2>app.bsky.feed.post</h2>
				<p>
					Browse posts as if they were tidy Nautilus files. This is a static design pass for the ATProto desktop
					browser.
				</p>
			</div>
		</div>

		<div class="record-list">
			<header>
				<span>Name</span>
				<span>Author</span>
				<span>Modified</span>
			</header>

			{#each records as record (record.title)}
				<article>
					<img src="/icons/humanity/mimes/text-x-generic.svg" alt="" width="32" height="32" />
					<div>
						<h3>{record.title}</h3>
						<p>{record.body}</p>
					</div>
					<strong>{record.author}</strong>
					<time>{record.time}</time>
				</article>
			{/each}
		</div>
	</section>
</div>

<style>
	.collection-browser {
		display: grid;
		grid-template-columns: minmax(12rem, 18rem) minmax(0, 1fr);
		height: 100%;
		overflow: hidden;
		border: 1px solid #a58a63;
		background: #fff8ed;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.7) inset;
	}

	.sidebar {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
		background: linear-gradient(90deg, #cdb690, #e6d5b8);
		border-right: 1px solid #9e8057;
	}

	.sidebar header {
		padding: var(--space-3);
		border-bottom: 1px solid #a88c62;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.45);
	}

	.sidebar h2,
	.summary-card h2 {
		font-size: var(--text-4);
		line-height: var(--leading-tight);
	}

	.sidebar p,
	.summary-card p,
	.record-list p {
		color: var(--text-muted);
		font-size: var(--text-1);
	}

	.sidebar ul {
		overflow: auto;
		padding: var(--space-2);
	}

	.sidebar button {
		display: grid;
		grid-template-columns: 24px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2);
		border: 1px solid transparent;
		border-radius: var(--radius-2);
		font-size: var(--text-1);
		text-align: left;
		cursor: default;
	}

	.sidebar button.active,
	.sidebar button:hover {
		color: white;
		background: linear-gradient(#e48631, #b65312);
		border-color: #f4b46b #8d3c0b #713009 #f1a35e;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.55);
	}

	.sidebar span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sidebar small {
		font-size: var(--text-0);
		opacity: 0.82;
	}

	.record-pane {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-width: 0;
		min-height: 0;
		background: #fff9ef;
	}

	.summary-card {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		padding: var(--space-4);
		background: linear-gradient(#fffaf1, #ead8b8);
		border-bottom: 1px solid #b29366;
	}

	.eyebrow {
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.record-list {
		overflow: auto;
		padding: var(--space-3);
	}

	.record-list > header,
	.record-list article {
		display: grid;
		grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem) 5rem;
		gap: var(--space-3);
		align-items: center;
	}

	.record-list > header {
		padding: var(--space-1) var(--space-3);
		color: var(--text-muted);
		background: linear-gradient(#eadbbf, #cbb18a);
		border: 1px solid #a88b63;
		border-radius: var(--radius-2) var(--radius-2) 0 0;
		font-size: var(--text-0);
		font-weight: 700;
		text-transform: uppercase;
	}

	.record-list article {
		grid-template-columns: 32px minmax(14rem, 1fr) minmax(10rem, 14rem) 5rem;
		padding: var(--space-3);
		background: #fffdf8;
		border-right: 1px solid #d7c4a4;
		border-bottom: 1px solid #d7c4a4;
		border-left: 1px solid #d7c4a4;
	}

	.record-list article:nth-child(odd) {
		background: #f7eddb;
	}

	.record-list article:hover {
		background: #f1d09d;
	}

	.record-list h3 {
		font-size: var(--text-2);
		line-height: var(--leading-tight);
	}

	.record-list strong,
	.record-list time {
		color: var(--text-muted);
		font-size: var(--text-1);
		font-weight: 500;
	}

	.record-list time {
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 800px) {
		.collection-browser {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: none;
		}

		.record-list > header,
		.record-list article {
			grid-template-columns: 32px minmax(0, 1fr);
		}

		.record-list > header,
		.record-list strong,
		.record-list time {
			display: none;
		}
	}
</style>
