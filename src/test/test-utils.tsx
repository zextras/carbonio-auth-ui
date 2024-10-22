/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render } from '@testing-library/react';
import { ThemeProvider } from '@zextras/carbonio-design-system';
import i18next, { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';

function getAppI18n(): i18n {
	const newI18n = i18next.createInstance();
	newI18n.init({
		lng: 'en',
		fallbackLng: 'en',
		debug: false,
		interpolation: {
			escapeValue: false
		},
		resources: { en: { translation: {} } }
	});
	return newI18n;
}
export function customRender(component: React.JSX.Element): ReturnType<typeof render> {
	return render(
		<ThemeProvider>
			<I18nextProvider i18n={getAppI18n()}>{component}</I18nextProvider>
		</ThemeProvider>
	);
}
