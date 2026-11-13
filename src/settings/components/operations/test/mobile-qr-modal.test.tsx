/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { MobileQrModal } from '../mobile-qr-modal';

const countdownMock = vi.hoisted(() => ({ remainingSeconds: 30 }));

vi.mock('@zextras/carbonio-shell-ui', () => ({
	t: (key: string): string => key
}));

vi.mock('../../../hooks/use-countdown', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../../hooks/use-countdown')>();
	return {
		...original,
		useCountdown: (): number => countdownMock.remainingSeconds
	};
});

vi.mock('../../shared/copy-qr-code-button', () => ({
	CopyQrCodeButton: (): React.JSX.Element => <button type="button">copy QR</button>
}));

const qrCodeData = {
	auth_method: 'qr',
	auth_payload: {
		password: 'secret',
		user: 'user@example.com'
	},
	auth_endpoint: [{ url: 'https://example.com' }] as [{ url: string }],
	token: 'qr-token'
};

const defaultProps = {
	open: true,
	step: 'set_label' as const,
	authDescription: '',
	setAuthDescription: vi.fn(),
	formatError: '',
	setStep: vi.fn(),
	onClose: vi.fn(),
	onCreate: vi.fn()
};

describe('MobileQrModal', () => {
	beforeEach(() => {
		countdownMock.remainingSeconds = 30;
	});

	it('should render setup, update the description, and create a QR code', () => {
		const setAuthDescription = vi.fn();
		const setStep = vi.fn();
		const onCreate = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				authDescription="My phone"
				setAuthDescription={setAuthDescription}
				setStep={setStep}
				onCreate={onCreate}
			/>
		);

		fireEvent.change(screen.getByLabelText('setNewPassword.authenticationDescription'), {
			target: { value: 'New phone' }
		});
		fireEvent.click(screen.getByRole('button', { name: 'common.createPassword' }));

		expect(setAuthDescription).toHaveBeenCalledWith('New phone');
		expect(setStep).toHaveBeenCalledWith('generate_qrcode');
		expect(onCreate).toHaveBeenCalledOnce();
	});

	it('should disable creation for empty or invalid descriptions', () => {
		const { unmount } = customRender(<MobileQrModal {...defaultProps} />);
		expect(screen.getByRole('button', { name: 'common.createPassword' })).toBeDisabled();
		unmount();

		customRender(
			<MobileQrModal {...defaultProps} authDescription="Duplicate" formatError="Already used" />
		);
		expect(screen.getByText('Already used')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'common.createPassword' })).toBeDisabled();
	});

	it('should allow closing but not completing pending generation', () => {
		const onClose = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				authDescription="My phone"
				onClose={onClose}
			/>
		);

		expect(screen.queryByRole('button', { name: 'buttons.done' })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));

		expect(onClose).toHaveBeenCalledExactlyOnceWith();
	});

	it('should render a legacy QR code', () => {
		const onClose = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: qrCodeData }}
				onClose={onClose}
			/>
		);

		expect(screen.getByText('setNewQRCode.successfully')).toBeInTheDocument();
		expect(screen.getByText('newOtp.warning')).toBeInTheDocument();
		expect(screen.getByTestId('qrcode-password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'copy QR' })).toBeInTheDocument();
		expect(screen.queryByTestId('qrcode-countdown')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'buttons.done' }));
		expect(onClose).toHaveBeenCalledExactlyOnceWith(true);
	});

	it('should render an active version two QR code before the warning threshold', () => {
		countdownMock.remainingSeconds = 31;
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: { ...qrCodeData, version: 'V2' } }}
			/>
		);

		expect(screen.getByText('appMobile.openAndScan')).toBeInTheDocument();
		expect(screen.getByText('appMobile.waitingForScan')).toBeInTheDocument();
		expect(screen.getByTestId('qrcode-countdown')).toHaveTextContent('0:31');
		expect(screen.queryByRole('button', { name: 'buttons.done' })).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'mobileQr.generateNewQrCode' })
		).not.toBeInTheDocument();
	});

	it('should render the warning countdown for an active version two QR code', () => {
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: { ...qrCodeData, version: 'V2' } }}
			/>
		);

		expect(screen.getByTestId('qrcode-countdown')).toHaveTextContent('0:30');
	});

	it('should delete an active version two QR code when closed', () => {
		const onClose = vi.fn();
		const onQrCodeClosed = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: { ...qrCodeData, version: 'V2' } }}
				onClose={onClose}
				onQrCodeClosed={onQrCodeClosed}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'buttons.close' }));

		expect(onQrCodeClosed).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('should render expiry and generate a new QR code', () => {
		countdownMock.remainingSeconds = 0;
		const onGenerateNewQr = vi.fn();
		const onQrCodeExpired = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: { ...qrCodeData, version: 'V2' } }}
				onGenerateNewQr={onGenerateNewQr}
				onQrCodeExpired={onQrCodeExpired}
			/>
		);

		expect(onQrCodeExpired).toHaveBeenCalledOnce();
		expect(screen.getAllByText('mobileQr.expired')).toHaveLength(2);
		expect(screen.getByTestId('icon: ClockOutline')).toBeInTheDocument();
		expect(screen.queryByTestId('qrcode-password')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'mobileQr.generateNewQrCode' }));
		expect(onGenerateNewQr).toHaveBeenCalledOnce();
	});

	it('should use close as the generate-new-QR fallback', () => {
		countdownMock.remainingSeconds = 0;
		const onClose = vi.fn();
		customRender(
			<MobileQrModal
				{...defaultProps}
				step="generate_qrcode"
				newQrCodeResp={{ qrcode_data: { ...qrCodeData, version: 'V2' } }}
				onClose={onClose}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'mobileQr.generateNewQrCode' }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
