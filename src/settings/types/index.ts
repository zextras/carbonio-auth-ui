/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type PasswordId = string;

export type Password = {
	created: number;
	id: PasswordId;
	label: string;
	enabled: boolean;
	services: [{ service: string }];
};

export type ViewProps = { passwords: Password[]; setPasswords: (password: Password[]) => void };

export type TableRow = {
	id: string;
	columns: [string, string, string, string];
	clickable: boolean;
};
