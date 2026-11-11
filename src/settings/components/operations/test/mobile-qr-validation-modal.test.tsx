/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { mobileQrValidateNumberRequest } from '../../../network/mobile-qr-credential';
import { MobileQrValidationModal } from '../mobile-qr-validation-modal';

const countdownMock = vi.hoisted(() => ({ remainingSeconds: 5 }));

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

vi.mock('../../../hooks/use-countdown', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../../hooks/use-countdown')>();
	return {
		...original,
		useCountdown: (): number => countdownMock.remainingSeconds
	};
});

vi.mock('../../../network/mobile-qr-credential', () => ({
	mobileQrValidateNumberRequest: vi.fn()
}));

const details = {
	requestedAt: 1794000861348,
	mobileGeneratedToken: '1234-123123',
	ipAddress: '1.2.3.4',
	mobileClientInfo: 'client info',
	location: 'Turkey',
	label: 'My phone',
	user: 'user@example.com'
};

const defaultProps = {
	open: true,
	details,
	onClose: vi.fn(),
	onValidated: vi.fn(),
	onGenerateNewQr: vi.fn()
};

function typeCode(code = '123456'): void {
	code.split('').forEach((digit, index) => {
		fireEvent.change(screen.getByTestId(`digit-input-${index}`), { target: { value: digit } });
	});
}

async function submitCode(code = '123456'): Promise<void> {
	await act(async () => {
		typeCode(code);
	});
}

async function submitRejectedCode(): Promise<void> {
	await submitCode();
	await screen.findByTestId('validation-error');
}

function ReopenHarness(): React.JSX.Element {
	const [open, setOpen] = React.useState(true);
	return (
		<>
			<button type="button" onClick={(): void => setOpen(false)}>
				hide
			</button>
			<button type="button" onClick={(): void => setOpen(true)}>
				show
			</button>
			<MobileQrValidationModal {...defaultProps} open={open} />
		</>
	);
}

function ExpiryHarness(): React.JSX.Element {
	const [, setRenderCount] = React.useState(0);
	return (
		<>
			<button type="button" onClick={(): void => setRenderCount((count) => count + 1)}>
				expire
			</button>
			<MobileQrValidationModal {...defaultProps} />
		</>
	);
}

