/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Suspense, lazy, useEffect } from 'react';

import { Spinner, addSettingsView, t } from '@zextras/carbonio-shell-ui';

const LazyAuth = lazy(() => import(/* webpackChunkName: "settings-view" */ './settings/auth-view'));

const Auth = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazyAuth {...props} />
	</Suspense>
);

export default function App() {
	useEffect(() => {
		addSettingsView({
			route: 'auth',
			label: t('label.app_name', 'Auth'),
			component: Auth
		});
	}, []);
	return null;
}
