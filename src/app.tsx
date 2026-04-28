/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Suspense, lazy, useEffect } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import { addSettingsView, registerActions, t } from '@zextras/carbonio-shell-ui';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { TwoFactorAuthModal } from './components/two-factor-auth-modal';
import { usePasswordPolicy } from './settings/components/shared/password-policy';

const LazyAuth = lazy(() => import(/* webpackChunkName: "auth-view" */ './settings/auth-view'));

const Auth = (): React.JSX.Element => (
	<Suspense
		fallback={
			<Container>
				<Spinner color={'primary'} />
			</Container>
		}
	>
		<LazyAuth />
	</Suspense>
);

export default function App(): React.JSX.Element {
	const navigate = useNavigate();
	const { resetEnabled } = usePasswordPolicy();

	useEffect(() => {
		addSettingsView({
			route: 'auth',
			label: t('label.app_name', 'Auth'),
			component: Auth
		});
		const label = resetEnabled
			? capitalize(t('settingsAuth.Option.ResetPassword', 'Reset password'))
			: capitalize(t('changePassword.title', 'Change password'));

		const section = resetEnabled ? 'resetpassword' : 'changepassword';

		registerActions({
			action: () => ({
				id: 'carbonio-auth-ui',
				label,
				icon: 'LockOutline',
				execute: (): void => navigate(`/settings/auth?section=${section}`, { replace: true }),
				disabled: false,
				group: 'carbonio-auth-ui',
				primary: true
			}),
			id: 'carbonio-auth-ui',
			type: 'account_menu'
		});
	}, [navigate, resetEnabled]);

	return <TwoFactorAuthModal />;
}
