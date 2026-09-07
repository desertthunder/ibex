import { describe, expect, it } from 'vitest';
import { highlightJson } from './syntax-highlighting';

describe('highlightJson', () => {
	it('preserves JSON text and adds syntax colours', async () => {
		const json = '{\n  "enabled": true,\n  "count": 3\n}';
		const lines = await highlightJson(json);
		const tokens = lines.flat();

		expect(lines.map((line) => line.map((token) => token.content).join('')).join('\n')).toBe(json);
		expect(tokens.some((token) => token.content.includes('enabled') && token.color)).toBe(true);
		expect(tokens.some((token) => token.content.includes('true') && token.color)).toBe(true);
	});
});
