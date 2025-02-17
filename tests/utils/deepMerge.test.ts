import { deepMerge } from 'src/utils/deepMerge'

describe('deepMerge', () => {
	test('объединяет два простых объекта', () => {
		const target = { a: 1, b: 2 }
		const source = { b: 3, c: 4 }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({ a: 1, b: 3, c: 4 })

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)

		// Проверяем, что исходные объекты не изменились
		expect(target).toEqual({ a: 1, b: 2 })
		expect(source).toEqual({ b: 3, c: 4 })
	})

	test('объединяет вложенные объекты', () => {
		const target = { a: { b: 1 } }
		const source = { a: { c: 2 } }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({ a: { b: 1, c: 2 } })

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)
		expect(result.a).not.toBe(target.a)

		// Проверяем, что исходные объекты не изменились
		expect(target).toEqual({ a: { b: 1 } })
		expect(source).toEqual({ a: { c: 2 } })
	})

	test('объединяет объекты с разными значений', () => {
		const target = {
			a: 1,
			b: new Set([1, 2]),
			c: { d: undefined, b: null },
			g: 'test2'
		}
		const source = { a: 2, b: new Set([3, 4]), c: { e: 2, b: 1 }, f: 'test' }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({
			a: 2,
			b: new Set([3, 4]),
			c: { d: undefined, e: 2, b: 1 },
			f: 'test',
			g: 'test2'
		})

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)
		expect(result.b).not.toBe(source.b)
		expect(result.c).not.toBe(source.c)
	})

	test('объединение с пустым объектом', () => {
		const target = {}
		const source = { a: 1 }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({ a: 1 })

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)

		// Проверяем, что исходные объекты не изменились
		expect(target).toEqual({})
		expect(source).toEqual({ a: 1 })
	})

	test('объединение объектов с пустыми значениями', () => {
		const target = { a: { b: 1 } }
		const source = { a: { b: undefined, c: 2 } }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({ a: { b: undefined, c: 2 } })

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)

		// Проверяем, что исходные объекты не изменились
		expect(target).toEqual({ a: { b: 1 } })
		expect(source).toEqual({ a: { b: undefined, c: 2 } })
	})

	test('заменяет массивы', () => {
		const target = { a: [1, 2], e: [{ g: { l: 1 }, r: 2 }] }
		const source = { a: [3, 4], b: [{ d: 2, c: 3 }] }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({
			a: [3, 4],
			e: [{ g: { l: 1 }, r: 2 }],
			b: [{ d: 2, c: 3 }]
		})

		// Проверяем, что результат не ссылки
		expect(result).not.toBe(target)
		expect(result).not.toBe(source)
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)
		expect(result.e).not.toBe(target.e)
		expect(result.e[0]).not.toBe(target.e[0])
		expect(result.e[0].g).not.toBe(target.e[0].g)
		expect(result.b).not.toBe(source.b)
		expect(result.b[0]).not.toBe(source.b[0])
		expect(result.b).not.toBe(source.b)

		// Проверяем, что исходные объекты не изменились
		expect(target.a).toEqual([1, 2])
		expect(source.a).toEqual([3, 4])
	})

	test('заменяет Map', () => {
		const target = { a: new Map([['key1', 'value1']]) }
		const source = { a: new Map([['key2', 'value2']]) }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result.a).toBeInstanceOf(Map)
		expect(result.a.get('key1')).toBe(undefined)
		expect(result.a.get('key2')).toBe('value2')

		// Проверяем, что результат не ссылки
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)

		// Проверяем, что исходные объекты не изменились
		expect(target.a.get('key1')).toBe('value1')
		expect(source.a.get('key2')).toBe('value2')
	})

	test('заменяет Set', () => {
		const target = { a: new Set([1, 2]) }
		const source = { a: new Set([3, 4]) }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result.a).toBeInstanceOf(Set)
		expect(result.a.has(1)).toBe(false)
		expect(result.a.has(3)).toBe(true)

		// Проверяем, что результат не ссылки
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)

		// Проверяем, что исходные объекты не изменились
		expect(target.a.has(1)).toBe(true)
		expect(source.a.has(3)).toBe(true)
	})

	test('заменяет Date', () => {
		const target = { a: new Date(2020, 0, 1) }
		const source = { a: new Date(2025, 0, 1) }

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result.a).toBeInstanceOf(Date)
		expect(result.a.getFullYear()).toBe(2025)

		// Проверяем, что результат не ссылки
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)

		// Проверяем, что исходные объекты не изменились
		expect(target.a.getFullYear()).toBe(2020)
		expect(source.a.getFullYear()).toBe(2025)
	})

	test('заменяет FormData', () => {
		const target = { a: new FormData() }
		target.a.append('key1', 'value1')

		const source = { a: new FormData() }
		source.a.append('key2', 'value2')

		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		const resultEntries = Array.from(result.a.entries())
		expect(resultEntries).toEqual([['key2', 'value2']])

		// Проверяем, что результат не ссылки
		expect(result.a).not.toBe(target.a)
		expect(result.a).not.toBe(source.a)

		// Проверяем, что исходные объекты не изменились
		const targetEntries = Array.from(target.a.entries())
		expect(targetEntries).toEqual([['key1', 'value1']])

		const sourceEntries = Array.from(source.a.entries())
		expect(sourceEntries).toEqual([['key2', 'value2']])
	})

	test('Неподдерживаемые данные без изменений', () => {
		// Передаём функцию, которая не является plain object, массивом, Date, Map, Set или FormData.
		const fn = () => 'test'
		const target = { a: fn }
		const source = { b: { c: fn } }
		const result = deepMerge(target, source)

		// Проверяем, что результат правильный
		expect(result).toEqual({
			a: fn,
			b: { c: fn }
		})

		// Проверяем, что результат ссылка
		expect(result.a).toBe(fn)
		expect(result.b.c).toBe(fn)

		// Проверяем, что результат не ссылка
		expect(result.b).not.toBe(source.b)
	})
})
