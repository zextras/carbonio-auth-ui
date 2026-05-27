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
	beforeEach(() => {
		fetchMock.resetMocks();
	});

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

	it('should show the generated password step after creating a new EAS authentication', async () => {
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: { ok: true, value: { text_data: { password: 'eas-secret-123' } } }
				}
			})
		);
		fetchMock.mockResponseOnce(
			JSON.stringify({ Body: { response: { ok: true, value: { list: [] } } } })
		);
		customRender(<ExchangeActiveSync passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'Work EAS' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));
		});
		expect(screen.getByText('setNewPassword.successfully')).toBeInTheDocument();
	});

	it('should open the delete confirmation modal after selecting a row and clicking Delete', async () => {
		customRender(<ExchangeActiveSync passwords={[easPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('Work EAS Auth'));
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
		customRender(<ExchangeActiveSync passwords={[easPassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('Work EAS Auth'));
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
