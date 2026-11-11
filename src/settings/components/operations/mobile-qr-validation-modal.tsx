/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Container, Modal, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { MobileQrSuccessModal } from './mobile-qr-success-modal';
import { formatCountdown, useCountdown } from '../../hooks/use-countdown';
import {
	MobileQrMobileResponseValue,
	mobileQrValidateNumberRequest
} from '../../network/mobile-qr-credential';
import { BigIcon } from '../shared/big-icon';
import { DigitCodeInput } from '../shared/digit-code-input';
import { formatDateUsingLocale } from '../utils';

export const MOBILE_QR_VALIDATION_TIMEOUT_SECONDS = 30;
const COUNTDOWN_WARNING_THRESHOLD_SECONDS = 30;
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 3;

function DetailRow({
	label,
	value
}: Readonly<{ label: string; value: string }>): React.JSX.Element {
	return (
		<Row width="100%" mainAlignment="space-between" padding={{ vertical: 'extrasmall' }}>
			<Text size="small" color="secondary">
				{label}
			</Text>
			<Text size="small" weight="bold" overflow="break-word">
				{value}
			</Text>
		</Row>
	);
}

export type MobileQrValidationModalProps = {
	open: boolean;
	details: MobileQrMobileResponseValue;
	onClose: () => void;
	onValidated: () => void;
	onGenerateNewQr?: () => void;
};

export function MobileQrValidationModal({
	open,
	details,
	onClose,
	onValidated,
	onGenerateNewQr
}: Readonly<MobileQrValidationModalProps>): React.JSX.Element {
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [failed, setFailed] = useState(false);
	const [validating, setValidating] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const remainingSeconds = useCountdown(MOBILE_QR_VALIDATION_TIMEOUT_SECONDS, open);
	const expired = remainingSeconds === 0;
	const attemptsRef = useRef(0);
	const submittedCodeRef = useRef('');

	useEffect(() => {
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

	useEffect(() => {
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
				onClose={onClose}
				customFooter={
					failed ? (
						<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
							<Button label={t('buttons.close', 'Close')} color="secondary" onClick={onClose} />
							<Padding left="small">
								<Button
									label={t('common.newAuthentication', 'Generate a new QR code')}
									type="outlined"
									onClick={onGenerateNewQr || onClose}
								/>
							</Padding>
						</Row>
					) : (
						<Row width="100%" mainAlignment="flex-end">
							<Button label={t('buttons.close', 'Close')} color="secondary" onClick={onClose} />
						</Row>
					)
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
							<Text overflow="break-word">
								{t(
									'mobileQr.validation.description',
									'A device requested access with this QR code. Check the details below and type the code shown on the device.'
								)}
							</Text>
							<Padding vertical="small" width="100%">
								<Container background="gray5" padding="0.75rem" crossAlignment="flex-start">
									<DetailRow
										label={t('mobileQr.validation.label', 'Description')}
										value={details.label}
									/>
									<DetailRow
										label={t('mobileQr.validation.user', 'Account')}
										value={details.user}
									/>
									<DetailRow
										label={t('mobileQr.validation.requestedAt', 'Requested at')}
										value={formatDateUsingLocale(details.requestedAt)}
									/>
									<DetailRow
										label={t('mobileQr.validation.ipAddress', 'IP address')}
										value={details.ipAddress}
									/>
									<DetailRow
										label={t('mobileQr.validation.location', 'Location')}
										value={details.location}
									/>
									<DetailRow
										label={t('mobileQr.validation.clientInfo', 'Device')}
										value={details.mobileClientInfo}
									/>
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
