import React, { useState, useEffect, useMemo } from 'react';
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
} from '@zextras/zapp-ui';
import QRCode from 'qrcode.react';
import { isEmpty, map, orderBy, reduce } from 'lodash';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { BigIcon } from '../shared/big-icon';
import { Section } from '../shared/section';
import { fetchSoapZx } from '../../network/fetchSoapZx';

import { formatDate, copyToClipboard } from '../utils';
import { ErrorMessage } from '../shared/error-message';
import { PoweredByZextras } from '../../assets/icons/powered-by-zextras';
import { EmptyState } from '../../assets/icons/empty-state';

/* eslint-disable react/jsx-no-bind */

const stepsNames = {
	set_label: 'set_label',
	generate_otp: 'generate_otp',
	show_pin_codes: 'show_pin_codes',
	delete_password: 'delete_password'
};

const StaticCodesContainer = styled(Row)`
	max-width: 350px;
`;
const StaticCodesWrapper = styled.div`
	position: relative;
	width: 100%;
	column-count: 2;
	padding: 16px;
`;
const StaticCode = styled.label`
	display: block;
	font-family: monospace;
	padding: 4.95px 0;
`;

export function OTPAuthentication() {
	const [otpList, setOTPList] = useState([]);
	const [selectedOTP, setSelectedOTP] = useState();
	const [showModal, setShowModal] = useState(false);
	const [modalStep, setModalStep] = useState(stepsNames.set_label);
	const [otpLabel, setOTPLabel] = useState('');
	const [qrData, setQrData] = useState();
	const [errorLabel, setErrorLabel] = useState('');
	const [pinCodes, setPinCodes] = useState([]);

	const { t } = useTranslation();
	const createSnackbar = useSnackbar();

	const tableHeaders = [
		{
			id: 'code',
			label: t('passwordListLabel.label', 'Description'),
			width: '40%'
		},
		{
			id: 'status',
			label: t('passwordListLabel.status', 'Status'),
			width: '15%'
		},
		{
			id: 'failed_attempts',
			label: t('otpListLabel.failed_attempts', 'Failed Attempts'),
			width: '15%',
			align: 'center'
		},
		{
			id: 'created',
			label: t('passwordListLabel.created', 'Created'),
			width: '30%'
		}
	];

	const tableRows = useMemo(
		/* eslint-disable no-nested-ternary, react-hooks/exhaustive-deps */
		() =>
			otpList.reduce((acc, otp) => {
				acc.push({
					id: otp.id,
					columns: [
						otp.label,
						otp.enabled ? t('passwordListLabel.enabled') : t('passwordListLabel.disabled'),
						<Row key={otp.id}>
							<Text
								weight="bold"
								color={
									otp.failed_attempts > 8
										? 'error'
										: otp.failed_attempts > 6
										? 'warning'
										: otp.failed_attempts > 2
										? 'success'
										: 'info'
								}
							>
								{`${otp.failed_attempts} / 10`}
							</Text>
						</Row>,
						formatDate(otp.created)
					],
					clickable: true
				});
				return acc;
			}, []),
		[otpList]
	);

	const handleOnGenerateOTP = () =>
		fetchSoapZx('GenerateOTPRequest', {
			_jsns: 'urn:zextrasClient',
			humanReadable: false,
			labelPrefix: otpLabel
		}).then((res) => {
			if (res.ok) {
				setQrData(res.value.URI);
				setPinCodes(res.value.static_otp_codes);
				setModalStep(stepsNames.generate_otp);
			} else {
				setErrorLabel(t('error.alreadyInUse'));
			}
		});

	const updateOTPList = () =>
		fetchSoapZx('ListOTPRequest', {
			_jsns: 'urn:zextrasClient'
		}).then((res) => {
			res.ok && setOTPList(orderBy(res.value.list, ['created'], ['desc']));
		});

	const handleOnDeleteOTP = () =>
		fetchSoapZx('DeleteOTPRequest', {
			_jsns: 'urn:zextrasClient',
			id: selectedOTP
		}).then((res) => {
			res.ok && updateOTPList();
		});

	const handleOnClose = (showSnackbar = false) => {
		setShowModal(false);
		setModalStep(stepsNames.set_label);
		setOTPLabel('');
		showSnackbar &&
			createSnackbar({
				key: 1,
				type: 'success',
				label: t('setNewOtpLabel.success')
			});
	};

	function ActionButton() {
		if (modalStep === stepsNames.set_label) {
			return (
				<Button
					label={t('common.createPassword')}
					disabled={otpLabel === '' || errorLabel}
					onClick={() => {
						handleOnGenerateOTP();
					}}
				/>
			);
		}
		if (modalStep === stepsNames.generate_otp) {
			return (
				<Button
					label={t('buttons.next')}
					onClick={() => {
						setModalStep(stepsNames.show_pin_codes);
					}}
				/>
			);
		}
		if (modalStep === stepsNames.delete_password) {
			return (
				<Button
					label={t('buttons.yes')}
					color="error"
					onClick={() => {
						handleOnDeleteOTP();
						handleOnClose();
					}}
				/>
			);
		}
		if (modalStep === stepsNames.show_pin_codes) {
			return (
				<Button
					label={t('buttons.done')}
					onClick={() => {
						handleOnClose(true);
						updateOTPList();
					}}
				/>
			);
		}
	}

	function printCodes(codes) {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);

		const codesHtml = `
		<html>
			<head>
				<title>OTP codes</title>
				<style>
					.codes-container{
						position: relative;
						width: 100%;
						column-count: 2;
						padding: 16px;
						background-color: #d5e3f6;
					}
					label {
						display: block;
						padding: 8px;
					}
				</style>
			</head>
			<body>
				<div class="codes-container">
					${reduce(codes, (a, v) => `${a}<label>${v.code}</label>`, '')}
				</div>
			</body>
		</html>
	`;

		iframe.contentWindow.document.open('text/html', 'replace');
		iframe.contentWindow.document.write(codesHtml);
		iframe.contentWindow.document.close();

		iframe.contentWindow.print();
		setTimeout(() => iframe.remove(), 100);
	}

	useEffect(() => {
		updateOTPList();
	}, []);

	useEffect(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		if (otpLabel.length > 20) {
			setErrorLabel(t('error.maximumLength'));
		} else if (/[^\w-_]/.test(otpLabel)) {
			setErrorLabel(t('error.specialChars'));
		} else {
			setErrorLabel('');
		}
	}, [otpLabel]);

	return (
		<>
			<Section title={t('setNewOtpLabel.title')} divider>
				<Container>
					<Row width="100%" mainAlignment="flex-end">
						<Button
							label={t('common.delete')}
							type="outlined"
							color="error"
							icon="CloseOutline"
							disabled={!selectedOTP || tableRows.length === 0}
							onClick={() => {
								setShowModal(true);
								setModalStep(stepsNames.delete_password);
							}}
						/>
						<Padding left="large">
							<Button
								label={t('newOtp.label')}
								type="outlined"
								icon="Plus"
								onClick={() => setShowModal(true)}
							/>
						</Padding>
					</Row>
					<Padding width="100%" vertical="large">
						<Table
							rows={tableRows}
							headers={tableHeaders}
							showCheckbox={false}
							multiSelect={false}
							onSelectionChange={(selected) => setSelectedOTP(selected[0])}
						/>
						{isEmpty(tableRows) && (
							<Container padding="64px 0 0">
								<EmptyState />
								<Padding top="large">
									<Text color="secondary">{t('setNewOtpLabel.empty')}</Text>
								</Padding>
							</Container>
						)}
					</Padding>
				</Container>
			</Section>
			<Modal
				title={t('setNewOtpLabel.new')}
				open={showModal}
				customFooter={
					<Row width="100%" mainAlignment="space-between" crossAlignment="flex-end">
						<PoweredByZextras />
						<Row>
							<Button
								label={
									modalStep === stepsNames.delete_password
										? t('buttons.cancel')
										: t('buttons.close')
								}
								onClick={() => handleOnClose()}
								color="secondary"
							/>
							<Padding left="small">
								<ActionButton />
							</Padding>
						</Row>
					</Row>
				}
			>
				<Container padding="32px">
					{modalStep === stepsNames.set_label && (
						<Container padding="32px 0 0">
							<Input
								label={t('setNewOtpLabel.inputLabel')}
								value={otpLabel}
								onChange={(e) => setOTPLabel(e.target.value)}
								backgroundColor="gray5"
								hasError={errorLabel}
							/>
							{errorLabel && <ErrorMessage error={errorLabel} />}
							<Padding vertical="medium" style={{ textAlign: 'center' }} />
							<Text>{t('setNewOtpLabel.labelPurpose')}</Text>
							<Text>{t('setNewOtpLabel.maxLength', { maxLength: 20 })}</Text>
							<Text>{t('setNewOtpLabel.prohibitedCharacters')}</Text>
							<Text>{t('setNewOtpLabel.allowedCharacters')}</Text>
						</Container>
					)}
					{modalStep === stepsNames.generate_otp && qrData && (
						<Container>
							<Text>{t('setNewQRCode.successfully')}</Text>
							<Padding vertical="large">
								<Row
									width="fit"
									orientation="vertical"
									background="gray5"
									padding={{ all: 'large' }}
								>
									<QRCode
										data-testid="qrcode-password"
										size={143}
										bgColor="transparent"
										value={qrData}
									/>
									<Padding top="large">
										<Button
											label={t('common.copyQrCode')}
											type="outlined"
											onClick={() => {
												copyToClipboard(qrData);
												createSnackbar({
													key: 2,
													label: t('common.codeCopied')
												});
											}}
										/>
									</Padding>
								</Row>
							</Padding>
							<Text weight="bold">{t('setNewPassword.warningJustOnce')}</Text>
							<Text>{t('newOtp.scan_qr')}</Text>
						</Container>
					)}
					{modalStep === stepsNames.show_pin_codes && (
						<Container>
							<Text>{t('setNewQRCode.successfully')}</Text>
							<Padding top="large">
								<Row mainAlignment="center">
									<StaticCodesContainer background="gray5">
										<StaticCodesWrapper>
											{map(pinCodes, (singleCode) => (
												<StaticCode key={singleCode.code}>{singleCode.code}</StaticCode>
											))}
										</StaticCodesWrapper>
										<Padding bottom="large">
											<Button
												type="outlined"
												label={t('newOtp.printPinCodes')}
												onClick={() => printCodes(pinCodes)}
											/>
										</Padding>
									</StaticCodesContainer>
								</Row>
								<Padding top="large">
									<Text style={{ textAlign: 'center' }} weight="bold">
										{t('newOtp.warning')}
									</Text>
									<Text style={{ textAlign: 'center' }} overflow="break-word">
										{t('newOtp.save_pin')}
									</Text>
								</Padding>
							</Padding>
						</Container>
					)}
					{modalStep === stepsNames.delete_password && (
						<Container>
							<Text overflow="break-word">{t('deletePassword.title')}</Text>
							<Padding vertical="large">
								<BigIcon icon="AlertTriangleOutline" />
							</Padding>
							<Text style={{ textAlign: 'center' }} weight="bold" overflow="break-word">
								{t('deleteOtp.description')}
							</Text>
						</Container>
					)}
				</Container>
			</Modal>
		</>
	);
}
