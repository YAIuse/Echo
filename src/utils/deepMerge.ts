// объединяет конфиги с полным копированием
export const deepMerge = (
	target: Record<string, any>,
	source: Record<string, any>
): any => {
	const isPlainObject = (item: unknown): item is Record<string, any> =>
		item !== null &&
		typeof item === 'object' &&
		!(
			item instanceof Date ||
			item instanceof Map ||
			item instanceof Set ||
			item instanceof FormData ||
			Array.isArray(item)
		)

	return Object.entries(source).reduce(
		(acc, [key, sourceValue]) => {
			let newValue

			if (sourceValue instanceof Date) newValue = new Date(sourceValue)
			else if (sourceValue instanceof Map) newValue = new Map(sourceValue)
			else if (sourceValue instanceof Set) newValue = new Set(sourceValue)
			else if (Array.isArray(sourceValue)) newValue = [...sourceValue]
			else if (isPlainObject(sourceValue)) {
				const targetValue = isPlainObject(target[key]) ? target[key] : {}
				newValue = deepMerge(targetValue, sourceValue)
			} else newValue = sourceValue

			return { ...acc, [key]: newValue }
		},
		{ ...target }
	)
}
