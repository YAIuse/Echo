import { errorMessage } from '../../src/utils/errorMessage'

describe('errorMessage', () => {
	test('Отдает error', () => {
		const result = errorMessage('error')

		expect(result).toBe('error')
	})

	test('Отдает error.message', () => {
		const result = errorMessage({ message: 'error message' })

		expect(result).toBe('error message')
	})

	test('Отдает Unexpected error', () => {
		const result = errorMessage('')

		expect(result).toBe('Unexpected error')
	})
})
