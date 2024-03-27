/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable camelcase */
/* disabled camelcase for NewPasswordProps */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useState, useMemo } from 'react';

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
import { t } from '@zextras/carbonio-shell-ui';
import { orderBy, isEmpty } from 'lodash';

// @ts-ignore
import { fetchSoap } from '../../network/fetchSoap';
// @ts-ignore
import { BigIcon } from '../shared/big-icon';
// @ts-ignore
import { ErrorMessage } from '../shared/error-message';
// @ts-ignore
import { Section } from '../shared/section';
// @ts-ignore
import { copyToClipboard, formatDate, objToBase64 } from '../utils';
// @ts-ignore

const stepsNames = {
	set_label: 'set_label',
	generate_password: 'generate_password',
	delete_password: 'delete_password'
};

type PasswordProps = {
	generated: number;
	created: Date;
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

type AppDesktopProps = {
	passwords: Array<PasswordProps>;
	setPasswords: (arg: Array<PasswordProps>) => void;
};

type NewPasswordProps = {
	qrcode_data: {
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

export function AppDesktop({ passwords, setPasswords }: AppDesktopProps): ReactElement {
	const [showModal, setShowModal] = useState(false);
	const [step, setStep] = useState(stepsNames.set_label);
	const [authDescription, setAuthDescription] = useState('');
	const [newPasswordResp, setNewPasswordResp] = useState<NewPasswordProps | undefined>();
	const [selectedPassword, setSelectedPassword] = useState();
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
				p.services[0].service === 'DesktopApp' &&
					acc.push({
						id: p.id,
						columns: [
							p.label,
							p.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled'),
							p.services[0].service === 'EAS'
								? t('easAuth.label', 'Exchange ActiveSync')
								: t('appDesktop.label', 'Desktop Applications'),
							formatDate(p.created)
						],
						clickable: true
					});
				return acc;
			}, []),
		[passwords]
	);

	const updatePasswords = (): void =>
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

	const handleOnGenerateQrcode = (): void =>
		fetchSoap('AddCredentialRequest', {
			_jsns: 'urn:zextrasClient',
			label: authDescription,
			qrcode: true,
			services: 'DesktopApp'
		}).then(
			(res: {
				response: { ok: boolean; response?: NewPasswordProps; value?: NewPasswordProps };
			}) => {
				if (res.response.ok) {
					setNewPasswordResp(res.response.value || res.response.response);
					updatePasswords();
				}
			}
		);

	const handleOnDeletePassword = (): void =>
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
		showSnackbar &&
			createSnackbar({
				key: '1',
				type: 'success',
				label: t(
					'appDesktop.success',
					'New Desktop App password enabled successfully. Passwords list has been updated.'
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
					label={t('common.createToken', 'Create token')}
					disabled={authDescription === ''}
					onClick={(): void => {
						setStep(stepsNames.generate_password);
						handleOnGenerateQrcode();
					}}
				/>
			);
		}
		if (step === stepsNames.generate_password) {
			return (
				<Button
					label={t('buttons.done', 'Close')}
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
			<Section title={t('appDesktop.title', 'Desktop Apps')} divider>
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
								<Padding top="large">
									<Text color="secondary">
										{t('appDesktop.empty', 'The Desktop Apps list is empty.')}
									</Text>
								</Padding>
							</Container>
						)}
					</Padding>
				</Container>
			</Section>
			<Modal
				size="medium"
				title={t('appDesktop.new', 'Desktop Apps | New Authentication')}
				open={showModal}
				onClose={(): void => handleOnClose(false)}
				customFooter={
					<Row width="100%" mainAlignment="flex-end" crossAlignment="flex-end">
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
					</Row>
				}
			>
				<Container padding="2rem">
					{step === stepsNames.set_label && (
						<Container padding="2rem 0 0">
							<Input
								label={t('setNewToken.authenticationDescription', 'Authentication description')}
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
										'appDesktop.descriptionHelp',
										'Description will help you remember where this Desktop Apps Authentication is used.'
									)}
								</Text>
							</Padding>
						</Container>
					)}
					{step === stepsNames.generate_password && newPasswordResp && (
						<Container>
							<Text>{t('setNewToken.successfully', 'Token generated successfully.')}</Text>
							<Padding vertical="large">
								<Row
									width="fit"
									padding={{ all: 'large' }}
									mainAlignment="center"
									crossAlignment="center"
								>
									<Row width="fit" padding={{ right: 'small' }}>
										<Input
											value={objToBase64(newPasswordResp.qrcode_data)}
											backgroundColor="gray5"
											width="fit"
											borderColor="gray5"
										/>
									</Row>
									<Button
										label={t('common.copyToken', 'copy Token')}
										type="outlined"
										onClick={(): void => {
											// eslint-disable-next-line max-len
											copyToClipboard(objToBase64(newPasswordResp.qrcode_data));
											createSnackbar({
												key: '2',
												label: t('common.tokenCopied', 'Token copied successfully')
											});
										}}
									/>
								</Row>
							</Padding>
							<Text weight="bold">
								{t('newOtp.warning', "Warning: you'll be able to copy this token just once.")}
							</Text>
							<Text>
								{t(
									'newOtp.copy_token',
									'Use this token to authenticate your Desktop Sync account.'
								)}
							</Text>
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
		</>
	);
}
