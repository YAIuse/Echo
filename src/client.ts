import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoRequest,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { buildFullUrl } from './utils/buildFullUrl'
import { deepMerge } from './utils/deepMerge'
import { errorMessage } from './utils/errorMessage'
import { formattedBody } from './utils/formattedBody'

export type EchoClientInstance = Omit<EchoClient, 'createConfig'>

export class EchoClient {
	constructor(private readonly createConfig: EchoCreateConfig = {}) {}

	protected configurator = (config: EchoConfig) => {
		const { baseURL, url, params, body, ...configure } = {
			...config,
			...(config.headers && { headers: { ...config.headers } })
		}

		const request: EchoRequest = {
			...configure,
			url: buildFullUrl(baseURL, url, params),
			...(body && { body: formattedBody(body) })
		}

		if (request.headers && (body instanceof FormData || body instanceof Blob)) {
			delete request.headers?.['Content-Type']
		}

		return { request }
	}

	private parseByContentType = async (res: Response) => {
		const contentTypeRaw = res.headers.get('content-type') ?? ''
		const contentType = contentTypeRaw.split(';')[0].trim().toLowerCase()

		if (res.status === 204 || res.headers.get('content-length') === '0') {
			return null
		}

		try {
			switch (true) {
				case contentType === 'application/json':
				case contentType.endsWith('+json'):
					return await res.json()
				case contentType === 'application/xml':
				case contentType === 'text/xml':
				case contentType === 'application/xhtml+xml':
				case contentType.endsWith('+xml'):
					return await res.text()
				case contentType.startsWith('text/'):
					return await res.text()
				case contentType === 'multipart/form-data':
				case contentType === 'application/x-www-form-urlencoded':
					return await res.formData()
				default:
					return await res.blob()
			}
		} catch {
			return null
		}
	}

	private parseByResponseType = async (responseType: string, res: Response) => {
		switch (responseType) {
			case 'json':
				return await res.json()
			case 'text':
				return await res.text()
			case 'arrayBuffer':
				return await res.arrayBuffer()
			case 'blob':
				return await res.blob()
			case 'formData':
				return await res.formData()
			case 'stream':
				return res.body
			case 'original':
				return res
			default:
				throw new SyntaxError(`Unsupported responseType: ${responseType}`)
		}
	}

	private returnResponseData = async (req: EchoRequest, res: Response) => {
		if (!req.responseType) {
			return await this.parseByContentType(res)
		}

		try {
			return await this.parseByResponseType(req.responseType, res)
		} catch (err) {
			if (err instanceof Error && err.name === 'SyntaxError') {
				throw err
			}
			console.warn(
				`Failed to parse response as ${req.responseType}, falling back to automatic parsing.`
			)
			return await this.parseByContentType(res)
		}
	}

	protected fetch = async <T>(
		config: EchoConfig,
		request: EchoRequest
	): Promise<EchoResponse<T>> => {
		const fetchResponse = await fetch(request.url, request)
		const data = await this.returnResponseData(request, fetchResponse)
		const { ok, status, statusText, headers } = fetchResponse

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
				errorMessage(data || statusText),
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

	request = async <T>(config: EchoConfig): Promise<EchoResponse<T>> => {
		const { request } = this.configurator(deepMerge(this.createConfig, config))

		try {
			return await this.fetch<T>(config, request)
		} catch (err: any) {
			if (isEchoError(err)) throw err
			throw new EchoError(errorMessage(err.message), config, request)
		}
	}
	get = this.methods(this.request).get
	post = this.methods(this.request).post
	put = this.methods(this.request).put
	patch = this.methods(this.request).patch
	delete = this.methods(this.request).delete
}
