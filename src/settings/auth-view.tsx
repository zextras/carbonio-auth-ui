/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Divider, Link, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { compact, orderBy } from 'lodash';
import { Trans } from 'react-i18next';

import { AuthOutline } from './assets/icons/auth-outline';
import { AppMobile } from './components/operations/app-mobile';
import { ChangePassword } from './components/operations/change-password';
import { ExchangeActiveSync } from './components/operations/exchange-active-sync';
import { OTPAuthentication } from './components/operations/otp-authentication';
import { RecoveryPassword } from './components/operations/recovery-password';
import { ResetPassword } from './components/operations/reset-password';
import { usePasswordPolicy } from './components/shared/password-policy';
import { SidebarNavigation } from './components/shared/sidebar-navigation';
import { checkSupportedZextras } from './network/checkSupportedZextras';
import { fetchSoap } from './network/fetchSoap';
import { Password, Tab } from './types';

const ColumnRight = styled(Row)`
	width: ${({ theme, width }): string => `calc(${width} - ${theme.sizes.padding.large})`};
`;

function Instruction({
	instruction,
	link
}: Readonly<{
	instruction: React.ReactNode;
	link?: string;
}>): React.JSX.Element {
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

function useAuthTabs(): {
	links: Tab[];
	linksWithoutZextras: Tab[];
	otpAuthenticationItem: Tab | undefined;
} {
	const { attrs } = useUserSettings();
	const {
		carbonioFeatureOTPMgmtEnabled,
		zimbraFeatureMobileSyncEnabled,
		carbonioFeatureMailsAppEnabled
	} = attrs;
	const { canChangePassword, resetEnabled } = usePasswordPolicy();
	const isRecoveryAddressFeatureEnabled = resetEnabled;

	const changePasswordItem = {
		name: 'changepassword',
		label: t('changePassword.title', 'Change Password'),
		view: ChangePassword,
		instruction: (
			<Trans
				t={t}
				i18nKey="instruction.changePassword"
				components={{ br: <br /> }}
				defaults="Here you can change your password.<br>For more information, contact your administrator."
			/>
		)
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

	const easItem = useMemo(
		() =>
			canChangePassword && zimbraFeatureMobileSyncEnabled === 'enabled'
				? {
						name: 'activesync',
						label: t('easAuth.label', 'Exchange ActiveSync'),
						view: ExchangeActiveSync,
						instruction: t(
							'instruction.eas',
							'Here you can manage your Exchange ActiveSync password.'
						),
						link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-eas'
					}
				: undefined,
		[canChangePassword, zimbraFeatureMobileSyncEnabled]
	);

	const mobileItem = useMemo(
		() =>
			canChangePassword && carbonioFeatureMailsAppEnabled === 'TRUE'
				? {
						name: 'mobile',
						label: t('appMobile.title', 'Mobile Apps'),
						view: AppMobile,
						instruction: t('instruction.mobile', 'Here you can manage Mobile App password.'),
						link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-mobile-apps'
					}
				: undefined,
		[canChangePassword, carbonioFeatureMailsAppEnabled]
	);

	const links = compact([
		...linksWithoutZextras,
		recoveryPasswordItem,
		easItem,
		mobileItem,
		otpAuthenticationItem
	]);

	return { links, linksWithoutZextras, otpAuthenticationItem };
}

function SideBar({
	activeTab,
	setActiveTab,
	hasZextras,
	links,
	linksWithoutZextras
}: Readonly<{
	activeTab: Tab | undefined;
	setActiveTab: (activeTab: Tab) => void;
	hasZextras: boolean;
	links: Tab[];
	linksWithoutZextras: Tab[];
}>): React.JSX.Element {
	useEffect(() => {
		const availableLinks = hasZextras ? links : linksWithoutZextras;
		// Check for section query parameter
		const urlParams = new URLSearchParams(globalThis.location.search);
		const section = urlParams.get('section');
		if (section) {
			const targetTab = availableLinks.find((link) => link.name === section);
			if (targetTab) {
				setActiveTab(targetTab);
				return;
			}
		}
		setActiveTab(availableLinks[0]);
		// putting depencency results in first tab to be always active
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasZextras]);

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

function ActiveTab({ activeTab }: Readonly<{ activeTab: Tab }>): React.JSX.Element {
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

	const { links, linksWithoutZextras } = useAuthTabs();

	const checkHasZextras = useCallback(async () => {
		const response = await checkSupportedZextras();
		setHasZextras(response.isSupported);
	}, []);

	useEffect(() => {
		checkHasZextras();
	}, [checkHasZextras]);

	const occupyFull = useMemo(() => window.innerWidth <= 1800, []);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="100%"
			background="gray5"
			padding={{ all: 'large' }}
		>
			<SideBar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				hasZextras={hasZextras}
				links={links}
				linksWithoutZextras={linksWithoutZextras}
			/>
			<Row
				width="100%"
				height="100%"
				data-testid="active-panel"
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row
					height="100%"
					width={`${occupyFull ? '100%' : 'calc(60% - 6.25rem)'} `}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					{activeTab && <ActiveTab activeTab={activeTab} />}
				</Row>
				{!occupyFull && (
					<ColumnRight width="calc(40% + 6.25rem)" height="100%">
						{activeTab?.instruction && (
							<Instruction instruction={activeTab?.instruction} link={activeTab?.link} />
						)}
					</ColumnRight>
				)}
			</Row>
		</Container>
	);
}
