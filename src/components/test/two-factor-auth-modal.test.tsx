/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import { customRender } from '../../test/test-utils';
import { TwoFactorAuthModal } from '../two-factor-auth-modal';

const mockReplaceHistory = jest.fn();

jest.mock('@zextras/carbonio-shell-ui', () => ({
	t: (key: string, defaultValue: string): string => defaultValue
}));

jest.mock('@zextras/carbonio-ui-commons', () => ({
	useHistoryNavigation: jest.fn(() => ({
		replaceHistory: mockReplaceHistory
	}))
}));

describe('TwoFactorAuthModal', () => {
	const TWO_FACTOR_AUTH_MESSAGE =
		'We introduced the Two-Factor Authentication to improve the security of your account.';

	beforeEach(() => {
		jest.clearAllMocks();
		fetchMock.resetMocks();
	});

	it('should not render modal when carbonioOTPSetupRequired is false', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ carbonioOTPSetupRequired: false }));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});

	it('should not render modal when API returns empty response', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({}));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});

	it('should not render modal when API call fails', async () => {
		fetchMock.mockRejectOnce(new Error('Network error'));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});

	it('should not render modal when API returns non-ok response', async () => {
		fetchMock.mockResponseOnce('', { status: 500 });

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});

	it('should render modal when carbonioOTPSetupRequired is true', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ carbonioOTPSetupRequired: true }));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.getByText(TWO_FACTOR_AUTH_MESSAGE)).toBeInTheDocument();
		});

		expect(
			screen.getByText(
				'Configure the Two-Factor Authentication (2FA) service in the authentication section of the workspace settings.'
			)
		).toBeInTheDocument();
		expect(
			screen.getByText('If you need to, you can skip this configuration.')
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'SKIP FOR NOW' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'CONFIGURE THE 2FA' })).toBeInTheDocument();
	});

	it('should close modal when SKIP FOR NOW button is clicked', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ carbonioOTPSetupRequired: true }));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.getByText(TWO_FACTOR_AUTH_MESSAGE)).toBeInTheDocument();
		});

		const skipButton = screen.getByRole('button', { name: 'SKIP FOR NOW' });
		fireEvent.click(skipButton);

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});

	it('should close modal and navigate to OTP settings when CONFIGURE THE 2FA button is clicked', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ carbonioOTPSetupRequired: true }));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.getByText(TWO_FACTOR_AUTH_MESSAGE)).toBeInTheDocument();
		});

		const configureButton = screen.getByRole('button', { name: 'CONFIGURE THE 2FA' });
		fireEvent.click(configureButton);

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});

		expect(mockReplaceHistory).toHaveBeenCalledWith('/settings/auth?section=otp');
	});

	it('should close modal when close button (X) is clicked', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ carbonioOTPSetupRequired: true }));

		await act(async () => {
			customRender(<TwoFactorAuthModal />);
		});

		await waitFor(() => {
			expect(screen.getByText(TWO_FACTOR_AUTH_MESSAGE)).toBeInTheDocument();
		});

		// The Modal component typically has a close icon button
		const closeButton = screen.getByTestId('icon: Close');
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByText(TWO_FACTOR_AUTH_MESSAGE)).not.toBeInTheDocument();
		});
	});
});
