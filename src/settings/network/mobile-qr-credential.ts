/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchSoap } from './fetchSoap';

const ZEXTRAS_CLIENT_NS = 'urn:zextrasClient';

export type MobileQrTokenCheckValue = {
	tokenExists: boolean;
};

export type MobileQrMobileResponseValue = {
	requestedAt: number;
	mobileGeneratedToken: string;
	ipAddress: string;
	mobileClientInfo: string;
	location: string;
	label: string;
	user: string;
};

type SoapResponse<T> = {
	response: {
		ok: boolean;
		message?: string;
		value?: T;
	};
};

export const mobileQrTokenCheckRequest = (
	token: string,
	user: string
): Promise<SoapResponse<MobileQrTokenCheckValue>> =>
	fetchSoap('MobileQRCredentialUITokenCheckRequest', {
		_jsns: ZEXTRAS_CLIENT_NS,
		token,
		user
	});

export const mobileQrMobileResponseRequest = (
	label: string,
	user: string
): Promise<SoapResponse<MobileQrMobileResponseValue>> =>
	fetchSoap('MobileQRCredentialUIMobileResponseRequest', {
		_jsns: ZEXTRAS_CLIENT_NS,
		label,
		user
	});

export const mobileQrValidateNumberRequest = (
	label: string,
	user: string,
	mobileGeneratedNumber: number
): Promise<SoapResponse<unknown>> =>
	fetchSoap('MobileQRCredentialUIValidateNumberRequest', {
		_jsns: ZEXTRAS_CLIENT_NS,
		label,
		user,
		mobileGeneratedNumber
	});
