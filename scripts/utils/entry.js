/* eslint-disable no-undef */
/*
 * *** BEGIN LICENSE BLOCK *****
 * Copyright (C) 2011-2021 Zextras
 *
 * The contents of this file are subject to the ZeXtras EULA;
 * you may not use this file except in compliance with the EULA.
 * You may obtain a copy of the EULA at
 * http://www.zextras.com/zextras-eula.html
 * *** END LICENSE BLOCK *****
 */

async function bootApp() {
	const appEntrypoint = await import('app-entrypoint');

	const App = (appEntrypoint && appEntrypoint.default) || appEntrypoint;
	window.__ZAPP_HMR_EXPORT__[PACKAGE_NAME](App);
}

bootApp();

if (module.hot) {
	module.hot.accept('app-entrypoint', bootApp);
}
