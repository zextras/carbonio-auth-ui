/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';
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
	legacySoapFetch(
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
