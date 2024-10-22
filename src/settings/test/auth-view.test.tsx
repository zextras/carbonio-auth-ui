/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import fetchMock from 'jest-fetch-mock';

import { customRender } from '../../test/test-utils';
import App from '../auth-view';
import { checkSupportedZextras } from '../network/checkSupportedZextras';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: jest.fn(),
	t: (key: string): any => key
}));

jest.mock('../network/checkSupportedZextras', () => ({
	checkSupportedZextras: jest.fn()
}));
describe('auth view', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should set change password as active by default when zimbraFeatureResetPasswordStatus is NOT enabled', async () => {
		(checkSupportedZextras as jest.Mock).mockResolvedValue({ isSupported: true });
		(useUserSettings as jest.Mock).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		});
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: { response: { values: [] } }
			})
		);

		await act(async () => {
			customRender(<App />);
		});

		expect(
			within(screen.getByTestId('active-panel')).getByText('changePassword.instruction')
		).toBeInTheDocument();
	});

	it('should set reset password as active by default when zimbraFeatureResetPasswordStatus is enabled', async () => {
		(checkSupportedZextras as jest.Mock).mockResolvedValue({ isSupported: true });
		(useUserSettings as jest.Mock).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'enabled'
			}
		});
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: { response: { values: [] } }
			})
		);

		await act(async () => {
			customRender(<App />);
		});

		expect(
			within(screen.getByTestId('active-panel')).getByText('settingsAuth.Displayer.ResetPassword')
		).toBeInTheDocument();
	});
});
