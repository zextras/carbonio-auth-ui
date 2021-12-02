export const fetchSoap = (api, body) =>
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
