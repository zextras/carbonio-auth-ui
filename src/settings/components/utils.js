/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getI18n } from '@zextras/carbonio-shell-ui';
import { Buffer } from 'buffer';
import { isEqual, transform, isObject, filter } from 'lodash';

export const differenceObject = (object, base) => {
	// eslint-disable-next-line no-shadow
	// eslint-disable-next-line @typescript-eslint/no-shadow
	function changes(object, base) {
		return transform(object, (result, value, key) => {
			if (!isEqual(value, base[key])) {
				// eslint-disable-next-line no-param-reassign
				result[key] = isObject(value) && isObject(base[key]) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
};

export const findLabel = (list, value) => filter(list, (item) => item.value === value)[0].label;

export const formatDate = (date) => {
	if (!date) return '/';
	return (
		// eslint-disable-next-line prefer-template
		new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
		' | ' +
		new Date(date).toLocaleTimeString('en-US')
	);
};

export function formatDateUsingLocale(timeInMillis) {
	if (!timeInMillis) return '/';
	const dateTime = new Date(timeInMillis);
	const date = new Intl.DateTimeFormat(getI18n('carbonio-auth-ui').language, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(dateTime);
	const time = new Intl.DateTimeFormat(getI18n('carbonio-auth-ui').language, {
		hour: '2-digit',
		minute: '2-digit',
		second: 'numeric'
	}).format(dateTime);
	return `${date} | ${time}`;
}

export const copyToClipboard = (text) => {
	if (/Firefox\//i.test(navigator.userAgent)) {
		navigator.clipboard.writeText(text).then();
	} else {
		const password = document.createElement('textarea');
		document.body.appendChild(password);
		password.value = text;
		password.select();
		document.execCommand('copy');
		document.body.removeChild(password);
	}
};

export const objToBase64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64');
