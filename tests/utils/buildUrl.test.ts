import { buildUrl } from 'src/utils/buildUrl'

describe('buildUrl', () => {
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
