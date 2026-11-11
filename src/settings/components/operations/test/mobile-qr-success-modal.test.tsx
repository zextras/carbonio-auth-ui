/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { customRender } from '../../../../test/test-utils';
import { MobileQrSuccessModal } from '../mobile-qr-success-modal';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	getI18n: vi.fn(() => ({ language: 'en_US' })),
	t: (key: string): string => key
}));

describe('MobileQrSuccessModal', () => {
	it('should show device paired success message', () => {
		customRender(
			<MobileQrSuccessModal open details={{ mobileClientInfo: 'iPhone 14' }} onClose={vi.fn()} />
		);
		expect(screen.getByText('appMobile.new')).toBeInTheDocument();
		expect(screen.getByText('mobileQr.success.devicePaired')).toBeInTheDocument();
		expect(screen.getByText('mobileQr.success.pairedDescription')).toBeInTheDocument();
		expect(screen.getByText('iPhone 14')).toBeInTheDocument();
	});

	it('should render success icon', () => {
		customRender(
			<MobileQrSuccessModal open details={{ mobileClientInfo: 'iPhone 14' }} onClose={vi.fn()} />
		);
		expect(screen.getByTestId('icon: CheckmarkCircleOutline')).toBeInTheDocument();
	});

	it('should show device info', () => {
		customRender(
			<MobileQrSuccessModal
				open
				details={{ mobileClientInfo: 'Samsung Galaxy S23' }}
				onClose={vi.fn()}
			/>
		);
		expect(screen.getByText('mobileQr.success.device')).toBeInTheDocument();
		expect(screen.getByText('Samsung Galaxy S23')).toBeInTheDocument();
	});

	it('should call onClose when OK button is clicked', () => {
		const onClose = vi.fn();
		customRender(
			<MobileQrSuccessModal open details={{ mobileClientInfo: 'iPhone 14' }} onClose={onClose} />
		);
		const okButton = screen.getByText('buttons.ok');
		okButton.click();
		expect(onClose).toHaveBeenCalled();
	});

	it('should not show device info when empty string', () => {
		customRender(
			<MobileQrSuccessModal open details={{ mobileClientInfo: '' }} onClose={vi.fn()} />
		);
		// Device info section should not be shown for empty string
		expect(screen.queryByText('mobileQr.success.device')).not.toBeInTheDocument();
	});
});
