/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { ExternalPasswordLink } from '../external-password-link';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: (key: string): string => key
}));

const TEST_URL = 'https://idp.example.com/password';
const OPEN_TARGET = '_blank';
const OPEN_FEATURES = 'noopener,noreferrer';

describe('ExternalPasswordLink', () => {
	describe('change variant', () => {
		it('should render the change password title', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="change" />);
			expect(screen.getByText('changePassword.title')).toBeInTheDocument();
		});

		it('should render the change password external link description', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="change" />);
			expect(screen.getByText('changePassword.externalLinkDescription')).toBeInTheDocument();
		});

		it('should not render the reset password description', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="change" />);
			expect(screen.queryByText('resetPassword.externalLinkDescription')).not.toBeInTheDocument();
		});

		it('should call window.open with the correct arguments when the button is clicked', () => {
			const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
			customRender(<ExternalPasswordLink url={TEST_URL} variant="change" />);
			fireEvent.click(screen.getByRole('button'));
			expect(openSpy).toHaveBeenCalledWith(TEST_URL, OPEN_TARGET, OPEN_FEATURES);
		});

		it('should open the URL passed as prop', () => {
			const customUrl = 'https://company.com/sso/change-password';
			const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
			customRender(<ExternalPasswordLink url={customUrl} variant="change" />);
			fireEvent.click(screen.getByRole('button'));
			expect(openSpy).toHaveBeenCalledWith(customUrl, OPEN_TARGET, OPEN_FEATURES);
		});
	});

	describe('reset variant', () => {
		it('should render the reset password title', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="reset" />);
			expect(screen.getByText('settingsAuth.Displayer.ResetPassword')).toBeInTheDocument();
		});

		it('should render the reset password external link description', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="reset" />);
			expect(screen.getByText('resetPassword.externalLinkDescription')).toBeInTheDocument();
		});

		it('should not render the change password description', () => {
			customRender(<ExternalPasswordLink url={TEST_URL} variant="reset" />);
			expect(screen.queryByText('changePassword.externalLinkDescription')).not.toBeInTheDocument();
		});

		it('should call window.open with the correct arguments when the button is clicked', () => {
			const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
			customRender(<ExternalPasswordLink url={TEST_URL} variant="reset" />);
			fireEvent.click(screen.getByRole('button'));
			expect(openSpy).toHaveBeenCalledWith(TEST_URL, OPEN_TARGET, OPEN_FEATURES);
		});
	});
});
