/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2020 ZeXtras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

import React, { lazy, useEffect, Suspense } from 'react';
import { registerAppData, Spinner } from '@zextras/zapp-shell';

const LazySettingsView = lazy(() =>
	import(/* webpackChunkName: "settings-view" */ './settings/settings-view')
);

const SettingsView = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazySettingsView {...props} />
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
				settings: SettingsView
			},
			context: {}
		});
	}, []);
	return null;
}
