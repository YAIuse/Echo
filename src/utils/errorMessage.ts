export function errorMessage(error: any): string {
	return error?.message || error || 'Unexpected error'
}
