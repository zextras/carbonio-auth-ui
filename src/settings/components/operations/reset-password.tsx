/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';

import {
	Button,
	Padding,
	PasswordInput,
	Row,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { useGenericErrorSnackbar } from '../../hooks/use-generic-error-snackbar';
import { resetPasswordRequest } from '../../network/reset-password-request';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Section } from '../shared/section';

export function ResetPassword(): JSX.Element {
	const createSnackbar = useSnackbar();
	const errorSnackbar = useGenericErrorSnackbar();

	const [newPasswordValue, setNewPasswordValue] = useState('');
	const [confirmPasswordValue, setConfirmPasswordValue] = useState('');

	const resetValues = useCallback(() => {
		setNewPasswordValue('');
		setConfirmPasswordValue('');
	}, []);

	const onConfirmClick = useCallback(() => {
		resetPasswordRequest({ password: newPasswordValue }).then((res) => {
			if (!res.Fault) {
				resetValues();
				createSnackbar({
					key: `send_reset`,
					replace: true,
					severity: 'info',
					hideButton: true,
					label: t(
						'settingsAuth.Snackbar.PasswordSuccessfullyReset',
						'Password successfully reset. Session needs to be reloaded'
					),
					autoHideTimeout: 3000
				});
			} else {
				errorSnackbar(res?.Fault?.Reason?.Text);
			}
		});
	}, [createSnackbar, errorSnackbar, newPasswordValue, resetValues, t]);

	const hasMatchError = useMemo(
		() => confirmPasswordValue.length > 0 && newPasswordValue !== confirmPasswordValue,
		[confirmPasswordValue, newPasswordValue]
	);

	return (
		<Section title={t('settingsAuth.Displayer.ResetPassword', 'Reset Password')} divider isDisabled>
			<Row mainAlignment="flex-start" width="fill">
				<Padding bottom="large">
					<Text overflow="break-word">
						{t(
							'settingsAuth.Displayer.CreateANewPasswordToResetIt',
							'Create a new password to reset it.'
						)}
					</Text>
					<Text overflow="break-word">
						{t(
							'settingsAuth.Displayer.WarningSessionRefresh',
							`Clicking "Continue" will invalidate the current session requiring a new login. Make sure to complete every other work before starting this procedure`
						)}
					</Text>
				</Padding>
			</Row>
			<Row mainAlignment="flex-start" width="fill">
				<Row mainAlignment="flex-start" width="50%">
					<PasswordInput
						label={t('settingsAuth.displayerInputField.NewPassword', 'New password')}
						backgroundColor="gray5"
						onChange={(e): void => setNewPasswordValue(e.target.value)}
						value={newPasswordValue}
						width="fill"
					/>
				</Row>
			</Row>
			<Padding top="small" />
			<Row mainAlignment="flex-start" width="fill">
				<Row mainAlignment="flex-start" width="50%">
					<PasswordInput
						label={t('settingsAuth.displayerInputField.ConfirmPassword', 'Confirm password')}
						backgroundColor="gray5"
						onChange={(e): void => setConfirmPasswordValue(e.target.value)}
						value={confirmPasswordValue}
						hasError={hasMatchError}
						description={
							hasMatchError
								? t(
										'settingsAuth.ErrorDescriptionConfirmInput.PasswordDoesNotMatch',
										'Password does not match'
									)
								: ''
						}
						width="fill"
					/>
				</Row>
			</Row>
			<Padding top="large" />
			<Row mainAlignment="flex-start" width="fill">
				<Button
					label={t('settingsAuth.displayerSecondaryButton.Cancel', 'Cancel')}
					type="outlined"
					disabled={false}
					onClick={resetValues}
				/>
				<Padding horizontal="small" />
				<Button
					label={t('settingsAuth.displayerPrimaryButton.Continue', 'Confirm')}
					disabled={!newPasswordValue.length || newPasswordValue !== confirmPasswordValue}
					onClick={onConfirmClick}
				/>
			</Row>
		</Section>
	);
}
