/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

export const resetPasswordRequest = ({ password }: { password: string }): Promise<any> =>
	soapFetch('ResetPassword', {
		_jsns: 'urn:zimbraAccount',
		password
	});
