/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook } from '@testing-library/react';

import { formatCountdown, useCountdown } from '../use-countdown';

describe('useCountdown', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should remain at the configured duration while inactive', () => {
		const { result } = renderHook(() => useCountdown(10, false));

		act(() => {
			vi.advanceTimersByTime(5000);
		});

		expect(result.current).toBe(10);
	});

	it('should count down to zero and stop the timer', async () => {
		const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
		const { result } = renderHook(() => useCountdown(2, true));

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current).toBe(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current).toBe(0);
		expect(clearIntervalSpy).toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current).toBe(0);
	});

	it('should calculate the remaining time from the deadline', async () => {
		const { result } = renderHook(() => useCountdown(5, true));

		vi.setSystemTime(new Date('2026-01-01T00:00:03.500Z'));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});

		expect(result.current).toBe(1);
	});

	it('should restart when activated and reset when deactivated', async () => {
		const { result, rerender } = renderHook(({ active }) => useCountdown(3, active), {
			initialProps: { active: true }
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current).toBe(2);

		rerender({ active: false });
		expect(result.current).toBe(3);

		rerender({ active: true });
		expect(result.current).toBe(3);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1000);
		});
		expect(result.current).toBe(2);
	});

	it('should restart when the duration changes and clear the timer on unmount', async () => {
		const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
		const { result, rerender, unmount } = renderHook(
			({ duration }) => useCountdown(duration, true),
			{ initialProps: { duration: 5 } }
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(result.current).toBe(3);

		rerender({ duration: 10 });
		expect(result.current).toBe(10);
		unmount();

		expect(clearIntervalSpy).toHaveBeenCalled();
	});
});

describe('formatCountdown', () => {
	it.each([
		[0, '0:00'],
		[5, '0:05'],
		[65, '1:05'],
		[600, '10:00']
	])('should format %i seconds as %s', (seconds, expected) => {
		expect(formatCountdown(seconds)).toBe(expected);
	});
});
