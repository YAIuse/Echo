import { errorMessage } from '../../src/utils/errorMessage'

describe('errorMessage', () => {
	test('Returns error', () => {
		const result = errorMessage('error')

		expect(result).toBe('error')
	})

	test('Returns error.message', () => {
		const result = errorMessage({ message: 'error message' })

		expect(result).toBe('error message')
	})

	test('Returns Unexpected error', () => {
		const result = errorMessage('')

		expect(result).toBe('Unexpected error')
	})
})
