import { EchoClient, EchoMethods } from './client'
import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoInterceptors,
	EchoRequestInterceptors,
	EchoResponse,
	EchoResponseInterceptors
} from './types'
import { deepMerge } from './utils/deepMerge'
import { errorMessage } from './utils/errorMessage'

export type EchoInstance = ReturnType<Echo['create']>

export class Echo extends EchoClient {
	create = (createConfig: EchoCreateConfig = {}) => {
		const requestINTS: EchoRequestInterceptors = new Map()
		const responseINTS: EchoResponseInterceptors = new Map()

		const runFulfilled = async <T>(
			type: EchoInterceptors,
			input: T
		): Promise<T> => {
			const interceptors = type === 'request' ? requestINTS : responseINTS

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
			const interceptors = type === 'request' ? requestINTS : responseINTS

			let isHandled = false

			for (const [_, { onRejected }] of interceptors) {
				if (!onRejected) continue

				const result = await onRejected(input)

				if (result !== input) {
					input = result
					isHandled = true
				}
			}

			if (!isHandled || input instanceof Error) throw input

			return input
		}

		const request = async <T>(
			configure: EchoConfig
		): Promise<EchoResponse<T>> => {
			const config = deepMerge(createConfig, configure)
			const intsConfig = await runFulfilled<EchoConfig>(
				'request',
				config
			).catch(async error => {
				return await runRejected('request', error)
			})

			const request = this.configurator(intsConfig)

			const response = await this.fetch<T>(config, request).catch(async err => {
				if (isEchoError(err)) return await runRejected('response', err)
				const requestError = new EchoError(
					errorMessage(err.message),
					config,
					request
				)
				return await runRejected('request', requestError)
			})

			return await runFulfilled<EchoResponse<T>>('response', response).catch(
				async error => {
					return await runRejected('response', error)
				}
			)
		}

		const methods = new EchoMethods(request)

		return {
			...methods,
			interceptors: {
				request: {
					use: (
						key: string,
						onFulfilled?:
							| ((value: EchoConfig) => EchoConfig | Promise<EchoConfig>)
							| null,
						onRejected?: null | ((error: any) => any)
					) => {
						requestINTS.set(key, {
							onFulfilled,
							onRejected
						})
					},
					eject: (key: string) => requestINTS.delete(key),
					clear: () => requestINTS.clear()
				},
				response: {
					use: (
						key: string,
						onFulfilled?:
							| null
							| ((value: EchoResponse) => EchoResponse | Promise<EchoResponse>),
						onRejected?: null | ((error: any) => any)
					) => {
						responseINTS.set(key, {
							onFulfilled,
							onRejected
						})
					},
					eject: (key: string) => responseINTS.delete(key),
					clear: () => responseINTS.clear()
				}
			}
		}
	}
}
