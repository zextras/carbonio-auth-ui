/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { AccountSettings, useUserSettings } from '@zextras/carbonio-shell-ui';
import fetchMock from '../../test/fetchMock';

import { customRender } from '../../test/test-utils';
import App from '../auth-view';
import { checkSupportedZextras } from '../network/checkSupportedZextras';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn(),
	t: (key: string): any => key
}));

vi.mock('@zextras/carbonio-ui-commons', () => ({
	useHistoryNavigation: vi.fn(() => ({}))
}));

vi.mock('../network/checkSupportedZextras', () => ({
	checkSupportedZextras: vi.fn()
}));

describe('auth view', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should set change password as active by default when zimbraFeatureResetPasswordStatus is NOT enabled', async () => {
		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: true });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		} as unknown as AccountSettings);
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
		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: true });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'enabled'
			}
		} as unknown as AccountSettings);
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
		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: true });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		} as unknown as AccountSettings);
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
		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: false });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		} as unknown as AccountSettings);
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

		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: true });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		} as unknown as AccountSettings);
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

		vi.mocked(checkSupportedZextras).mockResolvedValue({ isSupported: true });
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {
				carbonioFeatureOTPMgmtEnabled: 'TRUE',
				zimbraFeatureResetPasswordStatus: 'disabled'
			}
		} as unknown as AccountSettings);
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
