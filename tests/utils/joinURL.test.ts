import { joinURL } from 'src/utils/joinURL'

describe('joinURL', () => {
	test('Объединения URL', () => {
		const baseURL = 'https://example.com/api/'
		const url = '/v1/resource'

		const result = joinURL(baseURL, url)
		const result2 = joinURL(`${baseURL}`, url)

		expect(result).toBe('https://example.com/api/v1/resource')
		expect(result2).toBe('https://example.com/api/v1/resource')
	})

	test('Объединения без baseURL', () => {
		const url = '/api/v1/resource'

		const result = joinURL(undefined, url)

		expect(result).toBe('/api/v1/resource')
	})

	test('Объединения с пустым baseURL', () => {
		const baseURL = ''
		const url = '/api/v1/resource'

		const result = joinURL(baseURL, url)

		expect(result).toBe('/api/v1/resource')
	})

	test('Объединения с некорректными URL', () => {
		const baseURL = 'https://example.com/api'
		const url = '/%%invalid-url'

		const result = joinURL(baseURL, url)

		expect(result).toBe('https://example.com/api/%%invalid-url')
	})

	test('Удалять параметры поиска из URL', () => {
		const baseURL = 'https://example.com/api'
		const url = 'v1/resource?existing=1&search=test'

		const result = joinURL(baseURL, url)

		expect(result).toBe('https://example.com/api/v1/resource')
	})

	test('Объединение с полным абсолютным url', () => {
		const baseURL = 'https://example.com/api'
		const url = 'https://another-site.com/v1/resource?query=test'

		const result = joinURL(baseURL, url)

		expect(result).toBe('https://another-site.com/v1/resource')
	})
})
