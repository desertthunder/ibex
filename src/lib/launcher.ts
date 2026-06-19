export type DesktopLauncherId =
	| 'home'
	| 'collections'
	| 'identity-inspector'
	| 'image-viewer'
	| 'web-browser'
	| 'about-computer'
	| 'document-viewer'
	| 'trash';

export type DesktopLauncher = { id: DesktopLauncherId; label: string; icon: string };

export const desktopLaunchers: DesktopLauncher[] = [
	{ id: 'home', label: 'ibex Home', icon: '/icons/humanity/places/user-home.svg' },
	{ id: 'collections', label: 'Collections', icon: '/icons/humanity/places/folder.svg' },
	{ id: 'identity-inspector', label: 'Identity Inspector', icon: '/icons/humanity/apps/identity-inspector.svg' },
	{ id: 'image-viewer', label: 'Image Viewer', icon: '/icons/humanity/apps/eog.svg' },
	{ id: 'web-browser', label: 'Web Browser', icon: '/icons/humanity/apps/web-browser.svg' },
	{ id: 'about-computer', label: 'Computer', icon: '/icons/humanity/devices/computer.svg' },
	{ id: 'document-viewer', label: 'Document Viewer', icon: '/icons/humanity/mimes/gnome-mime-application-pdf.svg' },
	{ id: 'trash', label: 'Trash', icon: '/icons/humanity/places/user-trash.svg' }
];

const leftDesktopLauncherIds = new Set<DesktopLauncherId>(['home', 'collections', 'about-computer', 'trash']);
const rightDesktopLauncherIds = new Set<DesktopLauncherId>([
	'identity-inspector',
	'image-viewer',
	'web-browser',
	'document-viewer'
]);

export const leftDesktopLaunchers = desktopLaunchers.filter((launcher) => leftDesktopLauncherIds.has(launcher.id));

export const rightDesktopLaunchers = desktopLaunchers.filter((launcher) => rightDesktopLauncherIds.has(launcher.id));
