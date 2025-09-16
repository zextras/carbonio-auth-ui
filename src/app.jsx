/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { Suspense, lazy, useEffect } from 'react';

import { Container, Spinner } from '@zextras/carbonio-design-system';
import { addSettingsView, t, addRoute } from '@zextras/carbonio-shell-ui';

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
	useEffect(() => {
		addRoute({
			route: 'chats',
			visible: true,
			label: 'chats',
			primaryBar: 'WscOutline',
			appView: <div>test</div>
		});
	}, []);

	useEffect(() => {
		addSettingsView({
			route: 'auth',
			label: t('label.app_name', 'Auth'),
			component: Auth
		});
	}, []);
	return null;
}
