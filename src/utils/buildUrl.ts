export const buildUrl = (baseURL: string | undefined, url: string): string => {
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) return url

	if (!baseURL) return url

	const hasTrailingSlash = baseURL.endsWith('/')
	const hasLeadingSlash = url.startsWith('/')

	let result: string

	if (hasTrailingSlash && hasLeadingSlash) {
		result = baseURL + url.slice(1)
	} else if (!hasTrailingSlash && !hasLeadingSlash) {
		result = `${baseURL}/${url}`
	} else {
		result = baseURL + url
	}

	if (result.length > 1 && result.endsWith('/')) {
		result = result.slice(0, -1)
	}

	return result
}
