/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback } from 'react';

import {
	Button,
	Container,
	Input,
	Modal,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { QRCodeSVG } from 'qrcode.react';

import { formatCountdown, useCountdown } from '../../hooks/use-countdown';
import { MOBILE_QR_TIMEOUT_SECONDS } from '../../hooks/use-mobile-qr-polling';
import { ActionButton, type QrStepName } from '../shared/action-button';
import { BigIcon } from '../shared/big-icon';
import { CopyQrCodeButton } from '../shared/copy-qr-code-button';
import { ErrorMessage } from '../shared/error-message';

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
};

type MobileQrModalProps = {
	open: boolean;
	step: QrStepName;
	authDescription: string;
	setAuthDescription: (value: string) => void;
	newQrCodeResp?: QrCodeProps;
	formatError: string;
	setStep: (value: QrStepName) => void;
	onClose: (showSnackbar?: boolean) => void;
	onCreate: () => void;
};

export function MobileQrModal({
	open,
	step,
	authDescription,
	setAuthDescription,
	newQrCodeResp,
	formatError,
	setStep,
	onClose,
	onCreate
}: Readonly<MobileQrModalProps>): ReactElement {
	const isQrCodeV2 = newQrCodeResp?.qrcode_data?.version === QR_CODE_VERSION_V2;
	const isShowingV2QrCode = open && step === 'generate_qrcode' && isQrCodeV2;

	// The countdown runs purely off the QR code being displayed, so it never depends on the
	// shape of the credential payload.
	const remainingSeconds = useCountdown(MOBILE_QR_TIMEOUT_SECONDS, isShowingV2QrCode);
	const isQrCodeExpired = isQrCodeV2 && remainingSeconds === 0;
	const isCountdownWarning = remainingSeconds <= COUNTDOWN_WARNING_THRESHOLD_SECONDS;

	const handleOnGenerateQrcode = useCallback((): void => {
		setStep('generate_qrcode');
		onCreate();
	}, [setStep, onCreate]);

	return (
		<Modal
			title={t('appMobile.new', 'Mobile Apps | New Authentication')}
			open={open}
			onClose={(): void => onClose(false)}
			customFooter={
				<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
					{step === 'generate_qrcode' && newQrCodeResp ? (
						<Padding left="small">
							<Button
								label={t('buttons.close', 'Close')}
								onClick={(): void => onClose()}
								color="secondary"
							/>
						</Padding>
					) : (
						<>
							<Button
								label={t('buttons.close', 'Close')}
								onClick={(): void => onClose()}
								color="secondary"
							/>
							<Padding left="small">
								<ActionButton
									step={step}
									createDisabled={authDescription === '' || formatError !== ''}
									onCreate={handleOnGenerateQrcode}
									onDelete={(): void => {}}
									onDone={(): void => onClose(true)}
								/>
							</Padding>
						</>
					)}
				</Row>
			}
		>
			<Container padding="2rem">
				{step === 'set_label' && (
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
				{step === 'generate_qrcode' && newQrCodeResp && (
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
											<CopyQrCodeButton qrCodeData={newQrCodeResp.qrcode_data} />
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
			</Container>
		</Modal>
	);
}
