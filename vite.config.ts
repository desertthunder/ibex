import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	assetsInclude: ['**/*.wasm'],
	optimizeDeps: { exclude: ['@electric-sql/pglite'] },
	build: {
		rolldownOptions: {
			onLog(level, log, defaultHandler) {
				const message = typeof log === 'string' ? log : log.message;

				/**
				 * PGlite currently emits Rolldown direct-eval warnings from its own
				 * packaged code. The app lazy-loads PGlite behind DB operations, and
				 * this filter is intentionally scoped to that third-party package so
				 * eval warnings from app code still surface.
				 */
				if (level === 'warn' && message.includes('Use of direct `eval`') && message.includes('@electric-sql/pglite')) {
					return;
				}

				if (level === 'warn' && message.includes('[PLUGIN_TIMINGS]')) {
					return;
				}

				defaultHandler(level, log);
			}
		}
	},
	test: {
		expect: { requireAssertions: true },
		ui: false,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						headless: true,
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
