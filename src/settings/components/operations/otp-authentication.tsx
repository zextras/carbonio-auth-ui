/* eslint-disable @typescript-eslint/ban-ts-comment */

/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
	Button,
	Container,
	Input,
	Modal,
	Padding,
	Row,
	Table,
	Text,
	Theme,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { isEmpty, map, orderBy, reduce } from 'lodash';
import QRCode from 'qrcode.react';
import styled, { useTheme } from 'styled-components';

// @ts-ignore
import { EmptyState } from '../../assets/icons/empty-state';
// @ts-ignore
import { PoweredByZextras } from '../../assets/icons/powered-by-zextras';
import {
	otpCodesLoginPage,
	otpCodesQrCodePin,
	otpCodesTypePin,
	poweredByZextras,
	zextrasLogo
	// @ts-ignore
} from '../../assets/icons/svgAssets';
import { fetchSoap } from '../../network/fetchSoap';
// @ts-ignore
import { Otp, OtpId, OtpTableRow } from '../../types';
import { BigIcon } from '../shared/big-icon';
import { ErrorMessage } from '../shared/error-message';
import { Section } from '../shared/section';
// @ts-ignore
import { copyToClipboard, formatDateUsingLocale } from '../utils';

/* eslint-disable react/jsx-no-bind */

const stepsNames = {
	set_label: 'set_label',
	generate_otp: 'generate_otp',
	show_pin_codes: 'show_pin_codes',
	delete_password: 'delete_password'
};

const StaticCodesContainer = styled(Row)`
	max-width: 21.875rem;
`;
const StaticCodesWrapper = styled.div`
	position: relative;
	width: 100%;
	column-count: 2;
	padding: 1rem;
`;
const StaticCode = styled.label`
	display: block;
	font-family: monospace;
	padding: 0.3125rem 0;
`;

const QRCodeRow = styled(Row)`
	border-radius: ${({ theme }: { theme: Theme }): string => theme.borderRadius};
`;

type PinCode = { code: string };

type LabelsObj = {
	title: string;
	typePin: string;
	login: string;
	eraseUsedPin: boolean;
	howToUse: string;
	whenToUse: string;
	useOnce: string;
	keepInSafePlace: string;
};

