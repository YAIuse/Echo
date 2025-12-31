import { buildUrl } from '../../src/utils/buildUrl'

describe('buildUrl', () => {
	describe('Проверка сборки Path', () => {
		test('Объединяет URL', () => {
			const baseURL = 'https://example.com/api/'
			const url = '/v1/resource'

			const result = buildUrl(baseURL, url)
			const result2 = buildUrl(`${baseURL}`, url)

			expect(result).toBe('https://example.com/api/v1/resource')
			expect(result2).toBe('https://example.com/api/v1/resource')
		})

		test('Объединяет без baseURL', () => {
			const url = '/api/v1/resource'

			const result = buildUrl(undefined, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Объединяет с пустым baseURL', () => {
			const baseURL = ''
			const url = '/api/v1/resource'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Объединяет с некорректными URL', () => {
			const baseURL = 'https://example.com/api/'
			const url = '/%%invalid-url/'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('https://example.com/api/%%invalid-url')
		})

		test('Не удаляем параметры поиска из URL', () => {
			const baseURL = 'https://example.com/api'
			const url = 'v1/resource?existing=1&search=test'

			const result = buildUrl(baseURL, url)

			expect(result).toBe(
				'https://example.com/api/v1/resource?existing=1&search=test'
			)
		})

		test('Отдает полный абсолютный url', () => {
			const baseURL = 'https://example.com/api'
			const url = 'https://another-site.com/v1/resource?query=test'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('https://another-site.com/v1/resource?query=test')
		})
	})

	describe('Проверка сборки Params', () => {
		const url = 'http://example'

		test('Конструировать параметры в string', () => {
			const params = { search: 'test', test: 10 }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?search=test&test=10')
		})

		test('Обрабатывать массивы в параметрах', () => {
			const params = { tags: ['foo', 'bar'] }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar')
		})

		test('Игнорировать undefined и null значения', () => {
			const params = {
				search: 'test',
				tag: undefined,
				extra: null
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?search=test')
		})

		test('Игнорировать пустые строки в массиве', () => {
			const params = { tags: ['foo', '', 'bar'] }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar')
		})

		test('Игнорировать undefined, null и пустые строки в массиве', () => {
			const params = {
				tags: ['foo', '', 'bar', undefined, null, 'baz']
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar&tags=baz')
		})

		test('Возвращать изначальный url при отсутствии параметров', () => {
			const result = buildUrl(undefined, url)

			expect(result).toBe('http://example')
		})

		test('Возвращать изначальный url при всех пустых значениях', () => {
			const params = {
				search: '',
				tags: [],
				value: null,
				count: undefined
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example')
		})

		test('Пропускает унаследованные свойства', () => {
			const parent = { inherited: 'value' }
			const params = Object.create(parent)
			params.own = 'ownValue'

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?own=ownValue')
		})
	})
})
