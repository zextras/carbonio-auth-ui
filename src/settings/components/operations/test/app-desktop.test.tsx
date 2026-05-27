/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { type Password } from '../../../types';
import { AppDesktop } from '../app-desktop';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

const desktopPassword: Password = {
	id: 'desktop-1',
	label: 'My Desktop Sync',
	enabled: true,
	services: [{ service: 'DesktopApp' }],
	created: 1700000000000
};

const mobilePassword: Password = {
	id: 'mobile-1',
	label: 'My Mobile Auth',
	enabled: true,
	services: [{ service: 'MobileApp' }],
	created: 1700000000001
};

describe('AppDesktop', () => {
	it('should render DesktopApp credentials in the table', () => {
		customRender(<AppDesktop passwords={[desktopPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('My Desktop Sync')).toBeInTheDocument();
	});

	it('should not render credentials for other services', () => {
		customRender(
			<AppDesktop passwords={[desktopPassword, mobilePassword]} setPasswords={vi.fn()} />
		);
		expect(screen.getByText('My Desktop Sync')).toBeInTheDocument();
		expect(screen.queryByText('My Mobile Auth')).not.toBeInTheDocument();
	});

	it('should show the empty state message when there are no DesktopApp credentials', () => {
		customRender(<AppDesktop passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('appDesktop.empty')).toBeInTheDocument();
	});

	it('should open the modal with a label input when New Authentication is clicked', () => {
		customRender(<AppDesktop passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		expect(screen.getByLabelText('setNewToken.authenticationDescription')).toBeInTheDocument();
	});

	it('should show a duplicate label error when the entered description already exists', () => {
		customRender(<AppDesktop passwords={[desktopPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewToken.authenticationDescription'), {
			target: { value: 'My Desktop Sync' }
		});
		expect(screen.getByText('error.alreadyInUse')).toBeInTheDocument();
	});

	it('should have the Delete button disabled when no row is selected', () => {
		customRender(<AppDesktop passwords={[desktopPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled();
	});
});
