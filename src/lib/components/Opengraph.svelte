<script lang="ts">
	interface Props {
		browserIcon: string;
		width: number;
		height: number;
	}

	let { browserIcon, width, height }: Props = $props();
</script>

<div
	style="display:flex; width:{width}px; height:{height}px; background:#5b412e; color:#251b13; font-family:'Ubuntu Sans'; position:relative; overflow:hidden;">
	<div
		style="display:flex; position:absolute; inset:0; background:linear-gradient(135deg, #6f4c30 0%, #4f3729 46%, #2c001e 100%);">
	</div>
	<div
		style="display:flex; position:absolute; left:-130px; bottom:-180px; width:520px; height:520px; border-radius:260px; background:#dd6f1a; opacity:0.22;">
	</div>
	<div
		style="display:flex; position:absolute; right:-180px; top:80px; width:540px; height:540px; border-radius:270px; background:#f28c22; opacity:0.16;">
	</div>

	<div
		style="display:flex; position:absolute; top:0; left:0; right:0; height:38px; align-items:center; padding:0 16px; color:#fff5df; background:linear-gradient(90deg, #3b2418, #1f140d); border-bottom:2px solid rgba(0,0,0,0.65); font-size:19px; text-shadow:0 2px 0 rgba(0,0,0,0.65);">
		<div style="display:flex; align-items:center; gap:11px; font-weight:700;">
			<span>Applications</span><span>Places</span><span>System</span>
		</div>
		<div style="display:flex; margin-left:auto; gap:18px; font-family:'Ubuntu Mono'; font-size:17px; opacity:0.92;">
			<span>Made by</span><span>@desertthunder.dev</span>
		</div>
	</div>

	<div
		style="display:flex; position:absolute; left:74px; top:86px; width:956px; height:456px; flex-direction:column; background:#d9c7aa; border:3px solid #6b401e; border-radius:8px; box-shadow:0 24px 56px rgba(0,0,0,0.45); overflow:hidden;">
		<div
			style="display:flex; height:46px; align-items:center; padding:0 13px; color:#fff5df; background:linear-gradient(90deg, #704321, #3c2113); border-bottom:2px solid #27160d; text-shadow:0 2px 0 rgba(0,0,0,0.72);">
			<img src={browserIcon} alt="" style="width:30px; height:30px; margin-right:10px;" />
			<div style="display:flex; font-size:23px; font-weight:700;">Intrepid Ibex — ATProto Browser</div>
			<div style="display:flex; margin-left:auto; gap:7px;">
				<div
					style="display:flex; width:22px; height:22px; align-items:center; justify-content:center; background:#e6d2b3; border:1px solid #4b2e19; color:#251b13; font-family:'Ubuntu Mono'; font-size:18px;">
					−
				</div>
				<div
					style="display:flex; width:22px; height:22px; align-items:center; justify-content:center; background:#d96c18; border:1px solid #4b2e19; color:white; font-family:'Ubuntu Mono'; font-size:18px;">
					×
				</div>
			</div>
		</div>

		<div style="display:flex; flex:1; background:#f3eadb; padding:32px 36px; gap:30px;">
			<div
				style="display:flex; width:248px; flex-direction:column; gap:12px; padding:18px; background:#fffaf0; border:2px solid #b99d78;">
				<div style="display:flex; font-family:'Ubuntu Mono'; font-size:18px; color:#67594c;">at://browser</div>
				<div
					style="display:flex; height:30px; align-items:center; padding:0 9px; background:#d8c7ab; border:1px solid #8a5527; font-family:'Ubuntu Mono'; font-size:17px;">
					repos
				</div>
				<div
					style="display:flex; height:30px; align-items:center; padding:0 9px; background:#f2ead9; border:1px solid #d1b183; font-family:'Ubuntu Mono'; font-size:17px;">
					collections
				</div>
				<div
					style="display:flex; height:30px; align-items:center; padding:0 9px; background:#f2ead9; border:1px solid #d1b183; font-family:'Ubuntu Mono'; font-size:17px;">
					records
				</div>
			</div>

			<div style="display:flex; flex:1; flex-direction:column;">
				<div style="display:flex; color:#dd6f1a; font-size:28px; font-weight:700; margin-bottom:14px;">
					A silly desktop-like UI for browsing the atmosphere
				</div>
				<div
					style="display:flex; color:#251b13; font-size:58px; line-height:1.04; font-weight:700; max-width:590px; letter-spacing:-1px;">
					Ubuntu 8.10 meets the ATmosphere.
				</div>
				<div style="display:flex; margin-top:22px; color:#67594c; font-size:26px; line-height:1.28; max-width:620px;">
					Browse records like its 2008.
				</div>
				<div
					style="display:flex; margin-top:auto; gap:12px; align-items:center; font-family:'Ubuntu Mono'; font-size:19px; color:#fff5df;">
					<div style="display:flex; background:#704321; border:2px solid #4b2e19; padding:9px 13px;">GNOME(-ish)</div>
					<div style="display:flex; background:#dd6f1a; border:2px solid #8a5527; padding:9px 13px;">Svelte 5</div>
				</div>
			</div>
		</div>
	</div>

	<div
		style="display:flex; position:absolute; left:0; right:0; bottom:0; height:34px; align-items:center; padding:0 15px; color:#fff5df; background:linear-gradient(90deg, #3b2418, #1f140d); border-top:2px solid rgba(255,255,255,0.16); font-family:'Ubuntu Mono'; font-size:17px;">
		<div
			style="display:flex; background:#f5e7cb; color:#23170f; border:1px solid #4b2e19; padding:3px 24px; margin-right:12px;">
			Intrepid Ibex
		</div>
		<span style="opacity:0.82;">tangled.org/desertthunder.dev/ibex</span>
	</div>
</div>
