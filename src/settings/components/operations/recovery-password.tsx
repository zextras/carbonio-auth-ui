/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useMemo, useState } from 'react';

import {
	Text,
	Input,
	Padding,
	Container,
	Button,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { isValidEmail } from '../../../utils/email';
import { useGenericErrorSnackbar } from '../../hooks/use-generic-error-snackbar';
import { setRecoveryAccountRequest } from '../../network/set-recovery-account-request';
import { Section } from '../shared/section';

export const RecoveryPassword = (): JSX.Element => {
	const createSnackbar = useSnackbar();
	const errorSnackbar = useGenericErrorSnackbar();
	const [t] = useTranslation();

	const { zimbraPrefPasswordRecoveryAddressStatus, zimbraPrefPasswordRecoveryAddress } =
		useUserSettings().prefs;

	const [codeValue, setCodeValue] = useState('');
	const [codeHasError, setCodeHasError] = useState(false);
	const [passwordRecoveryAddress, setPasswordRecoveryAddress] = useState(
		(zimbraPrefPasswordRecoveryAddress as string) ?? ''
	);
	const [recoveryAddressStatus, setRecoveryAddressStatus] = useState(
		zimbraPrefPasswordRecoveryAddressStatus
	);

	const isRecoveryAddressStatusInPending = useMemo(
		() => recoveryAddressStatus === 'pending',
		[recoveryAddressStatus]
	);

	const isRecoveryAddressStatusVerified = useMemo(
		() => recoveryAddressStatus === 'verified',
		[recoveryAddressStatus]
	);

	const onAddressInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setPasswordRecoveryAddress(e.target.value);
	}, []);

	const onCodeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setCodeValue(e.target.value);
	}, []);

	const onSetAddressClick = useCallback(() => {
		setRecoveryAccountRequest({ op: 'sendCode', recoveryAccount: passwordRecoveryAddress }).then(
			(res) => {
				if (!res.Fault) {
					setRecoveryAddressStatus('pending');
					createSnackbar({
						key: `send_recovery`,
						replace: true,
						severity: 'info',
						hideButton: true,
						label: t(
							'snackbar.validation_code_sent',
							'Validation code has been sent to mail address'
						),
						autoHideTimeout: 3000
					});
				} else {
					errorSnackbar();
				}
			}
		);
	}, [createSnackbar, errorSnackbar, passwordRecoveryAddress, t]);

	const onResendCodeClick = useCallback(() => {
		setRecoveryAccountRequest({ op: 'resendCode', recoveryAccount: passwordRecoveryAddress }).then(
			(res) => {
				if (!res.Fault) {
					codeHasError && setCodeHasError(false);
					codeValue && setCodeValue('');
					setRecoveryAddressStatus('pending');
					createSnackbar({
						key: `resend_recovery`,
						replace: true,
						severity: 'info',
						hideButton: true,
						label: t(
							'snackbar.validation_code_resent',
							'Validation code has been resent to mail address'
						),
						autoHideTimeout: 3000
					});
				} else {
					errorSnackbar();
				}
			}
		);
	}, [codeHasError, codeValue, createSnackbar, errorSnackbar, passwordRecoveryAddress, t]);

	const onCancelClick = useCallback(() => {
		setRecoveryAccountRequest({ op: 'reset' }).then((res) => {
			if (!res.Fault) {
				codeHasError && setCodeHasError(false);
				codeValue && setCodeValue('');
				setRecoveryAddressStatus('');
				setPasswordRecoveryAddress('');
				createSnackbar({
					key: `reset_recovery`,
					replace: true,
					severity: 'info',
					hideButton: true,
					label: t('snackbar.reset_recovery_address', 'Recovery address reset successfully'),
					autoHideTimeout: 3000
				});
			} else {
				errorSnackbar();
			}
		});
	}, [codeHasError, codeValue, createSnackbar, errorSnackbar, t]);

	const onContinueClick = useCallback(() => {
		setRecoveryAccountRequest({
			op: 'validateCode',
			recoveryAccountVerificationCode: codeValue
		}).then((res) => {
			if (!res.Fault) {
				codeHasError && setCodeHasError(false);
				codeValue && setCodeValue('');
				setRecoveryAddressStatus('verified');
				createSnackbar({
					key: `set_recovery_address`,
					replace: true,
					severity: 'success',
					hideButton: true,
					label: t('snackbar.set_recovery_address', 'Recovery address set successfully'),
					autoHideTimeout: 3000
				});
			} else {
				if (res.Fault.Detail.Error.Code === 'service.CODE_MISMATCH') {
					setCodeHasError(true);
				}
				errorSnackbar();
			}
		});
	}, [codeHasError, codeValue, createSnackbar, errorSnackbar, t]);

	const isSetAddressButtonDisabled = useMemo(
		() => !isValidEmail(passwordRecoveryAddress) || isRecoveryAddressStatusInPending,
		[isRecoveryAddressStatusInPending, passwordRecoveryAddress]
	);

	return (
		<Section title={t('recoveryAddress.title', 'Recovery Address')}>
			{isRecoveryAddressStatusVerified ? (
				<>
					<Padding top="large" />
					<Container width="100%" crossAlignment="flex-start" gap={'1rem'}>
						<Text overflow="break-word">
							{t(
								'recoveryAddress.status_verified_message',
								`Your recovery address is set. You can easily update it from here.`
							)}
						</Text>
						<Container width="100%" gap={'0.5rem'} mainAlignment="flex-start" orientation={'row'}>
							<Text>{passwordRecoveryAddress}</Text>
							<Button
								type="outlined"
								color="error"
								label={t('button.remove', 'remove')}
								onClick={onCancelClick}
							/>
						</Container>
					</Container>
				</>
			) : (
				<>
					<Container width="100%" crossAlignment="flex-start">
						<Text overflow="break-word">
							{t(
								'recoveryAddress.body_row1',
								`Enter an email address to set as your recovery address.`
							)}
						</Text>
						<Text overflow="break-word">
							{t(
								'recoveryAddress.body_row2',
								`Clicking "Set Address" will initiate email verification. We'll send a confirmation email to the address you provide.`
							)}
						</Text>
					</Container>
					<Padding top={'medium'} />
					<Container width="100%" gap={'0.5rem'} mainAlignment="flex-start" orientation={'row'}>
						<Container width="50%">
							<Input
								label={t('label.enter_recovery_address', 'Enter your recovery address')}
								value={passwordRecoveryAddress}
								onChange={onAddressInputChange}
								disabled={isRecoveryAddressStatusInPending}
							/>
						</Container>
						<Button
							label={t('button.set_recovery_address', 'set address')}
							onClick={onSetAddressClick}
							disabled={isSetAddressButtonDisabled}
						/>
					</Container>
					<Padding vertical={'large'} />
					{isRecoveryAddressStatusInPending && (
						<>
							<Container crossAlignment="flex-start">
								<Text overflow="break-word" weight="bold">
									{t('recoveryAddress.validation_code', `Validation code`)}
								</Text>
								<Padding top="small" />
								<Container width="100%" crossAlignment="flex-start">
									<Text overflow="break-word">
										{t(
											'recoveryAddress.body_row3',
											`Enter the validation code we sent to your email address.`
										)}
									</Text>
									<Text overflow="break-word">
										{t(
											'recoveryAddress.body_row4',
											`Didn't receive the code yet? Click "Resend Code".`
										)}
									</Text>
								</Container>
								<Padding top={'medium'} />
								<Container
									width="100%"
									gap={'0.5rem'}
									mainAlignment="flex-start"
									orientation={'row'}
								>
									<Container width="50%">
										<Input
											label={t('label.enter_code', 'Enter code')}
											value={codeValue}
											onChange={onCodeInputChange}
											hasError={codeHasError}
											description={
												codeHasError ? t('label.invalid_code', 'Code not valid') : undefined
											}
										/>
									</Container>
									{isRecoveryAddressStatusInPending && (
										<Button
											type="outlined"
											label={t('button.resend_code', 'resend code')}
											onClick={onResendCodeClick}
										/>
									)}
								</Container>
							</Container>
							<Padding top={'large'} />
							<Container
								width="100%"
								gap={'0.5rem'}
								mainAlignment={'flex-start'}
								orientation={'row'}
							>
								<Button type="outlined" label={'cancel'} onClick={onCancelClick} />
								<Button
									label={t('button_continue', 'Continue')}
									onClick={onContinueClick}
									disabled={!codeValue?.length}
								/>
							</Container>
						</>
					)}
				</>
			)}
		</Section>
	);
};
