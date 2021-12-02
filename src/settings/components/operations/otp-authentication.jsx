import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { fetchSoap } from '../../network/fetchSoap';

import { formatDate, copyToClipboard } from '../utils';
import { ErrorMessage } from '../shared/error-message';
import { PoweredByZextras } from '../../assets/icons/powered-by-zextras';
import { EmptyState } from '../../assets/icons/empty-state';
import {
	zextrasLogo,
	otpCodesLoginPage,
	otpCodesTypePin,
	otpCodesQrCodePin,
	poweredByZextras
} from '../../assets/icons/svgAssets';

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

	const userMail = useRef();

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
		fetchSoap('GenerateOTPRequest', {
			_jsns: 'urn:zextrasClient',
			humanReadable: false,
			labelPrefix: otpLabel
		}).then((res) => {
			if (res.response.ok) {
				const uri = res.response.value.URI;
				setQrData(uri);
				setPinCodes(res.response.value.static_otp_codes);
				setModalStep(stepsNames.generate_otp);
				userMail.current = uri
					? decodeURIComponent(uri.substring(uri.indexOf('-') + 1, uri.indexOf('?')))
					: '';
			} else {
				setErrorLabel(t('error.alreadyInUse'));
			}
		});

	const updateOTPList = () =>
		fetchSoap('ListOTPRequest', {
			_jsns: 'urn:zextrasClient'
		}).then((res) => {
			res.response.ok && setOTPList(orderBy(res.response.value.list, ['created'], ['desc']));
		});

	const handleOnDeleteOTP = () =>
		fetchSoap('DeleteOTPRequest', {
			_jsns: 'urn:zextrasClient',
			id: selectedOTP
		}).then((res) => {
			res.response.ok && updateOTPList();
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

	function printCodes(codes, labelsObj) {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);

		const currentDate = new Date();
		const formattedDate = formatDate(currentDate);

		const htmlCode = `
			<!DOCTYPE html>
			<html lang="en">
				<head>
				<style>
					body {
						font-family: roboto, arial, sans-serif;
					}
				
					.page {
						background: #FFF;
						padding: 32px;
					}
				
					@page {
						size: A4;
						margin: 0;
					}
				
					@media print {
						.page {
						border: initial;
						width: initial;
						min-height: initial;
						background: initial;
						page-break-after: right;
						}
					}
			
					.center {
						margin: auto;
					}
			
					h1.guide {
						text-align: center;
						color: #2B73D2;
						padding-top: 16px;
					}
					
					h2 {
						font-weight: normal;
						font-size: 18px;
					}
					
					.header {
						padding: 16px;
						margin-top: 16px;
					}
			
					.header .title {
						font-size: 16px;
						font-weight: 700;
					}
					
					.main-content {
						padding: 16px;
					}
					
					.columns {
						column-count: 3;
						align-items: center;
					}
		
					.codes {
						font-family: PTMono, monospace;
					}
					
					.container {
						width: 90%;
						margin: auto;
					}
					
					.container-guide {
						width: 90%;
						background-color: #F5F6F8;
						border-radius: 4px;
						margin: auto;
					}
			
					.footer {
						position: fixed;
						bottom: 0;
						width: 94%;
						padding: 16px;
						height: 48px;
						color: #CFD5DC;
						margin-bottom: 16px;
					}
			
					.flex-container {
						display: flex;
						justify-content: center;
						align-content: center;
					}
					.codes-container{
						position: relative;
						width: 100%;
						column-count: 3;
						padding: 16px;
						max-width: 90%;
						text-align: center;
					}
					
					.flex-container > div {
						text-align: center;
					}
					
					.margins {
						margin: 32px;
					}
					
					.oval {
						max-width: 32px;
						max-height: 32px;
						padding: 16px 10px;
						border-radius: 50%;
						background-color: #D5E3F6;
						font-size: 16px;
						text-align: center;
						align-items: center;
						margin:0 auto 32px auto;
					}
					
					hr.solid {
						border-top: 1px; color: #E6E9ED;
						margin: 16px 0;
					}
				</style>
				<title>Static OTP codes</title>
				</head>
				<body>
					<div class="header">
						<span class="title">${
							labelsObj.title
						}</span><span style="max-width: 118px; float: right; vertical-align: bottom;">${zextrasLogo}</span>
						<hr class="solid">
					</div>
					<div class="container">
						<p style="color: #828282;">OTP</p>
						<h2>${otpLabel}${userMail.current ? `-${userMail.current}` : ''}</h2>
						<hr class="solid">
					</div>
					<p style="width:90%; margin:auto;">
						${labelsObj.whenToUse}<br/>
						${labelsObj.useOnce}</br>
						${labelsObj.keepInSafePlace}
					</p>
					<div class="flex-container">
						<div class="codes-container codes" style="margin: 16px;">
							${reduce(codes, (a, v) => `${a}<label>${v.code}</label><br/>`, '')}
						</div>
					</div>
					<div class="container-guide">
						<h1 class="guide">${labelsObj.howToUse}</h1>
						<div class="flex-container" style="max-height: 50%;">
							<div class="margins">
								<div class="oval">1</div>
								<span style="max-height: 100%">${otpCodesLoginPage}</span>
								<p style="text-align:center">${labelsObj.login}</p>
							</div>
							<div class="margins">
								<div class="oval">2</div>
								<span style="max-height: 100%">${otpCodesTypePin}</span>
								<p style="text-align:center">${labelsObj.typePin}</p>
							</div>
							<div class="margins">
								<div class="oval">3</div>
								<span style="max-height: 100%">${otpCodesQrCodePin}</span>
								<p style="text-align:center">${labelsObj.eraseUsedPin}</p>
							</div>
						</div>
					</div>
					<div class="footer">
						<hr class="solid">
						<div style="float:left">
							${poweredByZextras}
						</div>
						<div style="float:right">
							<span>${formattedDate}</span>
						</div>
					</div>
				</body>
			</html>
		`;

		iframe.contentWindow.document.open('text/html', 'replace');
		iframe.contentWindow.document.write(htmlCode);
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
												onClick={() =>
													printCodes(pinCodes, {
														title: t('staticOTPCodes.print.title'),
														whenToUse: t('staticOTPCodes.print.whenToUse'),
														useOnce: t('staticOTPCodes.print.useOnce'),
														keepInSafePlace: t('staticOTPCodes.print.keepInSafePlace'),
														howToUse: t('staticOTPCodes.print.howToUse'),
														login: t('staticOTPCodes.print.login'),
														typePin: t('staticOTPCodes.print.typePin'),
														eraseUsedPin: t('staticOTPCodes.print.eraseUsedPin')
													})
												}
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
