export const formattedBody = (body: any): BodyInit | undefined => {
	if (!body) return
	return body instanceof FormData || typeof body === 'string'
		? body
		: JSON.stringify(body)
}
