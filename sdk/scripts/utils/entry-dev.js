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

function bootHandlers() {
	const handlersEntrypoint = require('app-handlers');

	const handlers = handlersEntrypoint && handlersEntrypoint.default || handlersEntrypoint;
	window.__ZAPP_HMR_HANDLERS__[PACKAGE_NAME](handlers);
}

if (HAS_HANDLERS) {
	bootHandlers();
}

if (module.hot) {
	if (HAS_HANDLERS) {
		module.hot.accept('app-handlers', bootHandlers);
	}
}

import './entry';
