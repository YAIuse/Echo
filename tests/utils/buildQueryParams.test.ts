import { buildQueryParams } from 'src/utils/buildQueryParams'

describe('buildQueryParams', () => {
	test('Конструировать параметры в string', () => {
		const params = { search: 'test', test: 10 }

		const result = buildQueryParams(params)

		expect(result).toBe('?search=test&test=10')
	})

	test('Обрабатывать массивы в параметрах', () => {
		const params = { tags: ['foo', 'bar'] }

		const result = buildQueryParams(params)

		expect(result).toBe('?tags=foo&tags=bar')
	})

	test('Игнорировать undefined и null значения', () => {
		const params = {
			search: 'test',
			tag: undefined,
			extra: null
		}

		const result = buildQueryParams(params)

		expect(result).toBe('?search=test')
	})

	test('Возвращать пустую строку при отсутствии параметров', () => {
		const result = buildQueryParams(undefined)

		expect(result).toBe('')
	})

	test('Возвращать пустую строку при всех пустых значениях', () => {
		const params = {
			search: '',
			tags: [],
			value: null,
			count: undefined
		}

		const result = buildQueryParams(params)

		expect(result).toBe('')
	})
})