export function OTPAuthentication(): React.JSX.Element {
	const theme = useTheme();

	const [otpList, setOTPList] = useState<Otp[]>([]);
	const [selectedOTP, setSelectedOTP] = useState<OtpId>();
	const [showModal, setShowModal] = useState(false);
	const [modalStep, setModalStep] = useState(stepsNames.set_label);
	const [otpLabel, setOTPLabel] = useState('');
	const [qrData, setQrData] = useState();
	const [errorLabel, setErrorLabel] = useState('');
	const [pinCodes, setPinCodes] = useState<Record<string>>([]);

	const userMail = useRef<string>();

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
			otpList.reduce((acc: OtpTableRow[], otp) => {
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
						formatDateUsingLocale(otp.created)
					],
					clickable: true
				});
				return acc;
			}, []),
		[otpList]
	);

	const handleOnGenerateOTP = (): Promise<void> =>
		fetchSoap('GenerateOTPRequest', {
			// eslint-disable-next-line sonarjs/no-duplicate-string
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

	const updateOTPList = (): Promise<void> =>
		fetchSoap('ListOTPRequest', {
			_jsns: 'urn:zextrasClient'
		}).then((res) => {
			res.response.ok && setOTPList(orderBy(res.response.value.list, ['created'], ['desc']));
		});

	const handleOnDeleteOTP = (): Promise<void> =>
		fetchSoap('DeleteOTPRequest', {
			_jsns: 'urn:zextrasClient',
			id: selectedOTP
		}).then((res) => {
			res.response.ok && updateOTPList();
		});

	const handleOnClose = (showSnackbar = false): void => {
		setShowModal(false);
		setModalStep(stepsNames.set_label);
		setOTPLabel('');
		showSnackbar &&
			createSnackbar({
				key: '1',
				severity: 'success',
				label: t('setNewOtpLabel.success')
			});
	};

	function ActionButton(): React.JSX.Element | undefined {
		if (modalStep === stepsNames.set_label) {
			return (
				<Button
					label={t('common.createPassword')}
					disabled={otpLabel === '' || !!errorLabel}
					onClick={(): void => {
						handleOnGenerateOTP();
					}}
				/>
			);
		}
		if (modalStep === stepsNames.generate_otp) {
			return (
				<Button
					label={t('buttons.next')}
					onClick={(): void => {
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
					onClick={(): void => {
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
					onClick={(): void => {
						handleOnClose(true);
						updateOTPList();
					}}
				/>
			);
		}
	}

	function printCodes(codes: Record<string, PinCode>, labelsObj: LabelsObj): void {
		const iframe = document.createElement('iframe');
		document.body.appendChild(iframe);

		const currentDate = new Date();
		const formattedDate = formatDateUsingLocale(currentDate);

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
						padding: 2rem;
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
						padding-top: 1rem;
					}
					
					h2 {
						font-weight: normal;
						font-size: 1.125rem;
					}
					
					.header {
						padding: 1rem;
						margin-top: 1rem;
					}
			
					.header .title {
						font-size: 1rem;
						font-weight: 700;
					}
					
					.main-content {
						padding: 1rem;
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
						border-radius: 0.25rem;
						margin: auto;
					}
			
					.footer {
						position: fixed;
						bottom: 0;
						width: 94%;
						padding: 1rem;
						height: 3rem;
						color: #CFD5DC;
						margin-bottom: 1rem;
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
						padding: 1rem;
						max-width: 90%;
						text-align: center;
					}
					
					.flex-container > div {
						text-align: center;
					}
					
					.margins {
						margin: 2rem;
					}
					
					.oval {
						max-width: 2rem;
						max-height: 2rem;
						padding: 1rem 0.625rem;
						border-radius: 50%;
						background-color: #D5E3F6;
						font-size: 1rem;
						text-align: center;
						align-items: center;
						margin:0 auto 2rem auto;
					}
					
					hr.solid {
						border-top: 0.0625rem; color: #E6E9ED;
						margin: 1rem 0;
					}
				</style>
				<title>Static OTP codes</title>
				</head>
				<body>
					<div class="header">
						<span class="title">${
							labelsObj.title
						}</span><span style="max-width: 7.375rem; float: right; vertical-align: bottom;">${zextrasLogo}</span>
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
						<div class="codes-container codes" style="margin: 1rem;">
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

		iframe?.contentWindow?.document.open('text/html', 'replace');
		iframe?.contentWindow?.document.write(htmlCode);
		iframe?.contentWindow?.document.close();

		iframe?.contentWindow?.print();
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
			<Section title={t('setNewOtpLabel.title')}>
				<Container>
					<Row width="100%" mainAlignment="flex-end">
						<Button
							label={t('common.delete')}
							type="outlined"
							color="error"
							icon="CloseOutline"
							disabled={!selectedOTP || tableRows.length === 0}
							onClick={(): void => {
								setShowModal(true);
								setModalStep(stepsNames.delete_password);
							}}
						/>
						<Padding left="large">
							<Button
								label={t('newOtp.label')}
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
							onSelectionChange={(selected): void => setSelectedOTP(selected[0])}
						/>
						{isEmpty(tableRows) && (
							<Container padding="4rem 0 0">
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
				onClose={(): void => handleOnClose(false)}
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
								onClick={(): void => handleOnClose()}
								color="secondary"
							/>
							<Padding left="small">
								<ActionButton />
							</Padding>
						</Row>
					</Row>
				}
			>
				<Container padding="2rem">
					{modalStep === stepsNames.set_label && (
						<Container padding="2rem 0 0">
							<Input
								label={t('setNewOtpLabel.inputLabel')}
								value={otpLabel}
								onChange={(e): void => setOTPLabel(e.target.value)}
								backgroundColor="gray5"
								hasError={!!errorLabel}
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
								<QRCodeRow
									width="fit"
									background={theme.palette.gray5.regular}
									orientation="vertical"
									padding={{ all: 'large' }}
								>
									<QRCode
										includeMargin
										data-testid="qrcode-password"
										size={150}
										bgColor={theme.palette.gray5.regular}
										value={qrData}
									/>
									<Padding top="large">
										<Button
											label={t('common.copyQrCode')}
											type="outlined"
											onClick={(): void => {
												copyToClipboard(qrData);
												createSnackbar({
													key: '2',
													label: t('common.codeCopied')
												});
											}}
										/>
									</Padding>
								</QRCodeRow>
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
												onClick={(): void =>
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
