/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';
import { type AccountSettings, useUserSettings } from '@zextras/carbonio-shell-ui';

import { customRender } from '../../../../test/test-utils';
import { setRecoveryAccountRequest } from '../../../network/set-recovery-account-request';
import { RecoveryPassword } from '../recovery-password';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn(),
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

vi.mock('../../../network/set-recovery-account-request', () => ({
	setRecoveryAccountRequest: vi.fn()
}));

// RecoveryPassword uses useTranslation from react-i18next.
// customRender provides I18nextProvider with empty translations, so t() returns fallback strings.
// All assertions below use the translated fallback strings (second arg to t()).

function mockPrefs(status: string | undefined, address: string | undefined): void {
	vi.mocked(useUserSettings).mockReturnValue({
		prefs: {
			zimbraPrefPasswordRecoveryAddressStatus: status,
			zimbraPrefPasswordRecoveryAddress: address
		}
	} as unknown as AccountSettings);
}

describe('RecoveryPassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPrefs(undefined, undefined);
	});

	describe('initial (empty) state', () => {
		it('should render the address input', () => {
			customRender(<RecoveryPassword />);
			expect(screen.getByLabelText('Enter your recovery address')).toBeInTheDocument();
		});

		it('should have Set Address button disabled when the address input is empty', () => {
			customRender(<RecoveryPassword />);
			expect(screen.getByRole('button', { name: 'set address' })).toBeDisabled();
		});

		it('should have Set Address button disabled for an invalid email', () => {
			customRender(<RecoveryPassword />);
			fireEvent.change(screen.getByLabelText('Enter your recovery address'), {
				target: { value: 'notanemail' }
			});
			expect(screen.getByRole('button', { name: 'set address' })).toBeDisabled();
		});

		it('should enable Set Address button when a valid email is entered', () => {
			customRender(<RecoveryPassword />);
			fireEvent.change(screen.getByLabelText('Enter your recovery address'), {
				target: { value: 'user@example.com' }
			});
			expect(screen.getByRole('button', { name: 'set address' })).not.toBeDisabled();
		});

		it('should transition to pending state and show verification form after sendCode succeeds', async () => {
			vi.mocked(setRecoveryAccountRequest).mockResolvedValue({});
			customRender(<RecoveryPassword />);
			fireEvent.change(screen.getByLabelText('Enter your recovery address'), {
				target: { value: 'user@example.com' }
			});
			await act(async () => {
				fireEvent.click(screen.getByRole('button', { name: 'set address' }));
			});
			expect(screen.getByText('Validation code')).toBeInTheDocument();
		});
	});

	describe('pending state', () => {
		beforeEach(() => {
			mockPrefs('pending', 'user@example.com');
		});

		it('should show the validation code section', () => {
			customRender(<RecoveryPassword />);
			expect(screen.getByText('Validation code')).toBeInTheDocument();
		});

		it('should have the address input disabled', () => {
			customRender(<RecoveryPassword />);
			expect(screen.getByLabelText('Enter your recovery address')).toBeDisabled();
		});

		it('should show a code input error when CODE_MISMATCH is returned', async () => {
			vi.mocked(setRecoveryAccountRequest).mockResolvedValue({
				Fault: { Detail: { Error: { Code: 'service.CODE_MISMATCH' } } }
			});
			customRender(<RecoveryPassword />);
			fireEvent.change(screen.getByLabelText('Enter code'), {
				target: { value: 'wrongcode' }
			});
			await act(async () => {
				fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
			});
			expect(screen.getByText('Code not valid')).toBeInTheDocument();
		});

		it('should transition to verified state after validateCode succeeds', async () => {
			vi.mocked(setRecoveryAccountRequest).mockResolvedValue({});
			customRender(<RecoveryPassword />);
			fireEvent.change(screen.getByLabelText('Enter code'), {
				target: { value: '123456' }
			});
			await act(async () => {
				fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
			});
			expect(
				screen.getByText('Your recovery address is set. You can easily update it from here.')
			).toBeInTheDocument();
		});
	});

	describe('verified state', () => {
		beforeEach(() => {
			mockPrefs('verified', 'user@example.com');
		});

		it('should show the verified status message', () => {
			customRender(<RecoveryPassword />);
			expect(
				screen.getByText('Your recovery address is set. You can easily update it from here.')
			).toBeInTheDocument();
		});

		it('should show the recovery address and a remove button', () => {
			customRender(<RecoveryPassword />);
			expect(screen.getByText('user@example.com')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'remove' })).toBeInTheDocument();
		});

		it('should return to empty state after reset succeeds', async () => {
			vi.mocked(setRecoveryAccountRequest).mockResolvedValue({});
			customRender(<RecoveryPassword />);
			await act(async () => {
				fireEvent.click(screen.getByRole('button', { name: 'remove' }));
			});
			expect(
				screen.queryByText('Your recovery address is set. You can easily update it from here.')
			).not.toBeInTheDocument();
			expect(screen.getByLabelText('Enter your recovery address')).toBeInTheDocument();
		});
	});
});
