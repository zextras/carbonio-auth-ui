/* eslint-disable react/sort-comp */
/*
 * **** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * **** END LICENSE BLOCK *****
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider, Link, Padding, Row, Text } from '@zextras/zapp-ui';
import { orderBy } from 'lodash';

import { fetchSoap } from './network/fetchSoap';
import { Shell, ColumnFull, ColumnLeft, ColumnRight } from './components/shared/shell';
import { SidebarNavigation } from './components/shared/sidebar-navigation';
import { ChangePassword } from './components/operations/change-password';
import { ExchangeActiveSync } from './components/operations/exchange-active-sync';
import { AppMobile } from './components/operations/app-mobile';
import { OTPAuthentication } from './components/operations/otp-authentication';
import { PoweredByZextras } from './assets/icons/powered-by-zextras';
import { AuthOutline } from './assets/icons/auth-outline';

function Instruction({ instruction, link }) {
	const { t } = useTranslation();

	return (
		<Row orientation="vertical">
			<Padding bottom="medium">
				<AuthOutline />
			</Padding>
			<Padding bottom="medium">
				<Text style={{ textAlign: 'center' }} overflow="break-word" color="secondary">
					{instruction}
				</Text>
				<Text style={{ textAlign: 'center' }} overflow="break-word" color="secondary">
					{t('instructions.needInfo')}
				</Text>
			</Padding>
			<Link href={link} target="_blank">
				<u>{t('buttons.click')}</u>
			</Link>
		</Row>
	);
}

function SideBar({ activeTab, setActiveTab }) {
	const { t } = useTranslation();
	const links = [
		{
			name: 'changepassword',
			label: t('changePassword.title'),
			view: ChangePassword,
			instruction: t('instruction.changePassword'),
			link: 'https://docs.zextras.com/suite/html/auth.html#auth-change-pass'
		},
		{
			name: 'activesync',
			label: t('easAuth.label'),
			view: ExchangeActiveSync,
			instruction: t('instruction.eas'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-text-code'
		},
		{
			name: 'mobile',
			label: t('appMobile.title'),
			view: AppMobile,
			instruction: t('instruction.mobile'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-qr-code'
		},
		{
			name: 'otp',
			label: t('setNewOtpLabel.title'),
			view: OTPAuthentication,
			instruction: t('instruction.otp'),
			link: 'https://docs.zextras.com/suite/html/auth.html#create-new-credentials-otp'
		}
	];

	useEffect(() => {
		/* eslint-disable react-hooks/exhaustive-deps */
		setActiveTab(links[0]);
	}, []);

	return (
		<Row
			orientation="vertical"
			mainAlignment="space-between"
			padding={{ right: 'large' }}
			height="100%"
		>
			<Row>
				<Row width="100%" mainAlignment="flex=start" padding={{ all: 'small' }}>
					<Padding right="small">
						<AuthOutline size={24} />
					</Padding>
					<Text>AUTH</Text>
				</Row>
				{activeTab && (
					<SidebarNavigation links={links} activeTab={activeTab} setActiveTab={setActiveTab} />
				)}
			</Row>
			<Row width="100%" mainAlignment="flex-start">
				<Divider color="gray3" />
				<PoweredByZextras />
			</Row>
		</Row>
	);
}

function ActiveTab({ activeTab }) {
	const [passwords, setPasswords] = useState([]);

	useEffect(() => {
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
	}, []);

	return <activeTab.view passwords={passwords} setPasswords={setPasswords} />;
}

export default function App() {
	const [activeTab, setActiveTab] = useState();

	return (
		<Shell>
			<SideBar activeTab={activeTab} setActiveTab={setActiveTab} />
			<ColumnFull mainAlignment="space-between" takeAvailableSpace>
				<ColumnLeft
					width="calc(60% - 100px)"
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					{activeTab && <ActiveTab activeTab={activeTab} />}
				</ColumnLeft>
				<ColumnRight width="calc(40% + 100px)">
					<Instruction
						instruction={activeTab && activeTab.instruction}
						link={activeTab && activeTab.link}
					/>
				</ColumnRight>
			</ColumnFull>
		</Shell>
	);
}
