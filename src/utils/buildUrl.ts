import type { EchoSearchParams } from '../types'

function buildPath(baseURL: string | undefined, url: string): string {
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

function buildParams(url: string, params?: EchoSearchParams): string {
	if (!params || Object.keys(params).length === 0) return url

	const [path, existingQuery] = url.split('?')
	const mergedParams = new URLSearchParams(existingQuery || '')

	for (const key in params) {
		if (!Object.prototype.hasOwnProperty.call(params, key)) continue

		const value = params[key]

		if (Array.isArray(value)) {
			value.forEach(item => {
				if (item !== undefined && item !== null && item !== '') {
					mergedParams.append(key, String(item))
				}
			})
		} else if (value !== undefined && value !== null && value !== '') {
			mergedParams.append(key, String(value))
		}
	}

	const queryString = mergedParams.toString().replace(/\+/g, '%20')
	return queryString ? `${path}?${queryString}` : path
}

export function buildUrl(
	baseURL: string | undefined,
	url: string,
	params?: EchoSearchParams
): string {
	const finalUrl = buildPath(baseURL, url)
	return buildParams(finalUrl, params)
}
