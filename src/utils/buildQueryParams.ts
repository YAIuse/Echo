import type { EchoSearchParams } from 'src/types'

export const buildQueryParams = (params?: EchoSearchParams) => {
	if (!params) return ''

	const searchParams = new URLSearchParams()

	for (const key in params) {
		if (Object.prototype.hasOwnProperty.call(params, key)) {
			const value = params[key]

			if (Array.isArray(value)) {
				value.forEach(item => {
					if (item !== undefined && item !== null && item !== '') {
						searchParams.append(key, item.toString())
					}
				})
			} else if (value !== undefined && value !== null && value !== '') {
				searchParams.set(key, value.toString())
			}
		}
	}

	const queryString = searchParams.toString().replace(/\+/g, '%20')
	return queryString ? `?${queryString}` : ''
}
