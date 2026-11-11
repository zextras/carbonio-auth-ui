/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Button,
	Container,
	Padding,
	Row,
	Table,
	Text,
	useSnackbar
} from '@zextras/carbonio-design-system';
import { getUserAccount, t } from '@zextras/carbonio-shell-ui';
import { isEmpty, orderBy } from 'lodash';

import { MobileQrDeleteModal } from './mobile-qr-delete-modal';
import { MobileQrModal, MobileQrValidationModal } from './mobile-qr-modal';
import { EmptyState } from '../../assets/icons/empty-state';
import { useCountdown } from '../../hooks/use-countdown';
import { MOBILE_QR_TIMEOUT_SECONDS, useMobileQrPolling } from '../../hooks/use-mobile-qr-polling';
import { fetchSoap } from '../../network/fetchSoap';
import { MobileQrMobileResponseValue } from '../../network/mobile-qr-credential';
import { ViewProps } from '../../types';
import { Section } from '../shared/section';
import { stepsNames, type StepName, type QrStepName } from '../shared/steps-names';
import { formatDateUsingLocale } from '../utils';

const QR_CODE_VERSION_V2 = 'V2';
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
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [step, setStep] = useState<StepName>(stepsNames.set_label);
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
							t('appMobile.label', 'Mobile Applications'),
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
		setShowDeleteModal(false);
		setStep('set_label');
		setAuthDescription('');
		setQrToken('');
		showSnackbar &&
			createSnackbar({
				key: '1',
				severity: 'success',
				label: t(
					'appMobile.create.success',
					'New Mobile App Authentication enabled successfully. Authentication list has been updated.'
				)
			});
	};

	const handleOnCloseDelete = (): void => {
		handleOnClose();
	};

	const handleOnDelete = (): void => {
		handleOnDeletePassword();
		handleOnClose();
		createSnackbar({
			key: '1',
			severity: 'success',
			label: t(
				'appMobile.delete.success',
				'Mobile App Authentication deleted successfully. Authentication list has been updated.'
			)
		});
	};

	const isQrCodeV2 = newQrCodeResp?.qrcode_data?.version === QR_CODE_VERSION_V2;
	const isShowingV2QrCode =
		showModal && step === stepsNames.generate_qrcode && isQrCodeV2 && !mobileQrDetails;

	// The countdown runs purely off the QR code being displayed, so it never depends on the
	// shape of the credential payload.
	const remainingSeconds = useCountdown(MOBILE_QR_TIMEOUT_SECONDS, isShowingV2QrCode);
	const handleOnMobileResponse = useCallback((value: MobileQrMobileResponseValue): void => {
		setShowModal(false);
		setStep('set_label');
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
				'appMobile.create.success',
				'New Mobile App Authentication enabled successfully. Authentication list has been updated.'
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
								setShowDeleteModal(true);
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
			<MobileQrModal
				open={showModal}
				step={step as QrStepName}
				authDescription={authDescription}
				setAuthDescription={setAuthDescription}
				newQrCodeResp={newQrCodeResp}
				formatError={formatError}
				setStep={setStep as (value: QrStepName) => void}
				onClose={handleOnClose}
				onCreate={handleOnGenerateQrcode}
			/>
			<MobileQrDeleteModal
				open={showDeleteModal}
				onClose={handleOnCloseDelete}
				onDelete={handleOnDelete}
			/>
			{mobileQrDetails && (
				<MobileQrValidationModal
					open
					details={mobileQrDetails}
					onClose={handleValidationClose}
					onValidated={handleValidated}
					onGenerateNewQr={() => {
						handleValidationClose();
						setStep('set_label');
					}}
				/>
			)}
		</>
	);
}
