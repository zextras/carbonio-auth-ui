/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useSnackbar } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

export const useGenericErrorSnackbar = (): ((arg?: string) => void) => {
	const createSnackbar = useSnackbar();
	const [t] = useTranslation();

	return useCallback(
		(label?: string) =>
			createSnackbar({
				key: `send_recovery_error`,
				replace: true,
				type: 'error',
				hideButton: true,
				label: label ?? t('error.somethingWrong', 'Something went wrong.'),
				autoHideTimeout: 3000
			}),
		[createSnackbar, t]
	);
};