describe('MobileQrValidationModal', () => {
	beforeEach(() => {
		countdownMock.remainingSeconds = 5;
		vi.mocked(mobileQrValidateNumberRequest).mockReset();
	});

	it('should render device details, countdown, and close action', () => {
		const onClose = vi.fn();
		customRender(<MobileQrValidationModal {...defaultProps} onClose={onClose} />);

		expect(screen.getByText(details.ipAddress)).toBeInTheDocument();
		expect(screen.getByText(details.location)).toBeInTheDocument();
		expect(screen.getByText(details.mobileClientInfo)).toBeInTheDocument();
		expect(screen.getByText(details.mobileGeneratedToken)).toBeInTheDocument();
		expect(screen.getByText('mobileQr.validation.requestReceived')).toBeInTheDocument();
		expect(screen.getByText('mobileQr.validation.detailsWarning')).toBeInTheDocument();
		expect(screen.getByTestId('icon: SmartphoneOutline')).toBeInTheDocument();
		expect(screen.getByTestId('validation-countdown')).toHaveTextContent('0:05');

		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('should not validate an incomplete code', async () => {
		customRender(<MobileQrValidationModal {...defaultProps} />);

		await submitCode('12345');

		expect(mobileQrValidateNumberRequest).not.toHaveBeenCalled();
	});

	it('should validate a complete code and notify when success is closed', async () => {
		const onValidated = vi.fn();
		vi.mocked(mobileQrValidateNumberRequest).mockResolvedValue({
			response: { ok: true }
		});
		customRender(<MobileQrValidationModal {...defaultProps} onValidated={onValidated} />);

		await submitCode();

		expect(mobileQrValidateNumberRequest).toHaveBeenCalledWith(details.label, details.user, 123456);
		fireEvent.click(await screen.findByRole('button', { name: 'buttons.ok' }));
		expect(onValidated).toHaveBeenCalledOnce();
	});

	it('should show attempts remaining and clear the code after rejection', async () => {
		vi.mocked(mobileQrValidateNumberRequest).mockResolvedValue({
			response: { ok: false }
		});
		customRender(<MobileQrValidationModal {...defaultProps} />);

		await submitRejectedCode();

		expect(screen.getByTestId('validation-error')).toHaveTextContent(
			'mobileQr.validation.attemptsRemaining'
		);
		expect(screen.getByTestId('digit-input-0')).toHaveValue('');
	});

	it('should show a generic error and clear the code after a request failure', async () => {
		vi.mocked(mobileQrValidateNumberRequest).mockRejectedValue(new Error('Network error'));
		customRender(<MobileQrValidationModal {...defaultProps} />);

		await submitRejectedCode();

		expect(screen.getByTestId('validation-error')).toHaveTextContent('error.somethingWrong');
		expect(screen.getByTestId('digit-input-0')).toHaveValue('');
	});

	it.each([
		[
			'rejected codes',
			(): Promise<{ response: { ok: boolean } }> => Promise.resolve({ response: { ok: false } })
		],
		[
			'request errors',
			(): Promise<{ response: { ok: boolean } }> => Promise.reject(new Error('Network error'))
		]
	])('should fail after three %s', async (_description, responseFactory) => {
		vi.mocked(mobileQrValidateNumberRequest).mockImplementation(responseFactory);
		const onClose = vi.fn();
		const onGenerateNewQr = vi.fn();
		customRender(
			<MobileQrValidationModal
				{...defaultProps}
				onClose={onClose}
				onGenerateNewQr={onGenerateNewQr}
			/>
		);

		await submitRejectedCode();
		await submitRejectedCode();
		await submitCode();

		expect(await screen.findByText('mobileQr.validation.failed')).toBeInTheDocument();
		expect(screen.getByText('mobileQr.validation.tooManyAttempts')).toBeInTheDocument();
		expect(screen.getByTestId('icon: AlertTriangleOutline')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'mobileQr.generateNewQrCode' }));
		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));
		expect(onGenerateNewQr).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('should use close as the generate-new-QR fallback', async () => {
		vi.mocked(mobileQrValidateNumberRequest).mockResolvedValue({
			response: { ok: false }
		});
		const onClose = vi.fn();
		customRender(
			<MobileQrValidationModal open details={details} onClose={onClose} onValidated={vi.fn()} />
		);

		await submitRejectedCode();
		await submitRejectedCode();
		await submitCode();
		fireEvent.click(await screen.findByRole('button', { name: 'mobileQr.generateNewQrCode' }));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it('should disable input and show expiry when the countdown reaches zero', () => {
		countdownMock.remainingSeconds = 0;
		customRender(<MobileQrValidationModal {...defaultProps} />);

		expect(screen.getByText('mobileQr.validation.expired')).toBeInTheDocument();
		expect(screen.getByTestId('digit-input-0')).toBeDisabled();
		expect(screen.queryByTestId('validation-countdown')).not.toBeInTheDocument();
	});

	it('should clear validation errors when the request expires', async () => {
		vi.mocked(mobileQrValidateNumberRequest).mockResolvedValue({
			response: { ok: false }
		});
		customRender(<ExpiryHarness />);
		await submitRejectedCode();

		countdownMock.remainingSeconds = 0;
		fireEvent.click(screen.getByRole('button', { name: 'expire' }));

		expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
		expect(screen.getByText('mobileQr.validation.expired')).toBeInTheDocument();
	});

	it('should show a regular countdown before the warning threshold', () => {
		countdownMock.remainingSeconds = 31;
		customRender(<MobileQrValidationModal {...defaultProps} />);

		expect(screen.getByTestId('validation-countdown')).toHaveTextContent('0:31');
	});

	it('should reset state when reopened', async () => {
		vi.mocked(mobileQrValidateNumberRequest).mockResolvedValue({
			response: { ok: false }
		});
		customRender(<ReopenHarness />);
		await submitRejectedCode();

		fireEvent.click(screen.getByRole('button', { name: 'hide' }));
		fireEvent.click(screen.getByRole('button', { name: 'show' }));

		expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
		expect(screen.getByTestId('digit-input-0')).toHaveValue('');
	});
});
