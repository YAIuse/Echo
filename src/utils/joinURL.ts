export const joinURL = (baseURL: string | undefined, url: string): string => {
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
		return url.split('?')[0]
	}

	if (!baseURL) return url.split('?')[0]

	const urlWithoutSearch = url.split('?')[0]

	const normalizedBaseURL = baseURL.endsWith('/')
		? baseURL.slice(0, -1)
		: baseURL

	const normalizedURL = urlWithoutSearch.startsWith('/')
		? urlWithoutSearch.slice(1)
		: urlWithoutSearch

	return `${normalizedBaseURL}/${normalizedURL}`
}
