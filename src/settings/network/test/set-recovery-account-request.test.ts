/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { setRecoveryAccountRequest } from '../set-recovery-account-request';

vi.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: vi.fn().mockResolvedValue({})
}));

describe('setRecoveryAccountRequest', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call legacySoapFetch with the SetRecoveryAccount action', async () => {
		await setRecoveryAccountRequest({ op: 'sendCode', recoveryAccount: 'user@example.com' });
		expect(legacySoapFetch).toHaveBeenCalledWith('SetRecoveryAccount', expect.any(Object));
	});

	it('should include recoveryAccount and strip undefined recoveryAccountVerificationCode', async () => {
		await setRecoveryAccountRequest({ op: 'sendCode', recoveryAccount: 'user@example.com' });
		const payload = vi.mocked(legacySoapFetch).mock.calls[0][1] as Record<string, unknown>;
		expect(payload).toEqual({
			_jsns: 'urn:zimbraMail',
			op: 'sendCode',
			recoveryAccount: 'user@example.com'
		});
		expect(payload).not.toHaveProperty('recoveryAccountVerificationCode');
	});

	it('should include only _jsns and op when no optional params are passed', async () => {
		await setRecoveryAccountRequest({ op: 'reset' });
		const payload = vi.mocked(legacySoapFetch).mock.calls[0][1] as Record<string, unknown>;
		expect(payload).toEqual({ _jsns: 'urn:zimbraMail', op: 'reset' });
	});

	it('should include recoveryAccountVerificationCode and omit recoveryAccount when not provided', async () => {
		await setRecoveryAccountRequest({
			op: 'validateCode',
			recoveryAccountVerificationCode: '1234'
		});
		const payload = vi.mocked(legacySoapFetch).mock.calls[0][1] as Record<string, unknown>;
		expect(payload).toHaveProperty('recoveryAccountVerificationCode', '1234');
		expect(payload).not.toHaveProperty('recoveryAccount');
	});
});
