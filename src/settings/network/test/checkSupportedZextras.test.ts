/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import fetchMock from 'jest-fetch-mock';

import { checkSupportedZextras } from '../checkSupportedZextras';

describe('checkSupportedZextras', () => {
	it('should return { hasZextras: false } when the status is 502', async () => {
		fetchMock.mockResponseOnce('', { status: 502 });

		const result = await checkSupportedZextras();
		expect(result).toEqual({ hasZextras: false });
	});

	it('should return { hasZextras: false } when the status is 404', async () => {
		fetchMock.mockResponseOnce('', { status: 404 });

		const result = await checkSupportedZextras();
		expect(result).toEqual({ hasZextras: false });
	});

	it('should return { hasZextras: false } when the status is 202', async () => {
		fetchMock.mockResponseOnce('', { status: 202 });

		const result = await checkSupportedZextras();
		expect(result).toEqual({ hasZextras: false });
	});

	it('should return { hasZextras: true } when the status is 200', async () => {
		fetchMock.mockResponseOnce('', { status: 200 });

		const result = await checkSupportedZextras();
		expect(result).toEqual({ hasZextras: true });
	});
});
