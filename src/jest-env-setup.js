/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

// eslint-disable-next-line import/no-extraneous-dependencies
// import '@testing-library/jest-dom/extend-expect';
// import server from './mocks/server';

beforeEach(() => {
	// Do not useFakeTimers with `whatwg-fetch` if using mocked server
	// https://github.com/mswjs/msw/issues/448
	jest.useFakeTimers();
});
beforeAll(() => {
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