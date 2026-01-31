import { EchoError, isEchoError } from './error'
import { EchoFetch } from './fetch'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { deepMerge } from './utils/deepMerge'
import { errorMessage } from './utils/errorMessage'

export class EchoMethods {
	constructor(
		readonly request: <T>(config: EchoConfig) => Promise<EchoResponse<T>>
	) {}

	get = <T>(url: string, options: EchoRequestOptions = {}) => {
		return this.request<T>({ method: 'GET', url, ...options })
	}
	post = <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
		return this.request<T>({ method: 'POST', url, body, ...options })
	}
	put = <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
		return this.request<T>({ method: 'PUT', url, body, ...options })
	}
	patch = <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
		return this.request<T>({ method: 'PATCH', url, body, ...options })
	}
	delete = <T>(url: string, options: EchoRequestOptions = {}) => {
		return this.request<T>({ method: 'DELETE', url, ...options })
	}
}

export type EchoClientInstance = Omit<EchoClient, 'createConfig'>

export class EchoClient extends EchoFetch implements EchoMethods {
	constructor(protected readonly createConfig: EchoCreateConfig = {}) {
		super()
	}

	request = async <T>(configure: EchoConfig): Promise<EchoResponse<T>> => {
		const config = deepMerge(this.createConfig, configure)
		const request = this.configurator(config)

		return await this.fetch<T>(config, request).catch(err => {
			if (isEchoError(err)) throw err
			throw new EchoError(errorMessage(err), config, request)
		})
	}

	private methods = new EchoMethods(this.request)

	get = this.methods.get
	post = this.methods.post
	put = this.methods.put
	patch = this.methods.patch
	delete = this.methods.delete
}
