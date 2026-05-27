/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { type Password } from '../../../types';
import { ExchangeActiveSync } from '../exchange-active-sync';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

const easPassword: Password = {
	id: 'eas-1',
	label: 'Work EAS Auth',
	enabled: true,
	services: [{ service: 'EAS' }],
	created: 1700000000000
};

const mobilePassword: Password = {
	id: 'mobile-1',
	label: 'My Mobile Auth',
	enabled: true,
	services: [{ service: 'MobileApp' }],
	created: 1700000000001
};

describe('ExchangeActiveSync', () => {
	it('should render EAS credentials in the table', () => {
		customRender(<ExchangeActiveSync passwords={[easPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('Work EAS Auth')).toBeInTheDocument();
	});

	it('should not render credentials for other services', () => {
		customRender(
			<ExchangeActiveSync passwords={[easPassword, mobilePassword]} setPasswords={vi.fn()} />
		);
		expect(screen.getByText('Work EAS Auth')).toBeInTheDocument();
		expect(screen.queryByText('My Mobile Auth')).not.toBeInTheDocument();
	});

	it('should show the empty state when there are no EAS credentials', () => {
		customRender(<ExchangeActiveSync passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('easAuth.empty')).toBeInTheDocument();
	});

	it('should open the modal with a label input when New Authentication is clicked', () => {
		customRender(<ExchangeActiveSync passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		expect(screen.getByLabelText('setNewPassword.authenticationDescription')).toBeInTheDocument();
	});

	it('should show a duplicate label error when the entered description already exists', () => {
		customRender(<ExchangeActiveSync passwords={[easPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'Work EAS Auth' }
		});
		expect(screen.getByText('error.alreadyInUse')).toBeInTheDocument();
	});

	it('should have the Delete button disabled when no row is selected', () => {
		customRender(<ExchangeActiveSync passwords={[easPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled();
	});
});
