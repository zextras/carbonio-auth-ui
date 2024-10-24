/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const fetchSoap = (api: string, body: Record<string, any>): Promise<any> =>
	fetch(`/service/soap/${api}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			Body: {
				[api]: body
			},
			Header: {
				context: {
					_jsns: 'urn:zimbra'
				}
			}
		})
	})
		.then((res) => res?.json())
		.then((res) => res.Body);
