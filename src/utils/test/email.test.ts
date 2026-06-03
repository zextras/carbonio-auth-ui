/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isValidEmail } from '../email';

describe('isValidEmail', () => {
	it('should return true for a standard valid email', () => {
		expect(isValidEmail('user@example.com')).toBe(true);
	});

	it('should return true for a short domain email', () => {
		expect(isValidEmail('a@b.co')).toBe(true);
	});

	it('should return true for an email with subdomain', () => {
		expect(isValidEmail('user@mail.example.com')).toBe(true);
	});

	it('should return false for an empty string', () => {
		expect(isValidEmail('')).toBe(false);
	});

	it('should return false when the @ symbol is missing', () => {
		expect(isValidEmail('userexample.com')).toBe(false);
	});

	it('should return false when the domain is missing after @', () => {
		expect(isValidEmail('user@')).toBe(false);
	});

	it('should return false when there is no TLD', () => {
		expect(isValidEmail('user@example')).toBe(false);
	});

	it('should return false for a whitespace-only string', () => {
		expect(isValidEmail('   ')).toBe(false);
	});

	it('should return true for an email with a plus sign in the local part', () => {
		expect(isValidEmail('user+tag@example.com')).toBe(true);
	});
});
