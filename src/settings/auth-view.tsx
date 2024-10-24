/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Container, Divider, Link, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { compact, orderBy } from 'lodash';

import { AuthOutline } from './assets/icons/auth-outline';
import { AppMobile } from './components/operations/app-mobile';
import { ChangePassword } from './components/operations/change-password';
import { ExchangeActiveSync } from './components/operations/exchange-active-sync';
import { OTPAuthentication } from './components/operations/otp-authentication';
import { RecoveryPassword } from './components/operations/recovery-password';
import { ResetPassword } from './components/operations/reset-password';
// @ts-ignore
import { ColumnFull, ColumnLeft, ColumnRight, Shell } from './components/shared/shell';
import { SidebarNavigation } from './components/shared/sidebar-navigation';
import { checkSupportedZextras } from './network/checkSupportedZextras';
import { fetchSoap } from './network/fetchSoap';
import { Password, Tab } from './types';

function Instruction({
	instruction,
	link
}: {
	instruction: string;
	link?: string;
}): React.JSX.Element {
	return (
		<Row orientation="vertical" height="fill" width="fill">
			<Padding bottom="medium">
				<AuthOutline />
			</Padding>
			<Padding bottom="medium">
				<Text style={{ textAlign: 'center' }} overflow="break-word" color="secondary">
					{instruction}
				</Text>
				{link ? (
					<Text style={{ textAlign: 'center' }} overflow="break-word" color="secondary">
						{t('instructions.needInfo')}
					</Text>
				) : (
					<Container height="1.188rem" />
				)}
			</Padding>
			{link ? (
				<Link href={link} target="_blank">
					<u>{t('buttons.click')}</u>
				</Link>
			) : (
				<Container height="1.188rem" />
			)}
		</Row>
	);
}

function SideBar({
	activeTab,
	setActiveTab,
	hasZextras
}: {
	activeTab: Tab | undefined;
	setActiveTab: (activeTab: Tab) => void;
	hasZextras: boolean;
}): React.JSX.Element {
	const { carbonioFeatureOTPMgmtEnabled, zimbraFeatureResetPasswordStatus } =
		useUserSettings().attrs;
	const isRecoveryAddressFeatureEnabled = useMemo(
		() => zimbraFeatureResetPasswordStatus && zimbraFeatureResetPasswordStatus === 'enabled',
		[zimbraFeatureResetPasswordStatus]
	);

	const changePasswordItem = {
		name: 'changepassword',
		label: t('changePassword.title', 'Change Password'),
		view: ChangePassword,
		instruction: t('instruction.changePassword', 'Here you can change your password.'),
		link: 'https://docs.zextras.com/suite/html/auth.html#auth-change-pass'
	};

	const resetPasswordItem = {
		name: 'resetpassword',
		label: t('settingsAuth.Option.ResetPassword', 'reset Password'),
		view: ResetPassword,
		instruction: t(
			'settingsAuth.Column.HereYouCanResetYourPassword',
			'Here you can reset your password.'
		)
	};

	const linksWithoutZextras = [
		isRecoveryAddressFeatureEnabled ? resetPasswordItem : changePasswordItem
	];

	const recoveryPasswordItem = useMemo(
		() =>
			isRecoveryAddressFeatureEnabled
				? {
						name: 'recoveryaddress',
						label: t('recoveryAddress.title', 'Recovery Address'),
						instruction: t(
							'instruction.recoveryaddress',
							'Here you can set and change your mail recovery password.'
						),
						view: RecoveryPassword
					}
				: undefined,
		[isRecoveryAddressFeatureEnabled]
	);

	const otpAuthenticationItem = useMemo(
		() =>
			carbonioFeatureOTPMgmtEnabled === 'TRUE'
				? {
						name: 'otp',
						label: t('setNewOtpLabel.title', 'OTP Authentication'),
						view: OTPAuthentication,
						instruction: t('instruction.otp', 'Here you can manage the OTP Authentication.  '),
						link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-otp'
					}
				: undefined,
		[carbonioFeatureOTPMgmtEnabled]
	);

	const links = compact([
		...linksWithoutZextras,
		recoveryPasswordItem,
		{
			name: 'activesync',
			label: t('easAuth.label', 'Exchange ActiveSync'),
			view: ExchangeActiveSync,
			instruction: t('instruction.eas', 'Here you can manage your Exchange ActiveSync password.'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-eas'
		},
		{
			name: 'mobile',
			label: t('appMobile.title', 'Mobile Apps'),
			view: AppMobile,
			instruction: t('instruction.mobile', 'Here you can manage Mobile App password.'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-mobile-apps'
		},
		otpAuthenticationItem
		/* section is hidden cause not officially supported yet
		ref: AUTH-543
		{
			name: 'desktop',
			label: t('appDesktop.title', 'Desktop Apps'),
			view: AppDesktop,
			instruction: t('instruction.desktop', 'Here you can manage Desktop App password.'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-mobile-apps'
		}, */
	]);

	useEffect(() => {
		setActiveTab(links[0]);
		// putting depencency results in first tab to be always active
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Row
			orientation="vertical"
			mainAlignment="space-between"
			padding={{ right: 'large' }}
			height="100%"
		>
			<Row>
				<Row width="100%" padding={{ all: 'small' }}>
					<Padding right="small">
						<AuthOutline size="1.5rem" />
					</Padding>
					<Text>AUTH</Text>
				</Row>
				{activeTab && (
					<SidebarNavigation
						links={hasZextras ? links : linksWithoutZextras}
						activeTab={activeTab}
						setActiveTab={setActiveTab}
					/>
				)}
			</Row>
			<Row width="100%" mainAlignment="flex-start">
				<Divider color="gray3" />
			</Row>
		</Row>
	);
}

function ActiveTab({ activeTab }: { activeTab: Tab }): React.JSX.Element {
	const [passwords, setPasswords] = useState<Password[]>([]);

	useEffect(() => {
		fetchSoap('ListCredentialsRequest', {
			_jsns: 'urn:zextrasClient'
		}).then((res: { response: { value?: { list: Password[] }; values?: Password[] } }) => {
			if ('Fault' in res) return;
			setPasswords(
				orderBy(
					(res.response.value && res.response.value.list) || res.response.values,
					['created'],
					['desc']
				)
			);
		});
	}, []);

	return <activeTab.view passwords={passwords} setPasswords={setPasswords} />;
}

export default function App(): React.JSX.Element {
	const [activeTab, setActiveTab] = useState<Tab>();
	const [hasZextras, setHasZextras] = useState(false);

	const checkHasZextras = useCallback(async () => {
		const response = await checkSupportedZextras();
		setHasZextras(response.isSupported);
	}, []);

	useEffect(() => {
		checkHasZextras();
	}, [checkHasZextras]);

	const occupyFull = useMemo(() => window.innerWidth <= 1800, []);
	return (
		<Shell>
			<SideBar activeTab={activeTab} setActiveTab={setActiveTab} hasZextras={hasZextras} />
			<ColumnFull data-testid="active-panel" mainAlignment="space-between" takeAvailableSpace>
				<ColumnLeft
					width={`${occupyFull ? '100%' : 'calc(60% - 6.25rem)'} `}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					{activeTab && <ActiveTab activeTab={activeTab} />}
				</ColumnLeft>
				{!occupyFull && (
					<ColumnRight width="calc(40% + 6.25rem)">
						{activeTab?.instruction && (
							<Instruction
								instruction={activeTab && activeTab.instruction}
								link={activeTab && activeTab.link}
							/>
						)}
					</ColumnRight>
				)}
			</ColumnFull>
		</Shell>
	);
}