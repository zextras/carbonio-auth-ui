/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { renderHook } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { useGenericErrorSnackbar } from '../use-generic-error-snackbar';

vi.mock('@zextras/carbonio-design-system', () => ({
	useSnackbar: vi.fn()
}));

vi.mock('react-i18next', () => ({
	useTranslation: vi.fn(() => [(key: string, fallback?: string): string => fallback ?? key])
}));

describe('useGenericErrorSnackbar', () => {
	const createSnackbarMock = vi.fn();

	beforeEach(() => {
		vi.mocked(useSnackbar).mockReturnValue(createSnackbarMock);
	});

	it('should call createSnackbar with severity error when invoked without arguments', () => {
		const { result } = renderHook(() => useGenericErrorSnackbar());
		result.current();
		expect(createSnackbarMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
	});

	it('should use the fallback label when invoked without arguments', () => {
		const { result } = renderHook(() => useGenericErrorSnackbar());
		result.current();
		expect(createSnackbarMock).toHaveBeenCalledWith(
			expect.objectContaining({ label: 'Something went wrong.' })
		);
	});

	it('should use the provided custom label when one is passed', () => {
		const { result } = renderHook(() => useGenericErrorSnackbar());
		result.current('Custom error occurred');
		expect(createSnackbarMock).toHaveBeenCalledWith(
			expect.objectContaining({ label: 'Custom error occurred' })
		);
	});

	it('should set autoHideTimeout to 3000', () => {
		const { result } = renderHook(() => useGenericErrorSnackbar());
		result.current();
		expect(createSnackbarMock).toHaveBeenCalledWith(
			expect.objectContaining({ autoHideTimeout: 3000 })
		);
	});

	it('should set hideButton to true and key to generic_error', () => {
		const { result } = renderHook(() => useGenericErrorSnackbar());
		result.current();
		expect(createSnackbarMock).toHaveBeenCalledWith(
			expect.objectContaining({ hideButton: true, key: 'generic_error' })
		);
	});
});
