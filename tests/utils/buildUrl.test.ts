import { buildUrl } from '../../src/utils/buildUrl'

describe('buildUrl', () => {
	describe('Checking the Path build', () => {
		test('Combines URLs', () => {
			const baseURL = 'https://example.com/api/'
			const url = '/v1/resource'

			const result = buildUrl(baseURL, url)
			const result2 = buildUrl(`${baseURL}`, url)

			expect(result).toBe('https://example.com/api/v1/resource')
			expect(result2).toBe('https://example.com/api/v1/resource')
		})

		test('Merges without baseUrl', () => {
			const url = '/api/v1/resource'

			const result = buildUrl(undefined, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Merges with an empty baseUrl', () => {
			const baseURL = ''
			const url = '/api/v1/resource'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Combines with incorrect URLs', () => {
			const baseURL = 'https://example.com/api/'
			const url = '/%%invalid-url/'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('https://example.com/api/%%invalid-url')
		})

		test('We do not remove the search parameters from the URL', () => {
			const baseURL = 'https://example.com/api'
			const url = 'v1/resource?existing=1&search=test'

			const result = buildUrl(baseURL, url)

			expect(result).toBe(
				'https://example.com/api/v1/resource?existing=1&search=test'
			)
		})

		test('Returns the full absolute url', () => {
			const baseURL = 'https://example.com/api'
			const url = 'https://another-site.com/v1/resource?query=test'

			const result = buildUrl(baseURL, url)

			expect(result).toBe('https://another-site.com/v1/resource?query=test')
		})
	})

	describe('Checking the Params build', () => {
		const url = 'http://example'

		test('Конструировать параметры в string', () => {
			const params = { search: 'test', test: 10 }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?search=test&test=10')
		})

		test('Process arrays in parameters', () => {
			const params = { tags: ['foo', 'bar'] }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar')
		})

		test('Ignore undefined and null values', () => {
			const params = {
				search: 'test',
				tag: undefined,
				extra: null
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?search=test')
		})

		test('Ignore empty rows in the array', () => {
			const params = { tags: ['foo', '', 'bar'] }

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar')
		})

		test('Ignore undefined, null, and empty strings in the array', () => {
			const params = {
				tags: ['foo', '', 'bar', undefined, null, 'baz']
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?tags=foo&tags=bar&tags=baz')
		})

		test('Return the original url if there are no parameters', () => {
			const result = buildUrl(undefined, url)

			expect(result).toBe('http://example')
		})

		test('Return the original url with all empty values', () => {
			const params = {
				search: '',
				tags: [],
				value: null,
				count: undefined
			}

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example')
		})

		test('Skips inherited properties', () => {
			const parent = { inherited: 'value' }
			const params = Object.create(parent)
			params.own = 'ownValue'

			const result = buildUrl(undefined, url, params)

			expect(result).toBe('http://example?own=ownValue')
		})
	})
})
