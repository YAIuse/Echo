export const formattedBody = (body: any): BodyInit | undefined => {
	if (body == null) return undefined

	if (
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		typeof body === 'string'
	) {
		return body
	}

	return JSON.stringify(body)
}
