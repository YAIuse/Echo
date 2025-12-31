import fetchMock from 'jest-fetch-mock'

export const fetchMockCheckRequest = (path?: string, object?: Object) =>
	expect(fetchMock).toHaveBeenCalledWith(
		path ? path : expect.any(String),
		object ? expect.objectContaining(object) : expect.any(Object)
	)

export const fetchMockRequestNetworkError = () =>
	fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

const mockReqJson = (status: number) => ({
	status,
	headers: { 'Content-Type': 'application/json' }
})

export const fetchMockResponseJsonSuccess = () =>
	fetchMock.mockResponseOnce(JSON.stringify({ ok: true }), mockReqJson(200))

export const fetchMockResponseJsonFailed = () =>
	fetchMock.mockResponseOnce(JSON.stringify({ ok: false }), mockReqJson(404))

export { fetchMock }
