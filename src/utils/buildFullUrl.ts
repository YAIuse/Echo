import type { EchoSearchParams } from 'src/types'

import { buildParams } from './buildParams'
import { buildUrl } from './buildUrl'

export function buildFullUrl(
	baseURL: string | undefined,
	url: string,
	params?: EchoSearchParams
): string {
	const finalUrl = buildUrl(baseURL, url)
	return buildParams(finalUrl, params)
}
