/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

export type PasswordId = string;
export type Password = {
	id: PasswordId;
	label: string;
	enabled: boolean;
	services: [{ service: string }];
	created: number;
};

export type OtpId = string;

export type Otp = {
	id: OtpId;
	label: string;
	enabled: boolean;
	failed_attempts: number;
	created: number;
};

export type ViewProps = { passwords: Password[]; setPasswords: (password: Password[]) => void };

export type TableRow = {
	id: string;
	columns: [string, string, string, string];
	clickable: boolean;
};

export type OtpTableRow = {
	id: string;
	columns: [string, string, React.JSX.Element, string];
	clickable: boolean;
};
type TabViewWithPasswords = {
	passwords: Password[];
	setPasswords: (passwords: Password[]) => void;
};

export type Tab = {
	name: string;
	label: string;
	view: React.FC<TabViewWithPasswords> | React.FC;
	instruction: string;
	link?: string;
};
