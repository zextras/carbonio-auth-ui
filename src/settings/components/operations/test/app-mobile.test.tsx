/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { getUserAccount } from '@zextras/carbonio-shell-ui';

import fetchMock from '../../../../test/fetchMock';
import { customRender } from '../../../../test/test-utils';
import { UseMobileQrPollingParams } from '../../../hooks/use-mobile-qr-polling';
import { type Password } from '../../../types';
import { AppMobile } from '../app-mobile';

const pollingMock = vi.hoisted(() => ({
	params: undefined as UseMobileQrPollingParams | undefined
}));
const countdownMock = vi.hoisted(() => ({ remainingSeconds: 180 }));
const createSnackbarMock = vi.hoisted(() => vi.fn());

vi.mock('@zextras/carbonio-design-system', async (importOriginal) => {
	const original = await importOriginal<typeof import('@zextras/carbonio-design-system')>();
	return {
		...original,
		useSnackbar: (): typeof createSnackbarMock => createSnackbarMock
	};
});

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	getUserAccount: vi.fn(() => ({ name: 'user@example.com' })),
	t: (key: string): string => key
}));

vi.mock('../../../hooks/use-mobile-qr-polling', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../../hooks/use-mobile-qr-polling')>();
	return {
		...original,
		useMobileQrPolling: (params: UseMobileQrPollingParams): void => {
			pollingMock.params = params;
		}
	};
});

vi.mock('../../../hooks/use-countdown', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../../hooks/use-countdown')>();
	return {
		...original,
		useCountdown: (): number => countdownMock.remainingSeconds
	};
});

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

const mobileQrDetails = {
	requestedAt: 1794000861348,
	mobileGeneratedToken: '1234-123123',
	ipAddress: '1.2.3.4',
	mobileClientInfo: 'client info',
	location: 'Turkey',
	label: 'My Phone',
	user: 'user@example.com'
};

function qrCodeResponse(version?: string): string {
	return JSON.stringify({
		Body: {
			response: {
				ok: true,
				response: {
					qrcode_data: {
						version,
						token: 'qr-token',
						auth_method: 'qr',
						auth_payload: { password: 'mobiletoken', user: 'user@example.com' },
						auth_endpoint: [{ url: 'https://example.com' }]
					}
				}
			}
		}
	});
}

async function openGeneratedQrCode(version?: string): Promise<void> {
	fetchMock.mockResponseOnce(qrCodeResponse(version));
	fetchMock.mockResponseOnce(
		JSON.stringify({ Body: { response: { ok: true, values: [{ created: 1 }] } } })
	);
	fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
	fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
		target: { value: 'My Phone' }
	});
	fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));
	await screen.findByTestId('qrcode-password');
}

function typeValidationCode(code: string): void {
	code.split('').forEach((digit, index) => {
		fireEvent.change(screen.getByTestId(`digit-input-${index}`), { target: { value: digit } });
	});
}

function RerenderableAppMobile(): React.JSX.Element {
	const [, setRenderCount] = React.useState(0);
	return (
		<>
			<button
				data-testid="rerender-app-mobile"
				onClick={(): void => setRenderCount((count) => count + 1)}
				type="button"
			/>
			<AppMobile passwords={[]} setPasswords={vi.fn()} />
		</>
	);
}

async function submitRejectedValidationCode(): Promise<void> {
	await act(async () => {
		typeValidationCode('123456');
	});
	await screen.findByText('mobileQr.validation.attemptsRemaining');
}

