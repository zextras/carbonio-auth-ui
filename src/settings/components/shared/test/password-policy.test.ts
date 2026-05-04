/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { renderHook } from '@testing-library/react';
import {
	type AccountSettings,
	useChangePasswordURL,
	useUserSettings
} from '@zextras/carbonio-shell-ui';

import { usePasswordPolicy } from '../password-policy';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn(),
	useChangePasswordURL: vi.fn()
}));

const EXTERNAL_URL = 'https://example.com/change';

function mockSettings(attrs: Record<string, string>): void {
	vi.mocked(useUserSettings).mockReturnValue({ attrs } as unknown as AccountSettings);
}

describe('usePasswordPolicy', () => {
	beforeEach(() => {
		vi.mocked(useChangePasswordURL).mockReturnValue(undefined);
		mockSettings({});
	});

	describe('canChangePassword', () => {
		it('should be true when zimbraFeatureChangePasswordEnabled is TRUE', () => {
			mockSettings({ zimbraFeatureChangePasswordEnabled: 'TRUE' });
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.canChangePassword).toBe(true);
		});

		it('should be false when zimbraFeatureChangePasswordEnabled is FALSE', () => {
			mockSettings({ zimbraFeatureChangePasswordEnabled: 'FALSE' });
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.canChangePassword).toBe(false);
		});

		it('should be false when zimbraFeatureChangePasswordEnabled is absent', () => {
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.canChangePassword).toBe(false);
		});
	});

	describe('externalUrl', () => {
		it('should return the URL when useChangePasswordURL returns a non-empty string', () => {
			vi.mocked(useChangePasswordURL).mockReturnValue(EXTERNAL_URL);
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.externalUrl).toBe(EXTERNAL_URL);
		});

		it('should return the trimmed URL when useChangePasswordURL returns a string with surrounding whitespace', () => {
			vi.mocked(useChangePasswordURL).mockReturnValue(`  ${EXTERNAL_URL}  `);
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.externalUrl).toBe(EXTERNAL_URL);
		});

		it('should return undefined when useChangePasswordURL returns undefined', () => {
			vi.mocked(useChangePasswordURL).mockReturnValue(undefined);
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.externalUrl).toBeUndefined();
		});

		it('should return undefined when useChangePasswordURL returns an empty string', () => {
			vi.mocked(useChangePasswordURL).mockReturnValue('');
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.externalUrl).toBeUndefined();
		});

		it('should return undefined when useChangePasswordURL returns a whitespace-only string', () => {
			vi.mocked(useChangePasswordURL).mockReturnValue('   ');
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.externalUrl).toBeUndefined();
		});
	});

	describe('resetEnabled', () => {
		it('should be true when zimbraFeatureResetPasswordStatus is enabled', () => {
			mockSettings({ zimbraFeatureResetPasswordStatus: 'enabled' });
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.resetEnabled).toBe(true);
		});

		it('should be false when zimbraFeatureResetPasswordStatus is disabled', () => {
			mockSettings({ zimbraFeatureResetPasswordStatus: 'disabled' });
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.resetEnabled).toBe(false);
		});

		it('should be false when zimbraFeatureResetPasswordStatus is absent', () => {
			const { result } = renderHook(() => usePasswordPolicy());
			expect(result.current.resetEnabled).toBe(false);
		});
	});
});
