type PlainObject = Record<string, any>

type IsPlainObject<T> = T extends object
	? T extends Function | Date | Map<any, any> | Set<any> | FormData | any[]
		? false
		: true
	: false

type DeepMergeResult<T, S> = {
	[K in keyof T | keyof S]: K extends keyof S
		? K extends keyof T
			? IsPlainObject<T[K]> extends true
				? IsPlainObject<S[K]> extends true
					? DeepMergeResult<T[K], S[K]>
					: S[K]
				: S[K]
			: S[K]
		: K extends keyof T
			? T[K]
			: never
}

const isPlainObject = (value: any): value is PlainObject =>
	Object.prototype.toString.call(value) === '[object Object]'

const clone = <T>(value: T): T => {
	if (value instanceof Date) {
		return new Date(value.getTime()) as T
	} else if (Array.isArray(value)) {
		return value.map(clone) as any
	} else if (value instanceof Map) {
		return new Map([...value].map(([k, v]) => [k, clone(v)])) as T
	} else if (value instanceof Set) {
		return new Set([...value].map(clone)) as T
	} else if (typeof FormData !== 'undefined' && value instanceof FormData) {
		const fd = new FormData()
		for (const [k, v] of value.entries()) {
			fd.append(k, v)
		}
		return fd as T
	} else if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, clone(v)])
		) as T
	} else {
		return value
	}
}

export function deepMerge<T extends PlainObject, S extends PlainObject>(
	target: T,
	source: S
): DeepMergeResult<T, S> {
	const result = clone(target) as PlainObject

	for (const [key, srcValue] of Object.entries(source)) {
		const tgtValue = result[key]
		result[key] =
			isPlainObject(tgtValue) && isPlainObject(srcValue)
				? deepMerge(tgtValue, srcValue)
				: clone(srcValue)
	}
	return result as DeepMergeResult<T, S>
}
