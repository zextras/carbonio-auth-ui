/*
 * Copyright (C) 2011-2020 ZeXtras
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, useEffect, Suspense } from 'react';
import { addSettingsView, Spinner } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

const LazyAuth = lazy(() => import(/* webpackChunkName: "settings-view" */ './settings/auth-view'));

const Auth = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazyAuth {...props} />
	</Suspense>
);

export default function App() {
	const [t] = useTranslation();

	useEffect(() => {
		addSettingsView({
			route: 'auth',
			label: t('label.app_name', 'Auth'),
			component: Auth
		});
	}, [t]);
	return null;
}
