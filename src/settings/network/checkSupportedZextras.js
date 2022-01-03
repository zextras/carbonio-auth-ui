export function checkSupportedZextras() {
	return fetch('/zx/auth/supported').then((res) => {
		if (res.status === 404) {
			return { hasZextras: false };
		}
		return { hasZextras: true };
	});
}
