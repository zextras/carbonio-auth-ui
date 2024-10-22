/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import { customRender } from '../../test/test-utils';
import App from '../auth-view';
import { checkSupportedZextras } from '../network/checkSupportedZextras';

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
			customRender(<App />);
		});

		expect(
			within(screen.getByTestId('active-panel')).getByText('changePassword.instruction')
		).toBeInTheDocument();
	});
});
