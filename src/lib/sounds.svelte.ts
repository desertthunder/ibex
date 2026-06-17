import { browser } from '$app/environment';

const STARTUP_SOUND_PLAYED_KEY = 'intrepid-ibex-startup-sound-played';
const STARTUP_SOUND_MUTED_KEY = 'intrepid-ibex-startup-sound-muted';
const STARTUP_SOUND_SRC = '/sounds/login.ogg';
const STARTUP_SOUND_VOLUME = 0.2;

class StartupSoundState {
	hasPlayed = $state(false);
	isMuted = $state(false);

	private activeAudio: HTMLAudioElement | null = null;
	private initialized = false;

	initialize() {
		if (!browser || this.initialized) return;

		this.initialized = true;
		this.hasPlayed = this.wasPlayedBefore();
		this.isMuted = this.wasMutedBefore();
	}

	async playOnStartup() {
		this.initialize();
		if (this.hasPlayed || this.isMuted) return;

		await this.play();
	}

	async replay() {
		this.initialize();
		await this.play();
	}

	setMuted(isMuted: boolean) {
		this.initialize();
		this.isMuted = isMuted;

		if (isMuted && this.activeAudio) {
			this.activeAudio.pause();
			this.activeAudio.currentTime = 0;
			this.activeAudio = null;
		}

		try {
			localStorage.setItem(STARTUP_SOUND_MUTED_KEY, String(isMuted));
		} catch {
			// Storage can be unavailable in restricted browser contexts.
		}
	}

	private async play() {
		if (!browser || this.isMuted || this.activeAudio) return;

		const audio = new Audio(STARTUP_SOUND_SRC);
		audio.volume = STARTUP_SOUND_VOLUME;
		audio.preload = 'auto';
		this.activeAudio = audio;

		audio.addEventListener(
			'ended',
			() => {
				if (this.activeAudio === audio) this.activeAudio = null;
			},
			{ once: true }
		);

		try {
			await audio.play();
			this.markPlayed();
		} catch {
			if (this.activeAudio === audio) this.activeAudio = null;
		}
	}

	private markPlayed() {
		this.hasPlayed = true;

		try {
			localStorage.setItem(STARTUP_SOUND_PLAYED_KEY, 'true');
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.debug('browser storage unavailable', message);
		}
	}

	private wasPlayedBefore() {
		try {
			return localStorage.getItem(STARTUP_SOUND_PLAYED_KEY) === 'true';
		} catch {
			return false;
		}
	}

	private wasMutedBefore() {
		try {
			return localStorage.getItem(STARTUP_SOUND_MUTED_KEY) === 'true';
		} catch {
			return false;
		}
	}
}

export const startupSound = new StartupSoundState();
