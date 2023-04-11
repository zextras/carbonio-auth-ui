/*
 * Copyright (C) 2011-2020 ZeXtras
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Spinner, addSettingsView, t } from '@zextras/carbonio-shell-ui';
import React, { Suspense, lazy, useEffect } from 'react';

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
