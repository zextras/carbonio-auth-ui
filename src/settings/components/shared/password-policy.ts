/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useChangePasswordURL, useUserSettings } from '@zextras/carbonio-shell-ui';

export type PasswordPolicy = {
	isPasswordLocked: boolean;
	canChangePassword: boolean;
	externalUrl: string | undefined;
	resetEnabled: boolean;
};

export function usePasswordPolicy(): PasswordPolicy {
	const { attrs } = useUserSettings();
	const rawUrl = useChangePasswordURL();

	const externalUrl =
		typeof rawUrl === 'string' && rawUrl.trim().length > 0 ? rawUrl.trim() : undefined;

	return {
		isPasswordLocked: attrs?.zimbraPasswordLocked === 'TRUE',
		canChangePassword: attrs?.zimbraFeatureChangePasswordEnabled === 'TRUE',
		externalUrl,
		resetEnabled: attrs?.zimbraFeatureResetPasswordStatus === 'enabled'
	};
}
