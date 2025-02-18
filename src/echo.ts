import { EchoClient } from './client'
import { isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoInterceptors,
	EchoRequestInterceptors,
	EchoResponse,
	EchoResponseInterceptors
} from './types'
import { deepMerge } from './utils/deepMerge'

export type EchoInstance = ReturnType<Echo['create']>

export class Echo extends EchoClient {
	create(createConfig: EchoCreateConfig = {}) {
		const requestInterceptors: EchoRequestInterceptors = new Map()
		const responseInterceptors: EchoResponseInterceptors = new Map()

		const runFulfilled = async <T>(
			type: EchoInterceptors,
			input: T
		): Promise<T> => {
			const interceptors =
				type === 'request' ? requestInterceptors : responseInterceptors

			for (const [_, { onFulfilled }] of interceptors) {
				if (!onFulfilled) continue
				input = (await onFulfilled(input as any)) as T
			}
			return input
		}

		const runRejected = async (
			type: EchoInterceptors,
			input: any
		): Promise<any> => {
			const interceptors =
				type === 'request' ? requestInterceptors : responseInterceptors

			let isHandled = false

			for (const [_, { onRejected }] of interceptors) {
				if (!onRejected) continue

				try {
					const result = await onRejected(input)

					if (result !== input) {
						input = result
						isHandled = true
						break
					}
				} catch (err) {
					throw err
				}
			}

			if (isHandled) return input
			throw input
		}

		const request = async <T>(
			configure: EchoConfig
		): Promise<EchoResponse<T>> => {
			const interceptedRequest = await runFulfilled<EchoConfig>(
				'request',
				deepMerge(createConfig, configure)
			).catch(async error => {
				return await runRejected('request', error)
			})

			const { request } = this.configurator(interceptedRequest)
			const response = await this.fetch<T>(configure, request).catch(
				async error => {
					if (!isEchoError(error)) return await runRejected('request', error)
					return await runRejected('response', error)
				}
			)

			return await runFulfilled<EchoResponse<T>>('response', response).catch(
				async error => {
					return await runRejected('response', error)
				}
			)
		}

		return {
			request,
			...this.methods(request),
			interceptors: {
				request: {
					use: (
						key: string,
						onFulfilled?:
							| ((value: EchoConfig) => EchoConfig | Promise<EchoConfig>)
							| null,
						onRejected?: null | ((error: any) => any)
					) => {
						requestInterceptors.set(key, { onFulfilled, onRejected })
					},
					eject: (key: string) => requestInterceptors.delete(key),
					clear: () => requestInterceptors.clear()
				},
				response: {
					use: (
						key: string,
						onFulfilled?:
							| null
							| ((value: EchoResponse) => EchoResponse | Promise<EchoResponse>),
						onRejected?: null | ((error: any) => any)
					) => {
						responseInterceptors.set(key, { onFulfilled, onRejected })
					},
					eject: (key: string) => responseInterceptors.delete(key),
					clear: () => responseInterceptors.clear()
				}
			}
		}
	}
}
