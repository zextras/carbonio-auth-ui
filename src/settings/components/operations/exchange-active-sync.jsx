/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { isEmpty, orderBy } from 'lodash';
import { fetchSoap } from '../../network/fetchSoap';

import { BigIcon } from '../shared/big-icon';
import { ErrorMessage } from '../shared/error-message';
import { Section } from '../shared/section';
import { formatDate, copyToClipboard } from '../utils';
import { PoweredByZextras } from '../../assets/icons/powered-by-zextras';
import { EmptyState } from '../../assets/icons/empty-state';

/* eslint-disable react/jsx-no-bind */

const stepsNames = {
	set_label: 'set_label',
	generate_password: 'generate_password',
	delete_password: 'delete_password'
};

const TextPasswordContainer = styled(Row)`
	font-family: monospace;
	font-size: 20px;
	background-color: ${({ theme }) => theme.palette.gray5.regular};
`;

export function ExchangeActiveSync({ passwords, setPasswords }) {
	const [authDescription, setAuthDescription] = useState('');
	const [newPasswordResponse, setNewPasswordResponse] = useState();
	const [selectedPassword, setSelectedPassword] = useState();
	const [showModal, setShowModal] = useState(false);
	const [step, setStep] = useState(stepsNames.set_label);
	const createSnackbar = useSnackbar();

	const { t } = useTranslation();

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
		/* eslint-disable react-hooks/exhaustive-deps */
		() =>
			passwords.reduce((acc, p) => {
				p.services[0].service === 'EAS' &&
					acc.push({
						id: p.id,
						columns: [
							p.label,
							p.enabled ? t('common.enabled', 'Enabled') : t('common.disabled', 'Disabled'),
							p.services[0].service === 'EAS' ? t('easAuth.label') : t('appMobile.label'),
							formatDate(p.created)
						],
						clickable: true
					});
				return acc;
			}, []),
		[passwords]
	);

	const updatePasswords = () =>
		fetchSoap('ListCredentialsRequest', {
			_jsns: 'urn:zextrasClient'
		}).then((res) => {
			res.response.ok &&
				setPasswords(
					orderBy(
						(res.response.value && res.response.value.list) || res.response.values,
						['created'],
						['desc']
					)
				);
		});

	const handleOnGeneratePassword = () =>
		fetchSoap('AddCredentialRequest', {
			_jsns: 'urn:zextrasClient',
			label: authDescription,
			qrcode: false
		}).then((res) => {
			if (res.response.ok) {
				setNewPasswordResponse(res.response.value || res.response.response);
				updatePasswords();
			}
		});

	const handleOnDeletePassword = () =>
		fetchSoap('RemoveCredentialRequest', {
			_jsns: 'urn:zextrasClient',
			password_id: selectedPassword
		}).then((res) => {
			res.response.ok && updatePasswords();
		});

	const handleOnClose = (showSnackbar = false) => {
		setShowModal(false);
		setAuthDescription('');
		setStep(stepsNames.set_label);
		showSnackbar &&
			createSnackbar({
				key: 1,
				type: 'success',
				label: t('easAuth.success')
			});
	};

	const formatError = useMemo(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		if (passwords.map((p) => p.label).includes(authDescription)) {
			return t('error.alreadyInUse');
		}
		return '';
	}, [authDescription]);

	function ActionButton() {
		if (step === stepsNames.set_label) {
			return (
				<Button
					label={t('common.createPassword')}
					disabled={authDescription === ''}
					onClick={() => {
						setStep(stepsNames.generate_password);
						handleOnGeneratePassword();
					}}
				/>
			);
		}
		if (step === stepsNames.generate_password) {
			return (
				<Button
					label={t('buttons.done')}
					onClick={() => {
						handleOnClose(true);
					}}
				/>
			);
		}
		if (step === stepsNames.delete_password) {
			return (
				<Button
					label={t('buttons.yes')}
					color="error"
					onClick={() => {
						handleOnDeletePassword();
						handleOnClose();
					}}
				/>
			);
		}
	}

	return (
		<>
			<Section title={t('easAuth.label')} divider>
				<Container>
					<Row width="100%" mainAlignment="flex-end">
						<Button
							label={t('common.delete')}
							type="outlined"
							color="error"
							icon="CloseOutline"
							disabled={!selectedPassword || tableRows.length === 0}
							onClick={() => {
								setShowModal(true);
								setStep(stepsNames.delete_password);
							}}
						/>
						<Padding left="large">
							<Button
								label={t('common.newAuthentication')}
								type="outlined"
								icon="Plus"
								onClick={() => setShowModal(true)}
							/>
						</Padding>
					</Row>
					{tableRows && (
						<Padding width="100%" vertical="large">
							<Table
								rows={tableRows}
								headers={tableHeaders}
								showCheckbox={false}
								multiSelect={false}
								onSelectionChange={(selected) => setSelectedPassword(selected[0])}
							/>
							{isEmpty(tableRows) && (
								<Container padding="64px 0 0">
									<EmptyState />
									<Padding top="large">
										<Text color="secondary">{t('easAuth.empty')}</Text>
									</Padding>
								</Container>
							)}
						</Padding>
					)}
				</Container>
			</Section>
			<Modal
				title={t('easAuth.new')}
				open={showModal}
				onClose={() => handleOnClose(false)}
				customFooter={
					<Row width="100%" mainAlignment="space-between" crossAlignment="flex-end">
						<PoweredByZextras />
						<Row>
							<Button
								label={
									step === stepsNames.delete_password ? t('buttons.cancel') : t('buttons.close')
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
					{step === stepsNames.set_label && (
						<Container padding="32px 0 0">
							<Input
								label={t('setNewPassword.authenticationDescription')}
								value={authDescription}
								onChange={(e) => setAuthDescription(e.target.value)}
								backgroundColor="gray5"
							/>
							{formatError && <ErrorMessage error={formatError} />}
							<Padding vertical="medium">
								<Text style={{ textAlign: 'center' }} overflow="break-word">
									{t('easAuth.helpRemember')}
								</Text>
							</Padding>
						</Container>
					)}
					{step === stepsNames.generate_password && (
						<Container>
							<Text>{t('setNewPassword.successfully')}</Text>
							<Row
								width="100%"
								orientation="horizontal"
								mainAlignment="center"
								crossAlignment="stretch"
								padding={{ vertical: 'large' }}
							>
								<TextPasswordContainer
									padding={{ horizontal: 'large' }}
									width="fit"
									height="auto"
									orientation="horizontal"
								>
									{newPasswordResponse && newPasswordResponse.text_data.password}
								</TextPasswordContainer>
								<Padding left="large">
									<Button
										label={t('common.copyPassword')}
										type="outlined"
										onClick={() => {
											copyToClipboard(
												newPasswordResponse && newPasswordResponse.text_data.password
											);
											createSnackbar({
												key: 1,
												type: 'info',
												label: t('setNewPassword.EASPasswordCopied')
											});
										}}
									/>
								</Padding>
							</Row>
							<Text weight="bold">{t('setNewPassword.warningJustOnce')}</Text>
							<Text style={{ textAlign: 'center' }} overflow="break-word">
								{t('setNewPassword.textDescription')}
							</Text>
						</Container>
					)}
					{step === stepsNames.delete_password && (
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
