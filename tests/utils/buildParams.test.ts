import { buildParams } from 'src/utils/buildParams'

describe('buildParams', () => {
	let url: string

	beforeEach(() => {
		url = 'http://example'
	})

	test('Конструировать параметры в string', () => {
		const params = { search: 'test', test: 10 }

		const result = buildParams(url, params)

		expect(result).toBe('http://example?search=test&test=10')
	})

	test('Обрабатывать массивы в параметрах', () => {
		const params = { tags: ['foo', 'bar'] }

		const result = buildParams(url, params)

		expect(result).toBe('http://example?tags=foo&tags=bar')
	})

	test('Игнорировать undefined и null значения', () => {
		const params = {
			search: 'test',
			tag: undefined,
			extra: null
		}

		const result = buildParams(url, params)

		expect(result).toBe('http://example?search=test')
	})

	test('Возвращать изначальный url при отсутствии параметров', () => {
		const result = buildParams(url)

		expect(result).toBe('http://example')
	})

	test('Возвращать изначальный url при всех пустых значениях', () => {
		const params = {
			search: '',
			tags: [],
			value: null,
			count: undefined
		}

		const result = buildParams(url, params)

		expect(result).toBe('http://example')
	})

	test('Пропускает унаследованные свойства', () => {
		const parent = { inherited: 'value' }
		const params = Object.create(parent)
		params.own = 'ownValue'

		const result = buildParams(url, params)

		expect(result).toBe('http://example?own=ownValue')
	})
})
