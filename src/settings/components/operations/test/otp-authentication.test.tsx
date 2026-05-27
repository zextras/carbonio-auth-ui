/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import fetchMock from '../../../../test/fetchMock';
import { customRender } from '../../../../test/test-utils';
import { OTPAuthentication } from '../otp-authentication';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

function mockListOTPResponse(list: object[]): void {
	fetchMock.mockResponseOnce(
		JSON.stringify({
			Body: {
				response: {
					ok: true,
					value: { list }
				}
			}
		})
	);
}

describe('OTPAuthentication', () => {
	beforeEach(() => {
		fetchMock.resetMocks();
	});

	it('should fetch and display OTP entries on mount', async () => {
		mockListOTPResponse([
			{
				id: 'otp-1',
				label: 'Work Account OTP',
				enabled: true,
				failed_attempts: 2,
				created: 1700000000000
			}
		]);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		expect(screen.getByText('Work Account OTP')).toBeInTheDocument();
	});

	it('should show the empty state when the OTP list is empty', async () => {
		mockListOTPResponse([]);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		expect(screen.getByText('setNewOtpLabel.empty')).toBeInTheDocument();
	});

	it('should have the Delete button disabled when no OTP is selected', async () => {
		mockListOTPResponse([
			{ id: 'otp-1', label: 'Work OTP', enabled: true, failed_attempts: 0, created: 1700000000000 }
		]);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled();
	});

	describe('label validation in the new OTP modal', () => {
		async function openModal(): Promise<void> {
			mockListOTPResponse([]);
			await act(async () => {
				customRender(<OTPAuthentication />);
			});
			fireEvent.click(screen.getByRole('button', { name: 'newOtp.label' }));
		}

		it('should show an error when the label exceeds 20 characters', async () => {
			await openModal();
			fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
				target: { value: 'a'.repeat(21) }
			});
			expect(screen.getByText('error.maximumLength')).toBeInTheDocument();
		});

		it('should show an error when the label contains disallowed special characters', async () => {
			await openModal();
			fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
				target: { value: 'invalid!label' }
			});
			expect(screen.getByText('error.specialChars')).toBeInTheDocument();
		});

		it('should show no error for a valid label with hyphens and underscores', async () => {
			await openModal();
			fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
				target: { value: 'valid-label_1' }
			});
			expect(screen.queryByText('error.maximumLength')).not.toBeInTheDocument();
			expect(screen.queryByText('error.specialChars')).not.toBeInTheDocument();
		});

		it('should disable the Next button when the label input is empty', async () => {
			await openModal();
			expect(screen.getByRole('button', { name: 'buttons.next' })).toBeDisabled();
		});

		it('should enable the Next button when a valid label is entered', async () => {
			await openModal();
			fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
				target: { value: 'ValidLabel' }
			});
			expect(screen.getByRole('button', { name: 'buttons.next' })).not.toBeDisabled();
		});
	});

	it('should advance to the QR code step after GenerateOTPRequest succeeds', async () => {
		mockListOTPResponse([]);
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							URI: 'otpauth://totp/test-user@example.com?secret=ABC123',
							static_otp_codes: [{ code: 'code1' }, { code: 'code2' }]
						}
					}
				}
			})
		);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		fireEvent.click(screen.getByRole('button', { name: 'newOtp.label' }));
		fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
			target: { value: 'MyOTP' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));
		});
		expect(screen.getByText('setNewQRCode.successfully')).toBeInTheDocument();
		expect(screen.getByTestId('qrcode-password')).toBeInTheDocument();
	});

	it('should advance to the pin codes step when Next is clicked on the QR code step', async () => {
		mockListOTPResponse([]);
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							URI: 'otpauth://totp/test-user@example.com?secret=ABC123',
							static_otp_codes: [{ code: 'pin-code-1' }, { code: 'pin-code-2' }]
						}
					}
				}
			})
		);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		fireEvent.click(screen.getByRole('button', { name: 'newOtp.label' }));
		fireEvent.change(screen.getByLabelText('setNewOtpLabel.inputLabel'), {
			target: { value: 'MyOTP' }
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));
		});
		fireEvent.click(screen.getByRole('button', { name: 'buttons.next' }));
		expect(screen.getByText('pin-code-1')).toBeInTheDocument();
	});

	it('should open the delete confirmation modal after selecting an OTP and clicking Delete', async () => {
		mockListOTPResponse([
			{ id: 'otp-1', label: 'Work OTP', enabled: true, failed_attempts: 0, created: 1700000000000 }
		]);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		fireEvent.click(screen.getByText('Work OTP'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
		expect(screen.getByText('deletePassword.title')).toBeInTheDocument();
	});

	it('should call DeleteOTPRequest when delete is confirmed', async () => {
		mockListOTPResponse([
			{ id: 'otp-1', label: 'Work OTP', enabled: true, failed_attempts: 0, created: 1700000000000 }
		]);
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		fetchMock.mockResponseOnce(
			JSON.stringify({ Body: { response: { ok: true, value: { list: [] } } } })
		);
		await act(async () => {
			customRender(<OTPAuthentication />);
		});
		fireEvent.click(screen.getByText('Work OTP'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'buttons.yes' }));
		});
		expect(fetchMock).toHaveBeenCalledWith('/service/soap/DeleteOTPRequest', expect.any(Object));
	});
});
