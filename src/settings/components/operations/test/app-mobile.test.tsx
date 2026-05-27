/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import fetchMock from '../../../../test/fetchMock';
import { customRender } from '../../../../test/test-utils';
import { type Password } from '../../../types';
import { AppMobile } from '../app-mobile';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

const mobilePassword: Password = {
	id: 'mobile-1',
	label: 'My Mobile App',
	enabled: true,
	services: [{ service: 'MobileApp' }],
	created: 1700000000000
};

const easPassword: Password = {
	id: 'eas-1',
	label: 'My EAS Auth',
	enabled: false,
	services: [{ service: 'EAS' }],
	created: 1700000000001
};

describe('AppMobile', () => {
	beforeEach(() => {
		fetchMock.resetMocks();
	});

	it('should render MobileApp credentials in the table', () => {
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('My Mobile App')).toBeInTheDocument();
	});

	it('should not render credentials for other services', () => {
		customRender(<AppMobile passwords={[mobilePassword, easPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('My Mobile App')).toBeInTheDocument();
		expect(screen.queryByText('My EAS Auth')).not.toBeInTheDocument();
	});

	it('should show the empty state when there are no MobileApp credentials', () => {
		customRender(<AppMobile passwords={[easPassword]} setPasswords={vi.fn()} />);
		expect(screen.getByText('appMobile.empty')).toBeInTheDocument();
	});

	it('should open the modal with a label input when New Authentication is clicked', () => {
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		expect(screen.getByLabelText('setNewPassword.authenticationDescription')).toBeInTheDocument();
	});

	it('should show a duplicate label error when the entered description already exists', () => {
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'My Mobile App' }
		});
		expect(screen.getByText('error.alreadyInUse')).toBeInTheDocument();
	});

	it('should have the Delete button disabled when no row is selected', () => {
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled();
	});

	it('should show the QR code after creating a new mobile authentication', async () => {
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							qrcode_data: {
								auth_method: 'qr',
								auth_payload: { password: 'mobiletoken', user: 'test@example.com' },
								auth_endpoint: [{ url: 'https://example.com' }]
							}
						}
					}
				}
			})
		);
		fetchMock.mockResponseOnce(
			JSON.stringify({ Body: { response: { ok: true, value: { list: [] } } } })
		);
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'My Phone' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));
		});
		expect(screen.getByTestId('qrcode-password')).toBeInTheDocument();
	});

	it('should open the delete confirmation modal after selecting a row and clicking Delete', async () => {
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Mobile App'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
		expect(screen.getByText('deletePassword.title')).toBeInTheDocument();
	});

	it('should call RemoveCredentialRequest when delete is confirmed', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		fetchMock.mockResponseOnce(
			JSON.stringify({ Body: { response: { ok: true, value: { list: [] } } } })
		);
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Mobile App'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'buttons.yes' }));
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/service/soap/RemoveCredentialRequest',
			expect.any(Object)
		);
	});
});
