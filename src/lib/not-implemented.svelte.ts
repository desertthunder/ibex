class NotImplementedState {
	message = $state<string | null>(null);

	show(message = 'Coming soon :)') {
		this.message = message;
	}

	close() {
		this.message = null;
	}
}

export const notImplemented = new NotImplementedState();
