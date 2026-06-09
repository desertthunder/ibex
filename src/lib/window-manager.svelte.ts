export type WindowId = 'main' | 'about-computer' | 'gedit' | 'document-viewer';

export type ManagedWindow = {
	id: WindowId;
	title: string;
	icon: string;
	isOpen: boolean;
	isMinimized: boolean;
	isMaximized: boolean;
	zIndex: number;
};

class WindowManager {
	windows = $state<ManagedWindow[]>([
		{
			id: 'main',
			title: 'AT Protocol Collections',
			icon: '/icons/humanity/apps/internet-feed-reader.svg',
			isOpen: true,
			isMinimized: false,
			isMaximized: false,
			zIndex: 1
		},
		{
			id: 'about-computer',
			title: 'About This Computer',
			icon: '/icons/humanity/devices/computer.svg',
			isOpen: false,
			isMinimized: false,
			isMaximized: false,
			zIndex: 2
		},
		{
			id: 'gedit',
			title: 'gedit',
			icon: '/icons/humanity/apps/accessories-text-editor.svg',
			isOpen: false,
			isMinimized: false,
			isMaximized: false,
			zIndex: 3
		},
		{
			id: 'document-viewer',
			title: 'Getting Started - Document Viewer',
			icon: '/icons/humanity/mimes/gnome-mime-application-pdf.svg',
			isOpen: false,
			isMinimized: false,
			isMaximized: false,
			zIndex: 4
		}
	]);

	private nextZIndex = 4;

	get openWindows() {
		return this.windows.filter((window) => window.isOpen);
	}

	getWindow(id: WindowId) {
		return this.windows.find((window) => window.id === id);
	}

	setTitle(id: WindowId, title: string, icon?: string) {
		const target = this.getWindow(id);
		if (!target) return;

		if (target.title !== title) target.title = title;
		if (icon && target.icon !== icon) target.icon = icon;
	}

	open(id: WindowId) {
		const target = this.getWindow(id);
		if (!target) return;

		target.isOpen = true;
		target.isMinimized = false;
		this.focus(id);
	}

	close(id: WindowId) {
		const target = this.getWindow(id);
		if (!target || id === 'main') return;

		target.isOpen = false;
		target.isMinimized = false;
		target.isMaximized = false;
	}

	focus(id: WindowId) {
		const target = this.getWindow(id);
		if (!target) return;

		target.zIndex = this.nextZIndex;
		this.nextZIndex += 1;
	}

	minimize(id: WindowId) {
		const target = this.getWindow(id);
		if (!target) return;

		target.isMinimized = true;
	}

	restore(id: WindowId) {
		const target = this.getWindow(id);
		if (!target) return;

		target.isOpen = true;
		target.isMinimized = false;
		this.focus(id);
	}

	toggleMaximize(id: WindowId) {
		const target = this.getWindow(id);
		if (!target) return;

		target.isMaximized = !target.isMaximized;
		target.isMinimized = false;
		this.focus(id);
	}
}

export const windowManager = new WindowManager();
