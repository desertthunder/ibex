import { browser } from '$app/environment';
import { defaultIdentity, type AccountIdentity } from './identity';

const storageKey = 'intrepid-ibex:account-identity';

class AccountSetupState {
	identity = $state<AccountIdentity | null>(null);
	loaded = $state(false);

	get isConfigured() {
		return this.identity !== null;
	}

	load() {
		if (!browser || this.loaded) {
			return;
		}

		const stored = localStorage.getItem(storageKey);

		if (stored) {
			try {
				this.identity = JSON.parse(stored) as AccountIdentity;
			} catch {
				localStorage.removeItem(storageKey);
			}
		}

		this.loaded = true;
	}

	save(identity: AccountIdentity) {
		this.identity = identity;

		if (browser) {
			localStorage.setItem(storageKey, JSON.stringify(identity));
		}
	}

	reset() {
		this.identity = null;

		if (browser) {
			localStorage.removeItem(storageKey);
		}
	}
}

export const accountSetup = new AccountSetupState();
export const setupDefaults = defaultIdentity;
