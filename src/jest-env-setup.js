/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import fetchMock from 'jest-fetch-mock';
import '@testing-library/jest-dom';

beforeEach(() => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448
	jest.useFakeTimers();
});
beforeAll(() => {
	fetchMock.enableMocks();
	// server.listen();
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(), // Deprecated
			removeListener: jest.fn(), // Deprecated
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn()
		}))
	});
});
// afterAll(() => server.close());
afterEach(() => {
	// server.resetHandlers();
	jest.runOnlyPendingTimers();
	jest.useRealTimers();
});
