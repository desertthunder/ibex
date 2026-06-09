class DesktopSessionState {
	isLocked = $state(false);

	lock() {
		this.isLocked = true;
	}

	unlock() {
		this.isLocked = false;
	}
}

export const desktopSession = new DesktopSessionState();
