export const formattedBody = (body: any): BodyInit | undefined => {
	if (
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		typeof body === 'string' ||
		body === null ||
		body === undefined
	) {
		return body
	}

	return JSON.stringify(body)
}
