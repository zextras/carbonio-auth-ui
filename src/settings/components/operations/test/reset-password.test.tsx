/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import {
	type AccountSettings,
	useChangePasswordURL,
	useUserSettings
} from '@zextras/carbonio-shell-ui';

import { customRender } from '../../../../test/test-utils';
import { ResetPassword } from '../reset-password';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn(),
	useChangePasswordURL: vi.fn(),
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

vi.mock('../../../network/reset-password-request', () => ({
	resetPasswordRequest: vi.fn().mockResolvedValue({})
}));

describe('ResetPassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: {}
		} as unknown as AccountSettings);
		vi.mocked(useChangePasswordURL).mockReturnValue(undefined);
	});

	it('should render the form section title', () => {
		customRender(<ResetPassword />);
		expect(screen.getByText('settingsAuth.Displayer.ResetPassword')).toBeInTheDocument();
	});

	it('should have the Continue button disabled when the new password field is empty', () => {
		customRender(<ResetPassword />);
		expect(
			screen.getByRole('button', { name: 'settingsAuth.displayerPrimaryButton.Continue' })
		).toBeDisabled();
	});

	it('should have the Continue button disabled when passwords do not match', () => {
		customRender(<ResetPassword />);
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.NewPassword'), {
			target: { value: 'newPass1!' }
		});
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.ConfirmPassword'), {
			target: { value: 'different!' }
		});
		expect(
			screen.getByRole('button', { name: 'settingsAuth.displayerPrimaryButton.Continue' })
		).toBeDisabled();
	});

	it('should enable the Continue button when both password fields match', () => {
		customRender(<ResetPassword />);
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.NewPassword'), {
			target: { value: 'matchPass1!' }
		});
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.ConfirmPassword'), {
			target: { value: 'matchPass1!' }
		});
		expect(
			screen.getByRole('button', { name: 'settingsAuth.displayerPrimaryButton.Continue' })
		).not.toBeDisabled();
	});

	it('should show a mismatch error description when confirm password differs from new password', () => {
		customRender(<ResetPassword />);
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.NewPassword'), {
			target: { value: 'newPass1!' }
		});
		fireEvent.change(screen.getByLabelText('settingsAuth.displayerInputField.ConfirmPassword'), {
			target: { value: 'different!' }
		});
		expect(
			screen.getByText('settingsAuth.ErrorDescriptionConfirmInput.PasswordDoesNotMatch')
		).toBeInTheDocument();
	});

	it('should render ExternalPasswordLink and hide the form when externalUrl is configured', () => {
		vi.mocked(useChangePasswordURL).mockReturnValue('https://idp.example.com/reset');
		customRender(<ResetPassword />);
		expect(screen.getByText('resetPassword.externalLinkDescription')).toBeInTheDocument();
		expect(
			screen.queryByText('settingsAuth.Displayer.CreateANewPasswordToResetIt')
		).not.toBeInTheDocument();
	});
});
