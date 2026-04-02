/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Suspense, lazy, useEffect } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import { addSettingsView, registerActions, t } from '@zextras/carbonio-shell-ui';
import { useNavigate } from 'react-router-dom';

import { TwoFactorAuthModal } from './components/two-factor-auth-modal';

const LazyAuth = lazy(() => import(/* webpackChunkName: "settings-view" */ './settings/auth-view'));

const Auth = (props) => (
	<Suspense
		fallback={
			<Container>
				<Spinner color={'primary'} />
			</Container>
		}
	>
		<LazyAuth {...props} />
	</Suspense>
);

export default function App() {
	const navigate = useNavigate();

	useEffect(() => {
		addSettingsView({
			route: 'auth',
			label: t('label.app_name', 'Auth'),
			component: Auth
		});
		registerActions({
			action: () => ({
				id: 'carbonio-auth-ui',
				label: t('changePassword.title','Change password'),
				icon: 'LockOutline',
				execute: () => navigate(`/settings/auth?section=changepassword`, { replace: true }),
				disabled: false,
				group: 'carbonio-auth-ui',
				primary: true
			}),
			id: 'carbonio-auth-ui',
			type: 'account_menu'
		});
	}, [navigate]);

	return <TwoFactorAuthModal />;
}
