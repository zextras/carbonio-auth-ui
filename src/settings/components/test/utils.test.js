/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	copyToClipboard,
	differenceObject,
	findLabel,
	formatDate,
	formatDateUsingLocale,
	objToBase64
} from '../utils';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' }))
}));

describe('differenceObject', () => {
	it('should return an empty object when both objects are identical', () => {
		expect(differenceObject({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual({});
	});

	it('should return the changed key when a single value differs', () => {
		expect(differenceObject({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 2 });
	});

	it('should return only the changed nested key for nested objects', () => {
		expect(differenceObject({ a: { x: 1, y: 2 } }, { a: { x: 1, y: 3 } })).toEqual({
			a: { y: 2 }
		});
	});

	it('should include keys present in object but absent in base', () => {
		expect(differenceObject({ a: 1, b: 2 }, { a: 1 })).toEqual({ b: 2 });
	});
});

describe('findLabel', () => {
	it('should return the label for a matching value', () => {
		const list = [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Beta' }
		];
		expect(findLabel(list, 'a')).toBe('Alpha');
	});

	it('should return the correct label for the last item in the list', () => {
		const list = [
			{ value: 'x', label: 'Ex' },
			{ value: 'y', label: 'Why' }
		];
		expect(findLabel(list, 'y')).toBe('Why');
	});
});

describe('formatDate', () => {
	it('should return "/" for null input', () => {
		expect(formatDate(null)).toBe('/');
	});

	it('should return "/" for an empty string', () => {
		expect(formatDate('')).toBe('/');
	});

	it('should return a formatted string containing "|" for a valid date', () => {
		const result = formatDate(new Date('2024-01-15T10:30:00'));
		expect(result).toContain('|');
	});

	it('should format the date in en-GB style (day month year)', () => {
		const result = formatDate(new Date('2024-01-15T10:30:00'));
		expect(result).toContain('January');
		expect(result).toContain('2024');
	});
});

describe('formatDateUsingLocale', () => {
	it('should return "/" for a falsy timestamp', () => {
		expect(formatDateUsingLocale(0)).toBe('/');
		expect(formatDateUsingLocale(null)).toBe('/');
	});

	it('should return a formatted string containing "|" for a valid timestamp', () => {
		const result = formatDateUsingLocale(new Date('2024-01-15T10:30:00').getTime());
		expect(result).toContain('|');
	});
});

describe('objToBase64', () => {
	it('should round-trip an object through base64 encoding and back', () => {
		const obj = { user: 'alice', count: 42, active: true };
		const encoded = objToBase64(obj);
		const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
		expect(decoded).toEqual(obj);
	});

	it('should produce a base64 string (no spaces or newlines)', () => {
		const encoded = objToBase64({ key: 'value' });
		expect(typeof encoded).toBe('string');
		expect(encoded).not.toMatch(/\s/);
	});
});

describe('copyToClipboard', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should call navigator.clipboard.writeText on Firefox', () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', {
			userAgent: 'Mozilla/5.0 (Android; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
			clipboard: { writeText: writeTextMock }
		});
		copyToClipboard('test-text');
		expect(writeTextMock).toHaveBeenCalledWith('test-text');
	});

	it('should use document.execCommand on non-Firefox browsers', () => {
		vi.stubGlobal('navigator', {
			userAgent: 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
			clipboard: { writeText: vi.fn() }
		});
		const execCommandMock = vi.fn().mockReturnValue(true);
		Object.defineProperty(document, 'execCommand', {
			configurable: true,
			writable: true,
			value: execCommandMock
		});
		copyToClipboard('test-text');
		expect(execCommandMock).toHaveBeenCalledWith('copy');
	});
});
