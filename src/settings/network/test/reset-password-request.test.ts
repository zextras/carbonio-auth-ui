/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacySoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { resetPasswordRequest } from '../reset-password-request';

vi.mock('@zextras/carbonio-ui-soap-lib', () => ({
	legacySoapFetch: vi.fn().mockResolvedValue({})
}));

describe('resetPasswordRequest', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call legacySoapFetch with the ResetPassword action', async () => {
		await resetPasswordRequest({ password: 'newPass123' });
		expect(legacySoapFetch).toHaveBeenCalledWith('ResetPassword', expect.any(Object));
	});

	it('should pass the correct namespace and password in the payload', async () => {
		await resetPasswordRequest({ password: 'mySecret!' });
		expect(legacySoapFetch).toHaveBeenCalledWith('ResetPassword', {
			_jsns: 'urn:zimbraAccount',
			password: 'mySecret!'
		});
	});
});
