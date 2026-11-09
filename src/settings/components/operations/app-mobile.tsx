/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Input,
	Modal,
	Padding,
	Row,
	Table,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { getUserAccount, t } from '@zextras/carbonio-shell-ui';
import { isEmpty, orderBy } from 'lodash';
import { QRCodeSVG } from 'qrcode.react';

import { EmptyState } from '../../assets/icons/empty-state';
import { formatCountdown, useCountdown } from '../../hooks/use-countdown';
import { MOBILE_QR_TIMEOUT_SECONDS, useMobileQrPolling } from '../../hooks/use-mobile-qr-polling';
import { fetchSoap } from '../../network/fetchSoap';
import { MobileQrMobileResponseValue } from '../../network/mobile-qr-credential';
import { ViewProps } from '../../types';
import { BigIcon } from '../shared/big-icon';
import { ErrorMessage } from '../shared/error-message';
import { Section } from '../shared/section';
import { copyToClipboard, formatDateUsingLocale, objToBase64 } from '../utils';
import { MobileQrValidationModal } from './mobile-qr-validation-modal';

const stepsNames = {
	set_label: 'set_label',
	generate_qrcode: 'generate_qrcode',
	delete_password: 'delete_password'
};

const QR_CODE_VERSION_V2 = 'V2';
const COUNTDOWN_WARNING_THRESHOLD_SECONDS = 30;
type QrCodeProps = {
	qrcode_data: {
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
	list: {
		generated: string;
		created: string;
		label: string;
		id: string;
		services: [
			{
				service: string;
			}
		];
		hash: string;
		enabled: boolean;
		algorithm: string;
	};
};

export function AppMobile({ passwords, setPasswords }: ViewProps): ReactElement {
	const [showModal, setShowModal] = useState(false);
	const [step, setStep] = useState(stepsNames.set_label);
	const [authDescription, setAuthDescription] = useState('');
	const [newQrCodeResp, setnewQrCodeResp] = useState<QrCodeProps | undefined>();
	const [mobileQrDetails, setMobileQrDetails] = useState<MobileQrMobileResponseValue | undefined>();
	const [selectedPassword, setSelectedPassword] = useState();
	const [qrToken, setQrToken] = useState('');
	const createSnackbar = useSnackbar();

	const tableHeaders = [
		{
			id: 'code',
			label: t('passwordListLabel.label', 'Description'),
			width: '30%'
		},
		{
			id: 'status',
			label: t('passwordListLabel.status', 'Status'),
			width: '15%'
		},
		{
			id: 'service',
			label: t('passwordListLabel.service', 'Service'),
			width: '25%'
		},
		{
			id: 'created',
			label: t('passwordListLabel.created', 'Created'),
			width: '30%'
		}
	];

	const tableRows = useMemo(
		() =>
			passwords.reduce((acc: any, p: any) => {
				p.services[0].service === 'MobileApp' &&
					acc.push({
						id: p.id,
						columns: [
							p.label,
							p.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled'),
							p.services[0].service === 'EAS'
								? t('easAuth.label', 'Exchange ActiveSync')
								: t('appMobile.label', 'Mobile Applications'),
							formatDateUsingLocale(p.created)
						],
						clickable: true
					});
				return acc;
			}, []),
		[passwords]
	);

	const updatePasswords = (): Promise<void> =>
		fetchSoap('ListCredentialsRequest', {
			_jsns: 'urn:zextrasClient'
		}).then(
			(res: {
				response: {
					ok: boolean;
					value?: { list?: { created: number } };
					values?: [{ created: number }];
				};
			}) => {
				res.response.ok &&
					setPasswords(
						orderBy(
							res?.response?.value?.list ?? res?.response?.values ?? [],
							['created'],
							['desc']
						)
					);
			}
		);

	const handleOnGenerateQrcode = (): Promise<void> =>
		fetchSoap('AddCredentialRequest', {
			_jsns: 'urn:zextrasClient',
			label: authDescription,
			qrcode: true
		}).then((res: { response: { ok: boolean; response?: QrCodeProps; value?: QrCodeProps } }) => {
			if (res.response.ok) {
				const qrCodeData = res.response.value || res.response.response;
				setnewQrCodeResp(qrCodeData);
				// Store the token from AddCredentialRequest for polling
				if (qrCodeData?.qrcode_data?.token) {
					setQrToken(qrCodeData.qrcode_data.token);
				}
				updatePasswords();
			}
		});

	const handleOnDeletePassword = (): Promise<void> =>
		fetchSoap('RemoveCredentialRequest', {
			_jsns: 'urn:zextrasClient',
			password_id: selectedPassword
		}).then((res: { response: { ok: string } }) => {
			res.response.ok && updatePasswords();
		});

	const handleOnClose = (showSnackbar = false): void => {
		setShowModal(false);
		setStep(stepsNames.set_label);
		setAuthDescription('');
		setQrToken('');
		showSnackbar &&
			createSnackbar({
				key: '1',
				severity: 'success',
				label: t(
					'appMobile.success',
					'New Mobile App password enabled successfully. Passwords list has been updated.'
				)
			});
	};

	const isQrCodeV2 = newQrCodeResp?.qrcode_data?.version === QR_CODE_VERSION_V2;
	const isShowingV2QrCode =
		showModal && step === stepsNames.generate_qrcode && isQrCodeV2 && !mobileQrDetails;

	// The countdown runs purely off the QR code being displayed, so it never depends on the
	// shape of the credential payload.
	const remainingSeconds = useCountdown(MOBILE_QR_TIMEOUT_SECONDS, isShowingV2QrCode);
	const isQrCodeExpired = isQrCodeV2 && remainingSeconds === 0;
	const isCountdownWarning = remainingSeconds <= COUNTDOWN_WARNING_THRESHOLD_SECONDS;

	const handleOnMobileResponse = useCallback((value: MobileQrMobileResponseValue): void => {
		setShowModal(false);
		setStep(stepsNames.set_label);
		setMobileQrDetails(value);
	}, []);

	const qrData = newQrCodeResp?.qrcode_data;

	useMobileQrPolling({
		active: isShowingV2QrCode && remainingSeconds > 0,
		token: qrToken,
		user: qrData?.auth_payload?.user ?? qrData?.auth_payload?.user ?? getUserAccount()?.name ?? '',
		label: authDescription,
		onMobileResponse: handleOnMobileResponse
	});

	const handleValidationClose = useCallback((): void => {
		setMobileQrDetails(undefined);
		setAuthDescription('');
		setnewQrCodeResp(undefined);
		setQrToken('');
	}, []);

	const handleValidated = (): void => {
		setMobileQrDetails(undefined);
		setAuthDescription('');
		setnewQrCodeResp(undefined);
		setQrToken('');
		updatePasswords();
		createSnackbar({
			key: 'mobile-qr-validated',
			severity: 'success',
			label: t(
				'appMobile.success',
				'New Mobile App password enabled successfully. Passwords list has been updated.'
			)
		});
	};

	const formatError = useMemo(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		if (passwords.map((p) => p.label).includes(authDescription)) {
			return t('error.alreadyInUse', 'Already in use. Please choose another description.');
		}
		return '';
	}, [authDescription]);

	function ActionButton(): ReactElement | null {
		if (step === stepsNames.set_label) {
			return (
				<Button
					label={t('common.createPassword', 'Create password')}
					disabled={authDescription === '' || formatError !== ''}
					onClick={(): void => {
						setStep(stepsNames.generate_qrcode);
						handleOnGenerateQrcode();
					}}
				/>
			);
		}
		if (step === stepsNames.generate_qrcode) {
			if (isQrCodeV2) {
				return null;
			}
			return (
				<Button
					label={t('buttons.done', 'Done')}
					onClick={(): void => {
						handleOnClose(true);
					}}
				/>
			);
		}
		if (step === stepsNames.delete_password) {
			return (
				<Button
					label={t('buttons.yes', 'Yes')}
					color="error"
					onClick={(): void => {
						handleOnDeletePassword();
						handleOnClose();
					}}
				/>
			);
		}
		return null;
	}

	return (
		<>
			<Section title={t('appMobile.title', 'Mobile Apps')}>
				<Container>
					<Row width="100%" mainAlignment="flex-end">
						<Button
							label={t('common.delete', 'Delete')}
							type="outlined"
							color="error"
							icon="CloseOutline"
							disabled={!selectedPassword || tableRows.length === 0}
							onClick={(): void => {
								setStep(stepsNames.delete_password);
								setShowModal(true);
							}}
						/>
						<Padding left="large">
							<Button
								label={t('common.newAuthentication', 'New authentication')}
								type="outlined"
								icon="Plus"
								onClick={(): void => setShowModal(true)}
							/>
						</Padding>
					</Row>
					<Padding width="100%" vertical="large">
						<Table
							rows={tableRows}
							headers={tableHeaders}
							showCheckbox={false}
							multiSelect={false}
							onSelectionChange={(selected: any): void => setSelectedPassword(selected[0])}
						/>
						{isEmpty(tableRows) && (
							<Container padding="4rem 0 0">
								<EmptyState />
								<Padding top="large">
									<Text color="secondary">
										{t('appMobile.empty', 'The Mobile Apps list is empty.')}
									</Text>
								</Padding>
							</Container>
						)}
					</Padding>
				</Container>
			</Section>
			<Modal
				title={t('appMobile.new', 'Mobile Apps | New Authentication')}
				open={showModal}
				onClose={(): void => handleOnClose(false)}
				customFooter={
					<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
						{step === stepsNames.generate_qrcode && newQrCodeResp ? (
							<Padding left="small">
								<Button
									label={t('buttons.close', 'Close')}
									onClick={(): void => handleOnClose()}
									color="secondary"
								/>
							</Padding>
						) : (
							<>
								<Button
									label={
										step === stepsNames.delete_password
											? t('buttons.cancel', 'Cancel')
											: t('buttons.close', 'Close')
									}
									onClick={(): void => handleOnClose()}
									color="secondary"
								/>
								<Padding left="small">
									<ActionButton />
								</Padding>
							</>
						)}
					</Row>
				}
			>
				<Container padding="2rem">
					{step === stepsNames.set_label && (
						<Container padding="2rem 0 0">
							<Input
								label={t('setNewPassword.authenticationDescription', 'Authentication description')}
								value={authDescription}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
									setAuthDescription(e.target.value)
								}
								backgroundColor="gray5"
							/>
							{formatError && <ErrorMessage error={formatError} />}
							<Padding vertical="medium">
								<Text style={{ textAlign: 'center' }} overflow="break-word">
									{t(
										'appMobile.descriptionHelp',
										'Description will help you remember where this Mobile Apps Authentication is used.'
									)}
								</Text>
							</Padding>
						</Container>
					)}
					{step === stepsNames.generate_qrcode && newQrCodeResp && (
						<Container>
							<Text style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
								{isQrCodeV2 ? (
									<>
										{isQrCodeExpired
											? t(
													'mobileQr.expired',
													'The request expired. Generate a new QR code to try again.'
												)
											: `${t('appMobile.openAndScan', 'Open the Mobile app\nScan QR code to pair your device.')}`}
									</>
								) : (
									<>{t('setNewQRCode.successfully', 'QR Authentication generated successfully')}</>
								)}
							</Text>
							{!isQrCodeExpired && (
								<>
									<Padding vertical="large">
										<Row
											width="fit"
											orientation="vertical"
											background="gray5"
											padding={{ all: 'large' }}
										>
											<div className="force-white-bg">
												<QRCodeSVG
													data-testid="qrcode-password"
													size={143}
													bgColor="transparent"
													value={JSON.stringify(newQrCodeResp.qrcode_data)}
												/>
											</div>
											<Padding top="large">
												<Button
													label={t('common.copyQrCode', 'Copy QR Code')}
													type="outlined"
													onClick={(): void => {
														copyToClipboard(objToBase64(newQrCodeResp.qrcode_data));
														createSnackbar({
															key: '2',
															label: t('common.codeCopied', 'Code copied successfully')
														});
													}}
												/>
											</Padding>
										</Row>
									</Padding>
									{!isQrCodeV2 ? (
										<Text weight="bold">
											{t('newOtp.warning', "Warning: you'll be able to copy this token just once.")}
										</Text>
									) : (
										<Text style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
											{t(
												'appMobile.waitingForScan',
												'Waiting for the app to scan the code\nThen a 6 digit code will be shown.'
											)}
										</Text>
									)}
								</>
							)}
							{isQrCodeExpired && (
								<Padding vertical="large">
									<BigIcon icon="ClockOutline" color="error" />
								</Padding>
							)}
							{isQrCodeV2 && (
								<Padding top="medium">
									<Text
										size="small"
										color={isCountdownWarning ? 'error' : 'secondary'}
										style={{ textAlign: 'center' }}
										overflow="break-word"
										data-testid="qrcode-countdown"
									>
										{isQrCodeExpired
											? t(
													'mobileQr.expired',
													'The request expired. Generate a new QR code to try again.'
												)
											: `${t('mobileQr.qrIsValidFor', 'This QR code is valid for')} ${formatCountdown(remainingSeconds)}`}
									</Text>
								</Padding>
							)}
						</Container>
					)}
					{step === stepsNames.delete_password && (
						<Container>
							<Text overflow="break-word">
								{t('deletePassword.title', 'Are you sure you want to delete this password?')}
							</Text>
							<Padding vertical="large">
								<BigIcon icon="AlertTriangleOutline" />
							</Padding>
							<Text style={{ textAlign: 'center' }} weight="bold" overflow="break-word">
								{t(
									'deleteOtp.description',
									'All the devices that are using this password are going to be disconnected and they will not be able to authenticate until you provide a new credential set.'
								)}
							</Text>
						</Container>
					)}
				</Container>
			</Modal>
			{mobileQrDetails && (
				<MobileQrValidationModal
					open
					details={mobileQrDetails}
					onClose={handleValidationClose}
					onValidated={handleValidated}
					onGenerateNewQr={() => {
						handleValidationClose();
						setStep(stepsNames.set_label);
					}}
				/>
			)}
		</>
	);
}
