type PlainObject = Record<string, unknown>

type DeepMerge<T, S> = {
	[K in keyof T | keyof S]: K extends keyof S
		? K extends keyof T
			? T[K] extends PlainObject
				? S[K] extends PlainObject
					? DeepMerge<T[K], S[K]>
					: S[K]
				: S[K]
			: S[K]
		: K extends keyof T
			? T[K]
			: never
}

const isPlainObject = (value: unknown): value is PlainObject => {
	if (value === null || typeof value !== 'object') return false
	const proto = Object.getPrototypeOf(value)
	return proto === Object.prototype || proto === null
}

const clone = <T>(value: T): T => {
	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, clone(v)])
		) as T
	}
	return value
}

export function deepMerge<T extends PlainObject, S extends PlainObject>(
	target: T,
	source: S
): DeepMerge<T, S> {
	const result = clone<PlainObject>(target)

	for (const [key, srcValue] of Object.entries(source)) {
		const tgtValue = result[key]
		result[key] =
			isPlainObject(tgtValue) && isPlainObject(srcValue)
				? deepMerge(tgtValue, srcValue)
				: srcValue
	}
	return result as DeepMerge<T, S>
}
