import type { AccountIdentity } from './types';

class RepoSessionState {
	identity = $state<AccountIdentity | null>(null);

	set(identity: AccountIdentity) {
		this.identity = identity;
	}

	clear() {
		this.identity = null;
	}
}

export const repoSession = new RepoSessionState();
