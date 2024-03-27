/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { isNil, omitBy } from 'lodash';

export const setRecoveryAccountRequest = ({
	op,
	recoveryAccount,
	recoveryAccountVerificationCode
}: {
	op: string;
	recoveryAccount?: string;
	recoveryAccountVerificationCode?: string;
}): Promise<any> =>
	soapFetch(
		'SetRecoveryAccount',
		omitBy(
			{
				_jsns: 'urn:zimbraMail',
				op,
				recoveryAccount,
				recoveryAccountVerificationCode
			},
			isNil
		)
	);
