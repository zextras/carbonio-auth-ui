/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { MOBILE_QR_TIMEOUT_SECONDS } from '../../components/shared/mobile-qr-constants';
import {
	MobileQrMobileResponseValue,
	mobileQrMobileResponseRequest,
	mobileQrTokenCheckRequest
} from '../../network/mobile-qr-credential';
import { useMobileQrPolling } from '../use-mobile-qr-polling';

vi.mock('../../network/mobile-qr-credential', () => ({
	mobileQrMobileResponseRequest: vi.fn(),
	mobileQrTokenCheckRequest: vi.fn()
}));

const USER = 'user@example.com';

const details: MobileQrMobileResponseValue = {
	requestedAt: 1794000861348,
	mobileGeneratedToken: '1234-123123',
	ipAddress: '1.2.3.4',
	mobileClientInfo: 'client info',
	location: 'Turkey',
	label: 'mobile',
	user: USER
};

const defaultProps = {
	active: true,
	token: 'token',
	user: USER,
	label: 'mobile',
	onMobileResponse: vi.fn()
};

function deferred<T>(): {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason?: unknown) => void;
} {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, reject, resolve };
}

async function advancePollingTimer(milliseconds = 1000): Promise<void> {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(milliseconds);
	});
}

describe('useMobileQrPolling', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not poll while inactive', async () => {
		renderHook(() => useMobileQrPolling({ ...defaultProps, active: false }));

		await advancePollingTimer();

		expect(mobileQrTokenCheckRequest).not.toHaveBeenCalled();
	});

	it.each([
		['an unsuccessful response', { response: { ok: false } }],
		['an existing token', { response: { ok: true, value: { tokenExists: true } } }]
	])('should continue polling after %s', async (_description, response) => {
		vi.mocked(mobileQrTokenCheckRequest).mockResolvedValue(response);
		renderHook(() => useMobileQrPolling(defaultProps));

		await advancePollingTimer(2000);

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledTimes(2);
		expect(mobileQrMobileResponseRequest).not.toHaveBeenCalled();
	});

	it('should not start another poll while a request is in flight', async () => {
		const tokenCheck = deferred<Awaited<ReturnType<typeof mobileQrTokenCheckRequest>>>();
		vi.mocked(mobileQrTokenCheckRequest).mockReturnValue(tokenCheck.promise);
		renderHook(() => useMobileQrPolling(defaultProps));

		await advancePollingTimer(3000);

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledOnce();
		tokenCheck.resolve({ response: { ok: true, value: { tokenExists: true } } });
		await act(async () => tokenCheck.promise);
		await advancePollingTimer();
		expect(mobileQrTokenCheckRequest).toHaveBeenCalledTimes(2);
	});

	it('should resume polling after a request rejects', async () => {
		vi.mocked(mobileQrTokenCheckRequest)
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValue({ response: { ok: true, value: { tokenExists: true } } });
		renderHook(() => useMobileQrPolling(defaultProps));

		await advancePollingTimer(2000);

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledTimes(2);
	});

	it('should fetch details and notify the latest callback when the token is consumed', async () => {
		const firstCallback = vi.fn();
		const latestCallback = vi.fn();
		vi.mocked(mobileQrTokenCheckRequest).mockResolvedValue({
			response: { ok: true, value: { tokenExists: false } }
		});
		vi.mocked(mobileQrMobileResponseRequest).mockResolvedValue({
			response: { ok: true, value: details }
		});
		const { rerender } = renderHook(
			({ onMobileResponse }) => useMobileQrPolling({ ...defaultProps, onMobileResponse }),
			{ initialProps: { onMobileResponse: firstCallback } }
		);
		rerender({ onMobileResponse: latestCallback });

		await advancePollingTimer();

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledWith('token', USER);
		expect(mobileQrMobileResponseRequest).toHaveBeenCalledWith('mobile', USER);
		expect(firstCallback).not.toHaveBeenCalled();
		expect(latestCallback).toHaveBeenCalledWith(details);
	});

	it.each([
		['an unsuccessful response', { response: { ok: false } }],
		['a response without details', { response: { ok: true } }]
	])(
		'should not notify the callback for %s from the mobile response',
		async (_description, response) => {
			vi.mocked(mobileQrTokenCheckRequest).mockResolvedValue({
				response: { ok: true, value: { tokenExists: false } }
			});
			vi.mocked(mobileQrMobileResponseRequest).mockResolvedValue(response);
			const onMobileResponse = vi.fn();
			renderHook(() => useMobileQrPolling({ ...defaultProps, onMobileResponse }));

			await advancePollingTimer();

			expect(onMobileResponse).not.toHaveBeenCalled();
		}
	);

	it('should retry fetching mobile details after a transient failure', async () => {
		const onMobileResponse = vi.fn();
		vi.mocked(mobileQrTokenCheckRequest).mockResolvedValue({
			response: { ok: true, value: { tokenExists: false } }
		});
		vi.mocked(mobileQrMobileResponseRequest)
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValue({ response: { ok: true, value: details } });
		renderHook(() => useMobileQrPolling({ ...defaultProps, onMobileResponse }));

		await advancePollingTimer(2000);

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledTimes(2);
		expect(mobileQrMobileResponseRequest).toHaveBeenCalledTimes(2);
		expect(onMobileResponse).toHaveBeenCalledWith(details);
	});

	it('should stop processing a token check after unmounting', async () => {
		const tokenCheck = deferred<Awaited<ReturnType<typeof mobileQrTokenCheckRequest>>>();
		vi.mocked(mobileQrTokenCheckRequest).mockReturnValue(tokenCheck.promise);
		const { unmount } = renderHook(() => useMobileQrPolling(defaultProps));
		await advancePollingTimer();

		unmount();
		tokenCheck.resolve({ response: { ok: true, value: { tokenExists: false } } });
		await act(async () => tokenCheck.promise);

		expect(mobileQrMobileResponseRequest).not.toHaveBeenCalled();
	});

	it('should not notify the callback when unmounted during the mobile response request', async () => {
		const mobileResponse = deferred<Awaited<ReturnType<typeof mobileQrMobileResponseRequest>>>();
		vi.mocked(mobileQrTokenCheckRequest).mockResolvedValue({
			response: { ok: true, value: { tokenExists: false } }
		});
		vi.mocked(mobileQrMobileResponseRequest).mockReturnValue(mobileResponse.promise);
		const onMobileResponse = vi.fn();
		const { unmount } = renderHook(() => useMobileQrPolling({ ...defaultProps, onMobileResponse }));
		await advancePollingTimer();

		unmount();
		mobileResponse.resolve({ response: { ok: true, value: details } });
		await act(async () => mobileResponse.promise);

		expect(onMobileResponse).not.toHaveBeenCalled();
	});

	it('should stop polling when the timeout is reached', async () => {
		const tokenCheck = deferred<Awaited<ReturnType<typeof mobileQrTokenCheckRequest>>>();
		vi.mocked(mobileQrTokenCheckRequest).mockReturnValue(tokenCheck.promise);
		renderHook(() => useMobileQrPolling(defaultProps));

		await advancePollingTimer(MOBILE_QR_TIMEOUT_SECONDS * 1000);
		tokenCheck.resolve({ response: { ok: true, value: { tokenExists: true } } });
		await act(async () => tokenCheck.promise);
		await advancePollingTimer(2000);

		expect(mobileQrTokenCheckRequest).toHaveBeenCalledOnce();
	});
});
