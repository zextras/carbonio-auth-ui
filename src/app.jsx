/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Suspense, lazy, useEffect } from 'react';

import { Spinner, addSettingsView, t, upsertApp } from '@zextras/carbonio-shell-ui';
import { AUTH_APP_ID } from './constants';

const LazyAuth = lazy(() => import(/* webpackChunkName: "settings-view" */ './settings/auth-view'));

const Auth = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazyAuth {...props} />
	</Suspense>
);

export default function App() {
	useEffect(() => {
		const label = t('label.app_name', 'Auth');
		upsertApp({
			name: AUTH_APP_ID,
			display: label,
			description: t('label.app_description', 'Auth web module')
		});
		addSettingsView({
			route: 'auth',
			label,
			component: Auth
		});
	}, []);
	return null;
}
