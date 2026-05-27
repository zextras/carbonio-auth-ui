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
	beforeEach(() => {
		fetchMock.resetMocks();
	});

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

	it('should show the generated token after creating a new desktop authentication', async () => {
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							qrcode_data: {
								auth_method: 'token',
								auth_payload: { password: 'secrettoken', user: 'test@example.com' },
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
		customRender(<AppDesktop passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewToken.authenticationDescription'), {
			target: { value: 'My Desktop Sync App' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'common.createToken' }));
		});
		expect(screen.getByText('setNewToken.successfully')).toBeInTheDocument();
	});

	it('should open the delete confirmation modal after selecting a row and clicking Delete', async () => {
		customRender(<AppDesktop passwords={[desktopPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Desktop Sync'));
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
		customRender(<AppDesktop passwords={[desktopPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Desktop Sync'));
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
