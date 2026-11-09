/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useState } from 'react';

/**
 * Counts down from `durationInSeconds` to 0 while `active` is true.
 * Restarting happens whenever `active` transitions to true or the duration changes.
 */
export function useCountdown(durationInSeconds: number, active: boolean): number {
	const [remainingSeconds, setRemainingSeconds] = useState(durationInSeconds);

	useEffect(() => {
		if (!active) {
			setRemainingSeconds(durationInSeconds);
			return undefined;
		}
		setRemainingSeconds(durationInSeconds);
		const deadline = Date.now() + durationInSeconds * 1000;
		const intervalId = setInterval(() => {
			const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
			setRemainingSeconds(left);
			if (left === 0) {
				clearInterval(intervalId);
			}
		}, 1000);
		return (): void => clearInterval(intervalId);
	}, [durationInSeconds, active]);

	return remainingSeconds;
}

export function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
