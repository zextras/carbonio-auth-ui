/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fetchMock from '../../../test/fetchMock';
import { fetchSoap } from '../fetchSoap';

describe('fetchSoap', () => {
	beforeEach(() => {
		fetchMock.resetMocks();
	});

	it('should POST to the correct SOAP endpoint URL', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: {} }));
		await fetchSoap('ChangePasswordRequest', {});
		expect(fetchMock).toHaveBeenCalledWith(
			'/service/soap/ChangePasswordRequest',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('should wrap the request body in a SOAP envelope with the correct structure', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: {} }));
		const requestBody = { _jsns: 'urn:zimbraAccount', foo: 'bar' };
		await fetchSoap('TestApi', requestBody);

		const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
		const parsedBody = JSON.parse(options.body as string);
		expect(parsedBody.Body.TestApi).toEqual(requestBody);
		expect(parsedBody.Header.context._jsns).toBe('urn:zimbra');
	});

	it('should set the Content-Type header to application/json', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ Body: {} }));
		await fetchSoap('TestApi', {});

		const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
	});

	it('should return the Body field from the JSON response', async () => {
		const responseBody = { ChangePasswordResponse: { authToken: 'token123' } };
		fetchMock.mockResponseOnce(JSON.stringify({ Body: responseBody }));
		const result = await fetchSoap('ChangePasswordRequest', {});
		expect(result).toEqual(responseBody);
	});
});
