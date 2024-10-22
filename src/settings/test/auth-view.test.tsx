/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@zextras/carbonio-design-system';
import i18next, { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import App from '../auth-view';
import fetchMock from 'jest-fetch-mock';

import { checkSupportedZextras } from '../network/checkSupportedZextras';

export function getAppI18n(): i18n {
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

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: (): any => ({
		attrs: {
			carbonioFeatureOTPMgmtEnabled: 'TRUE',
			zimbraFeatureResetPasswordStatus: undefined
		}
	}),
	t: (key: string): any => key
}));

jest.mock('../network/checkSupportedZextras', () => ({
	checkSupportedZextras: jest.fn()
}));

describe('auth view', () => {
	it('should set change password as active by default when zimbraFeatureResetPasswordStatus is NOT enabled', async () => {
		(checkSupportedZextras as jest.Mock).mockResolvedValue({ isSupported: true });

		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: { response: { values: [] } }
			})
		);

		await act(async () => {
			render(
				<ThemeProvider>
					<I18nextProvider i18n={getAppI18n()}>
						<App />
					</I18nextProvider>
				</ThemeProvider>
			);
		});

		expect(
			within(screen.getByTestId('active-panel')).getByText('changePassword.instruction')
		).toBeInTheDocument();
	});
});
