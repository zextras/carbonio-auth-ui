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

jest.mock('@zextras/carbonio-ui-commons', () => ({
	useHistoryNavigation: jest.fn(() => ({}))
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

	it('should display EAS, OTP and Mobile APP if advanced supported', async () => {
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

		expect(screen.getByText('easAuth.label')).toBeVisible();
		expect(screen.getByText('appMobile.title')).toBeVisible();
		expect(screen.getByText('setNewOtpLabel.title')).toBeVisible();
	});
	it('should not display EAS, OTP and Mobile APP if advanced not supported', async () => {
		(checkSupportedZextras as jest.Mock).mockResolvedValue({ isSupported: false });
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

		expect(screen.queryByText('easAuth.label')).not.toBeInTheDocument();
		expect(screen.queryByText('appMobile.title')).not.toBeInTheDocument();
		expect(screen.queryByText('setNewOtpLabel.title')).not.toBeInTheDocument();
	});

	it('should set OTP tab as active when section=otp query parameter is present', async () => {
		const originalLocation = globalThis.location;
		Object.defineProperty(globalThis, 'location', {
			value: {
				...originalLocation,
				search: '?section=otp'
			},
			writable: true
		});

		(checkSupportedZextras as jest.Mock).mockResolvedValue({ isSupported: true });
		(useUserSettings as jest.Mock).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		});
		// First fetch for ListCredentialsRequest, second fetch for OTP component
		fetchMock.mockResponse(
			JSON.stringify({
				Body: { response: { values: [] } }
			})
		);

		await act(async () => {
			customRender(<App />);
		});

		// Verify OTP tab is active by checking for its title in the active panel
		expect(
			within(screen.getByTestId('active-panel')).getByText('setNewOtpLabel.title')
		).toBeInTheDocument();

		Object.defineProperty(globalThis, 'location', {
			value: originalLocation,
			writable: true
		});
	});

	it('should fall back to default tab when section query parameter does not match any tab', async () => {
		const originalLocation = globalThis.location;
		Object.defineProperty(globalThis, 'location', {
			value: {
				...originalLocation,
				search: '?section=invalidtab'
			},
			writable: true
		});

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

		Object.defineProperty(globalThis, 'location', {
			value: originalLocation,
			writable: true
		});
	});
});
