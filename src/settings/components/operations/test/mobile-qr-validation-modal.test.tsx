/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import fetchMock from '../../../../test/fetchMock';
import { customRender } from '../../../../test/test-utils';
import { MobileQrMobileResponseValue } from '../../../network/mobile-qr-credential';
import { MobileQrValidationModal } from '../mobile-qr-validation-modal';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

const details: MobileQrMobileResponseValue = {
	requestedAt: 1794000861348,
	mobileGeneratedToken: '1234-123123',
	ipAddress: '1.2.3.4',
	mobileClientInfo: 'client info',
	location: 'Turkey',
	label: 'labelxxx',
	user: 'zextras@demo.zextras.io'
};

function typeCode(code: string): void {
	code.split('').forEach((digit, index) => {
		fireEvent.change(screen.getByTestId(`digit-input-${index}`), { target: { value: digit } });
	});
}

describe('MobileQrValidationModal', () => {
	beforeEach(() => {
		fetchMock.resetMocks();
	});

	it('should show the device details coming from the mobile response', () => {
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		expect(screen.getByText('1.2.3.4')).toBeInTheDocument();
		expect(screen.getByText('Turkey')).toBeInTheDocument();
		expect(screen.getByText('client info')).toBeInTheDocument();
		expect(screen.getByText('labelxxx')).toBeInTheDocument();
		expect(screen.getByText('zextras@demo.zextras.io')).toBeInTheDocument();
	});

	it('should render six separate digit boxes', () => {
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		expect(screen.getAllByLabelText(/^digit-\d$/)).toHaveLength(6);
	});

	it('should show the label of the credential', () => {
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		expect(screen.getByText('labelxxx')).toBeInTheDocument();
	});

	it('should show a three minutes countdown', () => {
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		expect(screen.getByTestId('validation-countdown')).toHaveTextContent('3:00');
	});

	it('should send MobileQRCredentialUIValidateNumberRequest once six digits are entered', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		await act(async () => {
			typeCode('123456');
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/service/soap/MobileQRCredentialUIValidateNumberRequest',
			expect.any(Object)
		);
		const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
		expect(body.Body.MobileQRCredentialUIValidateNumberRequest).toEqual({
			_jsns: 'urn:zextrasClient',
			label: 'labelxxx',
			user: 'zextras@demo.zextras.io',
			mobileGeneratedNumber: 123456
		});
	});

	it('should show success modal after validation', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		await act(async () => {
			typeCode('123456');
		});
		// Wait for success modal to appear
		expect(await screen.findByText('mobileQr.success.title')).toBeInTheDocument();
		expect(screen.getByTestId('icon: CheckCircleOutline')).toBeInTheDocument();
		expect(screen.getByText('mobileQr.success.pairedDescription')).toBeInTheDocument();
		expect(screen.getByText('client info')).toBeInTheDocument();
	});

	it('should call onValidated when success modal is closed', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: true } } }));
		const onValidated = vi.fn();
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={onValidated}
				onGenerateNewQr={vi.fn()}
			/>
		);
		await act(async () => {
			typeCode('123456');
		});
		// Wait for success modal to appear
		expect(await screen.findByText('mobileQr.success.title')).toBeInTheDocument();
		// Click OK button to close success modal
		const okButton = screen.getByText('buttons.ok');
		okButton.click();
		expect(onValidated).toHaveBeenCalled();
	});

	it('should show an error and clear the inputs when the code is rejected', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: { response: { ok: false } } }));
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		await act(async () => {
			typeCode('123456');
		});
		// Should show error message (attempts remaining since error handling increments attempts)
		expect(await screen.findByText('mobileQr.validation.attemptsRemaining')).toBeInTheDocument();
		expect(screen.getByTestId('digit-input-0')).toHaveValue('');
	});

	it('should not send the request before six digits are entered', async () => {
		customRender(
			<MobileQrValidationModal
				open
				details={details}
				onClose={vi.fn()}
				onValidated={vi.fn()}
				onGenerateNewQr={vi.fn()}
			/>
		);
		await act(async () => {
			typeCode('12345');
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('should disable the inputs and show the expired message after three minutes', async () => {
		vi.useFakeTimers();
		try {
			customRender(
				<MobileQrValidationModal
					open
					details={details}
					onClose={vi.fn()}
					onValidated={vi.fn()}
					onGenerateNewQr={vi.fn()}
				/>
			);
			act(() => {
				vi.advanceTimersByTime(180 * 1000);
			});
			expect(screen.getByText('mobileQr.validation.expired')).toBeInTheDocument();
			expect(screen.getByTestId('digit-input-0')).toBeDisabled();
		} finally {
			vi.useRealTimers();
		}
	});
});
