/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement } from 'react';

import { Button, useSnackbar } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { copyToClipboard, objToBase64 } from '../utils';

type CopyQrCodeButtonProps = {
	qrCodeData: {
		version?: string;
		auth_method: string;
		auth_payload: {
			password: string;
			user: string;
		};
		auth_endpoint: [
			{
				url: string;
			}
		];
		token?: string;
	};
};

export function CopyQrCodeButton({ qrCodeData }: Readonly<CopyQrCodeButtonProps>): ReactElement {
	const createSnackbar = useSnackbar();

	return (
		<Button
			label={t('common.copyQrCode', 'Copy QR Code')}
			type="outlined"
			onClick={(): void => {
				copyToClipboard(objToBase64(qrCodeData));
				createSnackbar({
					key: 'mobile-qr-code-copied',
					label: t('common.codeCopied', 'Code copied successfully')
				});
			}}
		/>
	);
}
