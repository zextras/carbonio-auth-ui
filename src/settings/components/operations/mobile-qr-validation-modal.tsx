/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useState } from 'react';

import {
	Button,
	Container,
	Divider,
	Modal,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { MobileQrSuccessModal } from './mobile-qr-success-modal';
import { formatCountdown, useCountdown } from '../../hooks/use-countdown';
import { mobileQrValidateNumberRequest } from '../../network/mobile-qr-credential';
import { type MobileQrMobileResponseValue } from '../../network/mobile-qr-credential';
import { BigIcon } from '../shared/big-icon';
import { DigitCodeInput } from '../shared/digit-code-input';
import {
	COUNTDOWN_WARNING_THRESHOLD_SECONDS,
	MOBILE_QR_TIMEOUT_SECONDS
} from '../shared/mobile-qr-constants';
import { formatDateUsingLocale } from '../utils';

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 3;

function DetailCell({
	label,
	value
}: Readonly<{ label: string; value: string }>): React.JSX.Element {
	return (
		<Container width="50%" crossAlignment="flex-start" gap="0.25rem">
			<Text size="small" color="secondary" style={{ textTransform: 'uppercase' }}>
				{label}
			</Text>
			<Text overflow="break-word">{value}</Text>
		</Container>
	);
}

export function MobileQrValidationModal({
	open,
	details,
	onClose,
	onValidated,
	onGenerateNewQr,
	onQrCodeInvalidated,
	onQrCodeClosed
}: Readonly<{
	open: boolean;
	details: MobileQrMobileResponseValue;
	onClose: () => void;
	onValidated: () => void;
	onGenerateNewQr?: () => void;
	onQrCodeInvalidated?: () => void;
	onQrCodeClosed?: () => void;
}>): React.JSX.Element {
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [failed, setFailed] = useState(false);
	const [validating, setValidating] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const remainingSeconds = useCountdown(MOBILE_QR_TIMEOUT_SECONDS, open);
	const expired = remainingSeconds === 0;
	const attemptsRef = React.useRef(0);
	const submittedCodeRef = React.useRef('');
	const invalidationHandledRef = React.useRef(false);

	React.useEffect(() => {
		if (open) {
			setCode('');
			setError('');
			attemptsRef.current = 0;
			setFailed(false);
			setShowSuccessModal(false);
			setValidating(false);
			submittedCodeRef.current = '';
		}
	}, [open]);

	React.useEffect(() => {
		if (!expired && !failed) {
			invalidationHandledRef.current = false;
			return;
		}
		if (expired) {
			setError('');
		}
		if (!invalidationHandledRef.current) {
			invalidationHandledRef.current = true;
			onQrCodeInvalidated?.();
		}
	}, [expired, failed, onQrCodeInvalidated]);

	const handleValidate = useCallback(
		(enteredCode: string): void => {
			setValidating(true);
			setError('');
			mobileQrValidateNumberRequest(details.label, details.user, Number(enteredCode))
				.then((res) => {
					if (res?.response?.ok) {
						// Show success modal
						setShowSuccessModal(true);
						return;
					}
					// Increment attempts on failure
					attemptsRef.current += 1;
					const newAttempts = attemptsRef.current;
					if (newAttempts >= MAX_ATTEMPTS) {
						setFailed(true);
					} else {
						setError(
							t(
								'mobileQr.validation.attemptsRemaining',
								'Incorrect code. Try again, {{remaining}} attempts remaining.',
								{ remaining: MAX_ATTEMPTS - newAttempts }
							)
						);
					}
					setCode('');
					submittedCodeRef.current = '';
				})
				.catch(() => {
					// Increment attempts on error too
					attemptsRef.current += 1;
					const newAttempts = attemptsRef.current;
					if (newAttempts >= MAX_ATTEMPTS) {
						setFailed(true);
					} else {
						setError(t('error.somethingWrong', 'Something went wrong.'));
					}
					setCode('');
					submittedCodeRef.current = '';
				})
				.finally(() => setValidating(false));
		},
		[details.label, details.user]
	);

	const handleSuccessClose = useCallback((): void => {
		setShowSuccessModal(false);
		onValidated();
	}, [onValidated]);

	const handleClose = useCallback((): void => {
		onQrCodeClosed?.();
		onClose();
	}, [onClose, onQrCodeClosed]);

	React.useEffect(() => {
		if (
			open &&
			!expired &&
			!validating &&
			!failed &&
			!showSuccessModal &&
			code.length === CODE_LENGTH &&
			submittedCodeRef.current !== code
		) {
			submittedCodeRef.current = code;
			handleValidate(code);
		}
	}, [code, open, expired, validating, failed, showSuccessModal, handleValidate]);

	return (
		<>
			<Modal
				title={t('appMobile.new', 'Mobile Apps | New Authentication')}
				open={open && !showSuccessModal}
				onClose={handleClose}
				customFooter={
					<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
						<Button label={t('buttons.close', 'Close')} color="secondary" onClick={handleClose} />
						{(failed || expired) && (
							<Padding left="small">
								<Button
									label={t('mobileQr.generateNewQrCode', 'Generate a new QR code')}
									type="outlined"
									onClick={onGenerateNewQr || onClose}
								/>
							</Padding>
						)}
					</Row>
				}
			>
				<Container padding="1rem" crossAlignment="flex-start" gap="0.5rem">
					{failed ? (
						<Container crossAlignment="center" gap="1rem" padding="2rem 0">
							<BigIcon icon="AlertTriangleOutline" color="error" />
							<Text size="large" weight="bold" style={{ textAlign: 'center' }}>
								{t('mobileQr.validation.failed', 'Verification Failed')}
							</Text>
							<Text overflow="break-word" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
								{t(
									'mobileQr.validation.tooManyAttempts',
									'Too many incorrect codes.\nThis QR code has been discarded\nand has not been enabled.\nGenerate a new QR code to try again.'
								)}
							</Text>
						</Container>
					) : (
						<>
							<Text overflow="break-word" textAlign={'center'} weight={'bold'}>
								{t(
									'mobileQr.validation.descriptionHeader',
									'Enter the code shown in the mobile application'
								)}
							</Text>
							<Text overflow="break-word" textAlign={'center'}>
								{t(
									'mobileQr.validation.description',
									'A device requested access with this QR code. Check the details below and type the code shown on the device.'
								)}
							</Text>
							<Padding vertical="small" width="100%">
								<Container background="gray5" padding="1rem" crossAlignment="flex-start" gap="1rem">
									<Row width="100%" mainAlignment="space-between">
										<Row gap="0.75rem">
											<Container crossAlignment="flex-start" gap="0.25rem">
												<BigIcon icon="SmartphoneOutline" />
												<Text size="medium" color="primary" overflow="break-word" weight={'bold'}>
													{details.mobileClientInfo}
												</Text>
											</Container>
										</Row>
										<Row
											gap="0.5rem"
											padding={{ vertical: 'extrasmall', horizontal: 'small' }}
											borderColor="gray3"
											style={{ borderRadius: '1rem' }}
										>
											<Container
												width="0.5rem"
												height="0.5rem"
												background="success"
												style={{ borderRadius: '50%' }}
											/>
											<Text size="small">
												{t('mobileQr.validation.requestReceived', 'Request received')}
											</Text>
										</Row>
									</Row>
									<Row width="100%" crossAlignment="flex-start">
										<DetailCell
											label={t('mobileQr.validation.ipAddress', 'IP address')}
											value={details.ipAddress}
										/>
										<DetailCell
											label={t('mobileQr.validation.location', 'Location')}
											value={details.location}
										/>
									</Row>
									<Row width="100%" crossAlignment="flex-start">
										<DetailCell
											label={t('mobileQr.validation.requestedAt', 'Requested at')}
											value={formatDateUsingLocale(details.requestedAt)}
										/>
										<DetailCell
											label={t('mobileQr.validation.deviceToken', 'Device token')}
											value={details.mobileGeneratedToken}
										/>
									</Row>
									<Divider />
									<Text size="small" color="secondary" overflow="break-word">
										{t(
											'mobileQr.validation.detailsWarning',
											'If these details are not yours, close this dialog — the pairing request will be discarded.'
										)}
									</Text>
								</Container>
							</Padding>
							<Container crossAlignment="center" gap="0.5rem">
								<DigitCodeInput
									length={CODE_LENGTH}
									value={code}
									disabled={expired || validating || failed}
									focusOnMount
									onChange={setCode}
								/>
								{expired ? (
									<Text size="small" color="error">
										{t(
											'mobileQr.validation.expired',
											'The request expired. Generate a new QR code to try again.'
										)}
									</Text>
								) : (
									<Text
										size="small"
										color={
											remainingSeconds <= COUNTDOWN_WARNING_THRESHOLD_SECONDS
												? 'error'
												: 'secondary'
										}
										data-testid="validation-countdown"
									>
										{`${t('mobileQr.validation.timeLeft', 'Time left:')} ${formatCountdown(remainingSeconds)}`}
									</Text>
								)}
								{error && !failed && (
									<Text
										size="small"
										color="error"
										style={{ whiteSpace: 'pre-line' }}
										data-testid="validation-error"
									>
										{error}
									</Text>
								)}
							</Container>
						</>
					)}
				</Container>
			</Modal>
			<MobileQrSuccessModal
				open={showSuccessModal}
				details={{ mobileClientInfo: details.mobileClientInfo }}
				onClose={handleSuccessClose}
			/>
		</>
	);
}
