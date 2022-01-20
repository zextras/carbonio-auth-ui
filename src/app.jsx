/*
 * Copyright (C) 2011-2020 ZeXtras
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { lazy, useEffect, Suspense } from 'react';
import { registerAppData, Spinner } from '@zextras/carbonio-shell-ui';

const LazyAuth = lazy(() => import(/* webpackChunkName: "settings-view" */ './settings/auth-view'));

const Auth = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazyAuth {...props} />
	</Suspense>
);

export default function App() {
	console.log(
		'%c AUTH APP LOADED',
		'color: white; background: #8bc34a;padding: 4px 8px 2px 4px; font-family: sans-serif; border-radius: 12px; width: 100%'
	);
	useEffect(() => {
		registerAppData({
			icon: 'AuthOutline',
			views: {
				settings: Auth
			},
			context: {}
		});
	}, []);
	return null;
}
