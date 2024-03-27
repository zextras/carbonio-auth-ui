/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function checkSupportedZextras() {
	return fetch('/zx/auth/supported').then((res) => {
		if (res.status === 404) {
			return { hasZextras: false };
		}
		return { hasZextras: true };
	});
}
