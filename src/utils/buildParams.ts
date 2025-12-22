import type { EchoSearchParams } from 'src/types'

export function buildParams(url: string, params?: EchoSearchParams): string {
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
