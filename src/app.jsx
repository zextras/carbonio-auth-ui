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
import React, { useEffect, lazy, Suspense } from 'react';

import { registerAppData } from '@zextras/zapp-shell';

const LazySettings = lazy(() => import('./settings'));

const Settings = () => (
	<Suspense fallback={null}>
		<LazySettings />
	</Suspense>
);
export default function App() {
	console.log(
		'%c AUTH LOADED',
		'color: white; background: #8bc34a;padding: 4px 8px 2px 4px; font-family: sans-serif; border-radius: 12px; width: 100%'
	);
	useEffect(() => {
		registerAppData({
			views: {
				settings: Settings
			}
		});
	}, []);

	return null;
}
