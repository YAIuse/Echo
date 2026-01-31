import { deepMerge } from '../../src/utils/deepMerge'

describe('deepMerge', () => {
	test('Combines two simple objects', () => {
		const target = { a: 1, b: 2 }
		const source = { b: 3, c: 4 }

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: 1, b: 3, c: 4 })

		expect(result).not.toBe(target)
		expect(result).not.toBe(source)

		expect(target).toEqual({ a: 1, b: 2 })
		expect(source).toEqual({ b: 3, c: 4 })
	})

	test('Combines nested objects', () => {
		const target = { a: { b: 1 } }
		const source = { a: { c: 2 } }

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: { b: 1, c: 2 } })

		expect(result.a).not.toBe(target.a)

		expect(result.a.c).toBe(source.a.c)

		expect(target).toEqual({ a: { b: 1 } })
		expect(source).toEqual({ a: { c: 2 } })
	})

	test('Combines objects with different values', () => {
		const target = {
			a: 1,
			b: new Set([1, 2]),
			c: { d: { h: undefined }, b: null },
			g: 'test2'
		}
		const source = {
			a: 2,
			b: [3, 4],
			c: { e: 2, b: { k: 1 } },
			f: 'test'
		}

		const result = deepMerge(target, source)

		expect(result).toEqual({
			a: 2,
			b: [3, 4],
			c: { d: { h: undefined }, e: 2, b: { k: 1 } },
			f: 'test',
			g: 'test2'
		})

		expect(result.c.d).not.toBe(target.c.d)

		expect(result.b).toBe(source.b)
		expect(result.c.b).toBe(source.c.b)
	})

	test('Combining with an empty target', () => {
		const target = {}
		const source = { a: 1 }

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: 1 })
	})

	test('Combining with an empty source', () => {
		const target = { a: 1 }
		const source = {}

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: 1 })
	})

	test('Combining with an empty target and source', () => {
		const target = {}
		const source = {}

		const result = deepMerge(target, source)

		expect(result).not.toBeNull()
		expect(result).not.toBeUndefined()
		expect(result).toEqual({})
	})

	test('Unsupported data is unchanged', () => {
		const fn = () => 'test'
		const target = { a: fn, e: [{ g: { l: 1 }, r: 2 }] }
		const source = { b: { c: fn }, h: [{ d: 2, c: 3 }] }
		const result = deepMerge(target, source)

		expect(result).toEqual({
			a: fn,
			e: [{ g: { l: 1 }, r: 2 }],
			b: { c: fn },
			h: [{ d: 2, c: 3 }]
		})

		expect(result.a).toBe(target.a)
		expect(result.e).toBe(target.e)
		expect(result.e[0].g).toBe(target.e[0].g)
		expect(result.e[0]).toBe(target.e[0])
		expect(result.b).toBe(source.b)
		expect(result.h).toBe(source.h)
	})
})
