/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';
import {
	type AccountSettings,
	useChangePasswordURL,
	useUserSettings
} from '@zextras/carbonio-shell-ui';

import { customRender } from '../../../../test/test-utils';
import { fetchSoap } from '../../../network/fetchSoap';
import { ChangePassword } from '../change-password';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn(),
	useChangePasswordURL: vi.fn(),
	getUserAccount: vi.fn(() => ({ name: 'user@example.com' })),
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

vi.mock('../../../network/fetchSoap', () => ({
	fetchSoap: vi.fn()
}));

function mockUnlockedSettings(): void {
	vi.mocked(useUserSettings).mockReturnValue({
		attrs: { zimbraFeatureChangePasswordEnabled: 'TRUE' }
	} as unknown as AccountSettings);
	vi.mocked(useChangePasswordURL).mockReturnValue(undefined);
}

describe('ChangePassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUnlockedSettings();
	});

	it('should render the instruction text when the form is unlocked', () => {
		customRender(<ChangePassword />);
		expect(screen.getByText('changePassword.instruction')).toBeInTheDocument();
	});

	it('should have the submit button disabled when all password fields are empty', () => {
		customRender(<ChangePassword />);
		expect(screen.getByRole('button', { name: 'changePassword.title' })).toBeDisabled();
	});

	it('should show a mismatch error when confirm password does not equal new password', () => {
		customRender(<ChangePassword />);
		fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'newPass1!' } });
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'differentPass!' }
		});
		expect(screen.getByText('changePassword.mustMatch')).toBeInTheDocument();
	});

	it('should clear the mismatch error once confirm password matches new password', () => {
		customRender(<ChangePassword />);
		fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'samePass1!' } });
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'differentPass!' }
		});
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'samePass1!' }
		});
		expect(screen.queryByText('changePassword.mustMatch')).not.toBeInTheDocument();
	});

	it('should show the locked notice and disable all inputs when change password is disabled', () => {
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: { zimbraFeatureChangePasswordEnabled: 'FALSE' }
		} as unknown as AccountSettings);
		customRender(<ChangePassword />);
		expect(screen.getByText('changePassword.zimbraPasswordLocked')).toBeInTheDocument();
		expect(screen.getByLabelText('changePassword.oldPassword')).toBeDisabled();
		expect(screen.getByLabelText('newPassword')).toBeDisabled();
		expect(screen.getByLabelText('changePassword.confirmNew')).toBeDisabled();
	});

	it('should show the locked notice when zimbraPasswordLocked is TRUE', () => {
		vi.mocked(useUserSettings).mockReturnValue({
			attrs: { zimbraFeatureChangePasswordEnabled: 'TRUE', zimbraPasswordLocked: 'TRUE' }
		} as unknown as AccountSettings);
		customRender(<ChangePassword />);
		expect(screen.getByText('changePassword.zimbraPasswordLocked')).toBeInTheDocument();
	});

	it('should render ExternalPasswordLink instead of the form when externalUrl is set and not locked', () => {
		vi.mocked(useChangePasswordURL).mockReturnValue('https://idp.example.com/change');
		customRender(<ChangePassword />);
		expect(screen.getByText('changePassword.externalLinkDescription')).toBeInTheDocument();
		expect(screen.queryByText('changePassword.instruction')).not.toBeInTheDocument();
	});

	it('should call fetchSoap with the old and new passwords on submit', async () => {
		vi.mocked(fetchSoap).mockResolvedValue({ ChangePasswordResponse: { authToken: 'tok' } });
		customRender(<ChangePassword />);
		fireEvent.change(screen.getByLabelText('changePassword.oldPassword'), {
			target: { value: 'oldPass1!' }
		});
		fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'newPass1!' } });
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'newPass1!' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'changePassword.title' }));
		});
		expect(fetchSoap).toHaveBeenCalledWith(
			'ChangePasswordRequest',
			expect.objectContaining({
				oldPassword: { _content: 'oldPass1!' },
				password: { _content: 'newPass1!' }
			})
		);
	});

	it('should show an error under the old password field when AUTH_FAILED is returned', async () => {
		vi.mocked(fetchSoap).mockResolvedValue({
			Fault: { Detail: { Error: { Code: 'account.AUTH_FAILED' } } }
		});
		customRender(<ChangePassword />);
		fireEvent.change(screen.getByLabelText('changePassword.oldPassword'), {
			target: { value: 'wrongOld' }
		});
		fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'newPass1!' } });
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'newPass1!' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'changePassword.title' }));
		});
		expect(screen.getByText('changePassword.incorrectPassword')).toBeInTheDocument();
	});

	it('should show an error under the new password field when PASSWORD_RECENTLY_USED is returned', async () => {
		vi.mocked(fetchSoap).mockResolvedValue({
			Fault: { Detail: { Error: { Code: 'account.PASSWORD_RECENTLY_USED' } } }
		});
		customRender(<ChangePassword />);
		fireEvent.change(screen.getByLabelText('changePassword.oldPassword'), {
			target: { value: 'oldPass1!' }
		});
		fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'recentPass!' } });
		fireEvent.change(screen.getByLabelText('changePassword.confirmNew'), {
			target: { value: 'recentPass!' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'changePassword.title' }));
		});
		expect(screen.getByText('changePassword.recentlyUsedPassword')).toBeInTheDocument();
	});
});
