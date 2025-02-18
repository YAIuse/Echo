import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoRequest,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { buildQueryParams } from './utils/buildQueryParams'
import { deepMerge } from './utils/deepMerge'
import { formattedBody } from './utils/formattedBody'
import { joinURL } from './utils/joinURL'

export type EchoClientInstance = Omit<EchoClient, 'createConfig'>

export class EchoClient {
	constructor(private readonly createConfig: EchoCreateConfig = {}) {}

	protected configurator = (config: EchoConfig) => {
		const { baseURL, url, params, body, ...configure } = {
			...config,
			headers: { ...config.headers }
		}

		const request: EchoRequest = {
			...configure,
			url: joinURL(baseURL, url) + buildQueryParams(params),
			body: formattedBody(body)
		}

		if (body instanceof FormData) {
			delete request.headers?.['Content-Type']
		}

		return { request, config }
	}

	private returnResponseData = async (req: EchoRequest, res: Response) => {
		if (!res.ok || !req.responseType) {
			const contentType = res.headers?.get('Content-Type') || ''

			if (contentType.includes('application/json')) {
				return res.json().catch(() => null)
			}
			if (contentType.includes('text/plain')) {
				return res.text().catch(() => null)
			}
			return res.json().catch(() => null)
		} else {
			switch (req.responseType) {
				case 'json':
					return res.json()
				case 'text':
					return res.text()
				case 'arrayBuffer':
					return res.arrayBuffer()
				case 'blob':
					return res.blob()
				case 'bytes':
					return res.bytes()
				case 'formData':
					return res.formData()
				case 'stream':
					return res.body
				case 'original':
					return res
				default:
					throw new Error(`Unsupported responseType: ${req.responseType}`)
			}
		}
	}

	protected fetch = async <T>(
		config: EchoConfig,
		request: EchoRequest
	): Promise<EchoResponse<T>> => {
		const fetchResponse = await fetch(request.url, request)
		const { ok, status, statusText, headers } = fetchResponse
		const data = await this.returnResponseData(request, fetchResponse)

		const response: EchoResponse = {
			data,
			status,
			statusText,
			headers: Object.fromEntries(headers.entries()),
			config,
			request
		}

		if (!ok) {
			throw new EchoError(
				data?.message || statusText || 'Unexpected error',
				config,
				request,
				response
			)
		}

		return response
	}

	protected methods = (
		request: <T>(config: EchoConfig) => Promise<EchoResponse<T>>
	) => ({
		get: <T>(url: string, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'GET', url, ...options })
		},
		post: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'POST', url, body, ...options })
		},
		put: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'PUT', url, body, ...options })
		},
		patch: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'PATCH', url, body, ...options })
		},
		delete: <T>(url: string, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'DELETE', url, ...options })
		}
	})

	request = async <T>(configure: EchoConfig): Promise<EchoResponse<T>> => {
		const { request, config } = this.configurator(
			deepMerge(this.createConfig, configure)
		)

		try {
			return await this.fetch<T>(config, request)
		} catch (err: any) {
			if (isEchoError(err)) throw err

			const errorMessage = err.message || 'Unexpected error'
			throw new EchoError(errorMessage, config, request)
		}
	}
	get = this.methods(this.request).get
	post = this.methods(this.request).post
	put = this.methods(this.request).put
	patch = this.methods(this.request).patch
	delete = this.methods(this.request).delete
}