describe('AppMobile', () => {
	beforeEach(() => {
		fetchMock.resetMocks();
		createSnackbarMock.mockReset();
		pollingMock.params = undefined;
		countdownMock.remainingSeconds = 180;
		vi.mocked(getUserAccount).mockReturnValue({
			name: 'user@example.com'
		} as ReturnType<typeof getUserAccount>);
		Object.defineProperty(document, 'execCommand', {
			configurable: true,
			value: vi.fn()
		});
	});

	afterEach(() => {
		vi.useRealTimers();
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
		expect(screen.getByText('mobileQr.delete.title')).toBeInTheDocument();
	});

	it('should close the delete confirmation without deleting', async () => {
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Mobile App'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));

		fireEvent.click(screen.getByRole('button', { name: 'buttons.cancel' }));

		expect(screen.queryByText('mobileQr.delete.title')).not.toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
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
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'common.delete' })).toBeDisabled()
		);
		expect(createSnackbarMock).toHaveBeenCalledWith(
			expect.objectContaining({ severity: 'success' })
		);
	});

	it.each([
		[
			'an unsuccessful response',
			(): void => {
				fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }));
			}
		],
		[
			'a network error',
			(): void => {
				fetchMock.mockRejectOnce(new Error('Network error'));
			}
		]
	])('should keep delete confirmation open after %s', async (_description, arrangeFailure) => {
		arrangeFailure();
		customRender(<AppMobile passwords={[mobilePassword]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByText('My Mobile App'));
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));

		fireEvent.click(screen.getByRole('button', { name: 'buttons.yes' }));

		await waitFor(() =>
			expect(createSnackbarMock).toHaveBeenCalledWith(
				expect.objectContaining({ severity: 'error', label: 'error.somethingWrong' })
			)
		);
		expect(screen.getByText('mobileQr.delete.title')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'common.delete' })).not.toBeDisabled();
	});

	it('should copy a legacy QR code and close it with a success notification', async () => {
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		await openGeneratedQrCode();

		fireEvent.click(screen.getByRole('button', { name: 'common.copyQrCode' }));
		expect(screen.getByText('setNewQRCode.successfully')).toBeInTheDocument();
		expect(screen.getByText('newOtp.warning')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));

		expect(screen.queryByTestId('qrcode-password')).not.toBeInTheDocument();
	});

	it('should replace passwords with an empty list when refresh has no credentials', async () => {
		const setPasswords = vi.fn();
		fetchMock.mockResponseOnce(qrCodeResponse());
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		customRender(<AppMobile passwords={[]} setPasswords={setPasswords} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'My Phone' }
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		await waitFor(() => expect(setPasswords).toHaveBeenCalledWith([]));
	});

	it('should allow closing while QR code generation is pending', () => {
		fetchMock.mockImplementationOnce(
			() =>
				new Promise(() => {
					// Keep the request pending.
				})
		);
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'common.newAuthentication' }));
		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'My Phone' }
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		fireEvent.click(screen.getByRole('button', { name: 'buttons.done' }));
		expect(
			screen.queryByLabelText('setNewPassword.authenticationDescription')
		).not.toBeInTheDocument();
	});

	it('should display and expire a version two QR code', async () => {
		customRender(<RerenderableAppMobile />);
		await openGeneratedQrCode('V2');

		expect(screen.getByText('appMobile.waitingForScan')).toBeInTheDocument();
		expect(screen.getByTestId('qrcode-countdown')).toHaveTextContent('3:00');
		expect(pollingMock.params).toEqual(
			expect.objectContaining({
				active: true,
				token: 'qr-token',
				user: 'user@example.com',
				label: 'My Phone'
			})
		);

		countdownMock.remainingSeconds = 0;
		fireEvent.click(screen.getByTestId('rerender-app-mobile'));
		expect(screen.getAllByText('mobileQr.expired')).toHaveLength(2);
		expect(screen.getByTestId('icon: ClockOutline')).toBeInTheDocument();
		expect(screen.queryByTestId('qrcode-password')).not.toBeInTheDocument();
	});

	it('should reopen authentication setup when an expired QR code is regenerated', async () => {
		customRender(<RerenderableAppMobile />);
		await openGeneratedQrCode('V2');
		countdownMock.remainingSeconds = 0;
		fireEvent.click(screen.getByTestId('rerender-app-mobile'));

		fireEvent.click(screen.getByRole('button', { name: 'mobileQr.generateNewQrCode' }));

		expect(screen.getByLabelText('setNewPassword.authenticationDescription')).toBeInTheDocument();
		expect(screen.queryByText('mobileQr.expired')).not.toBeInTheDocument();
	});

	it('should use the signed-in account when the QR payload omits the user', async () => {
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							qrcode_data: {
								version: 'V2',
								token: 'qr-token',
								auth_method: 'qr',
								auth_payload: { password: 'mobiletoken' },
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
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		await screen.findByTestId('qrcode-password');
		expect(pollingMock.params?.user).toBe('user@example.com');
	});

	it('should not poll before a version two QR token is available', async () => {
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							qrcode_data: {
								version: 'V2',
								auth_method: 'qr',
								auth_payload: { password: 'mobiletoken', user: 'user@example.com' },
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
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		await screen.findByTestId('qrcode-password');
		expect(pollingMock.params).toEqual(expect.objectContaining({ active: false, token: '' }));
	});

	it('should poll without an account when neither QR nor session provides a user', async () => {
		vi.mocked(getUserAccount).mockReturnValue(undefined);
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: {
					response: {
						ok: true,
						value: {
							qrcode_data: {
								version: 'V2',
								token: 'qr-token',
								auth_method: 'qr',
								auth_payload: { password: 'mobiletoken' },
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
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		await screen.findByTestId('qrcode-password');
		expect(pollingMock.params?.user).toBe('');
	});

	it('should open and close validation when the mobile app consumes the QR code', async () => {
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		await openGeneratedQrCode('V2');

		act(() => {
			pollingMock.params?.onMobileResponse(mobileQrDetails);
		});
		expect(screen.getByText('1.2.3.4')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));

		expect(screen.queryByText('1.2.3.4')).not.toBeInTheDocument();
	});

	it('should refresh credentials and show success after mobile validation', async () => {
		const setPasswords = vi.fn();
		customRender(<AppMobile passwords={[]} setPasswords={setPasswords} />);
		await openGeneratedQrCode('V2');
		act(() => {
			pollingMock.params?.onMobileResponse(mobileQrDetails);
		});
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		fetchMock.mockResponseOnce(
			JSON.stringify({
				Body: { response: { ok: true, value: { list: [{ created: 2 }, { created: 1 }] } } }
			})
		);

		await act(async () => {
			typeValidationCode('123456');
		});
		fireEvent.click(await screen.findByRole('button', { name: 'buttons.ok' }));

		await waitFor(() => expect(setPasswords).toHaveBeenCalled());
	});

	it('should return to authentication setup when a new QR code is requested', async () => {
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		await openGeneratedQrCode('V2');
		act(() => {
			pollingMock.params?.onMobileResponse(mobileQrDetails);
		});
		fetchMock
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }))
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }))
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }));

		await submitRejectedValidationCode();
		await submitRejectedValidationCode();
		await act(async () => {
			typeValidationCode('123456');
		});
		const generateButtons = await screen.findAllByRole('button', {
			name: 'common.newAuthentication'
		});
		generateButtons.forEach((button) => fireEvent.click(button));

		expect(screen.getByLabelText('setNewPassword.authenticationDescription')).toBeInTheDocument();
	});

	it('should reopen setup from the validation failure action', async () => {
		customRender(<AppMobile passwords={[]} setPasswords={vi.fn()} />);
		await openGeneratedQrCode('V2');
		act(() => {
			pollingMock.params?.onMobileResponse(mobileQrDetails);
		});
		fetchMock
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }))
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }))
			.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }));

		await submitRejectedValidationCode();
		await submitRejectedValidationCode();
		await act(async () => {
			typeValidationCode('123456');
		});
		fireEvent.click(await screen.findByRole('button', { name: 'mobileQr.generateNewQrCode' }));

		expect(screen.queryByText('mobileQr.validation.failed')).not.toBeInTheDocument();
		expect(screen.getByLabelText('setNewPassword.authenticationDescription')).toBeInTheDocument();
	});
});
