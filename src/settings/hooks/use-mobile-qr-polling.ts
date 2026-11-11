/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef } from 'react';

import { MOBILE_QR_TIMEOUT_SECONDS } from '../components/shared/mobile-qr-constants';
import {
	MobileQrMobileResponseValue,
	mobileQrMobileResponseRequest,
	mobileQrTokenCheckRequest
} from '../network/mobile-qr-credential';

const POLLING_INTERVAL_MS = 1000;

export type UseMobileQrPollingParams = {
	active: boolean;
	token: string;
	user: string;
	label: string;
	onMobileResponse: (value: MobileQrMobileResponseValue) => void;
};

/**
 * While `active`, sends MobileQRCredentialUITokenCheckRequest to the server once per second.
 * As soon as the token no longer exists (meaning a device consumed the QR code) it fetches the
 * device details through MobileQRCredentialUIMobileResponseRequest and hands them to
 * `onMobileResponse`.
 *
 * The caller owns the expiry countdown and must turn `active` off when it reaches zero.
 */
export function useMobileQrPolling({
	active,
	token,
	user,
	label,
	onMobileResponse
}: UseMobileQrPollingParams): void {
	const onMobileResponseRef = useRef(onMobileResponse);
	onMobileResponseRef.current = onMobileResponse;

	useEffect(() => {
		if (!active) {
			return undefined;
		}

		let cancelled = false;
		let requestInFlight = false;
		let intervalId: ReturnType<typeof setInterval>;
		// Hard stop that does not depend on a re-render turning `active` off.
		const deadline = Date.now() + MOBILE_QR_TIMEOUT_SECONDS * 1000;

		const poll = (): void => {
			if (Date.now() >= deadline) {
				clearInterval(intervalId);
				return;
			}
			if (requestInFlight) {
				return;
			}
			requestInFlight = true;
			mobileQrTokenCheckRequest(token, user)
				.then((res) => {
					if (cancelled || !res?.response?.ok || res.response.value?.tokenExists !== false) {
						return undefined;
					}
					clearInterval(intervalId);
					return mobileQrMobileResponseRequest(label, user).then((mobileRes) => {
						if (!cancelled && mobileRes?.response?.ok && mobileRes.response.value) {
							onMobileResponseRef.current(mobileRes.response.value);
						}
					});
				})
				.catch(() => undefined)
				.finally(() => {
					requestInFlight = false;
				});
		};

		intervalId = setInterval(poll, POLLING_INTERVAL_MS);

		return (): void => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [active, token, user, label]);
}
