/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type CheckZextrasSupported = { isSupported: boolean };

export function checkSupportedZextras(): Promise<CheckZextrasSupported> {
	return fetch('/zx/auth/supported').then((res) => {
		if (res.status === 200) {
			return { isSupported: true };
		}
		return { isSupported: false };
	});
}
