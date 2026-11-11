/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const stepsNames = {
	set_label: 'set_label',
	generate_qrcode: 'generate_qrcode',
	delete_password: 'delete_password'
} as const;

export type StepName = (typeof stepsNames)[keyof typeof stepsNames];
export type QrStepName = 'set_label' | 'generate_qrcode';
