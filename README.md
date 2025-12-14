<div align="center">
    <a href="https://github.com/yaiuse/echo/" target="blank">
        <img src="https://raw.githubusercontent.com/yaiuse/echo/main/public/favicon.svg" width="500" alt="Project Logo" />
    </a>
</div>

<p align="center">An HTTP client built on fetch, offering an Axios-like experience with support for interceptors.</p>

<div align="center">

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/yaiuse/Echo)
[![npm Package](https://img.shields.io/npm/v/@yaiuse/echo?color=blue&logo=npm)](https://www.npmjs.com/package/@yaiuse/echo)
[![npm Downloads](https://img.shields.io/npm/dm/@yaiuse/echo?color=green&logo=npm)](https://www.npmjs.com/package/@yaiuse/echo)
[![Install Size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=@yaiuse/echo&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.com/result?p=@yaiuse/echo)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@yaiuse/echo?color=purple&logo=webpack)](https://bundlephobia.com/package/@yaiuse/echo@latest)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yaiuse/Echo/tests.yaml?branch=main&logo=githubactions)](https://github.com/yaiuse/Echo/actions)
[![Coverage Status](https://codecov.io/gh/yaiuse/Echo/branch/main/graph/badge.svg)](https://app.codecov.io/gh/yaiuse/Echo)
[![Snyk Security](https://snyk.io/test/npm/@yaiuse/echo/badge.svg)](https://snyk.io/test/npm/@yaiuse/echo)
[![License](https://img.shields.io/github/license/yaiuse/Echo?color=green)](https://github.com/yaiuse/Echo/blob/main/LICENSE)

</div>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Request Methods](#request-methods)
- [Creating an Instance](#creating-an-instance)
- [Request Config](#request-config)
- [Response Schema](#response-schema)
- [Interceptors](#interceptors)
  - [Request Interceptors](#request-interceptors)
  - [Response Interceptors](#response-interceptors)
- [Error Handling](#error-handling)
- [Using multipart/form-data](#using-multipartform-data)
- [TypeScript & ES6](#typescript--es6)
- [License](#license)

## Description

This is a lightweight HTTP client based on the built-in `fetch`, featuring a convenient syntax similar to [Axios](https://github.com/axios/axios). The library supports interceptors for requests and responses, making it easier to add headers, handle errors, log requests, and manage other networking aspects.

## Installation

```bash
# using npm
$ npm install @yaiuse/echo
# or using yarn
$ yarn add @yaiuse/echo
# or using bun
$ bun add @yaiuse/echo
```

## Quick Start

After installation, you can use an instance created via create to benefit from interceptors:

> **Note:** Only instances created via `echo.create(config)` support interceptors. The default `echo` instance (created without `create`) does not support interceptors.

```javascript
import echo from '@yaiuse/echo'

// Create an instance with base configuration and interceptors support
const echoBase = echo.create({
	baseURL: 'http://localhost:4200/api',
	headers: { 'Content-Type': 'application/json' }
})

// GET request with then
echoBase
	.get('/users')
	.then(response => {
		console.log(response)
	})
	.catch(error => {
		console.log(error)
	})

// POST request with async/await
const response = await echoBase.post('/login', {
	username: 'admin',
	password: '123456'
})
```

## Request Methods

The instance (or the default `echo`) supports the following methods:

- `request(config)`
- `get(url, options?)`
- `post(url, body?, options?)`
- `put(url, body?, options?)`
- `patch(url, body?, options?)`
- `delete(url, options?)`

Where:

- `url` — A string indicating the endpoint. If `baseURL` is set, it will be prepended unless `url` is an absolute path (e.g., starting with `http://` or `https://`, in which case `baseURL` will be ignored).
- `body` — The request body for methods that allow sending data (`POST`, `PUT`, `PATCH`).
- `options` — Additional configuration (`headers`, `responseType`, `params`, etc.).

## Creating an Instance

Example of creating an instance:

```javascript
import echo from '@yaiuse/echo'

// Define configuration
const config: EchoCreateConfig = {
    baseURL: 'http://localhost:4200/api',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include'
}

// Create an Echo instance with interceptors support
const echoBase = echo.create(config)

// Use `echoBase` like `echo`
const response = await echoBase.get('/users')
```

You can also create a minimal version of `echo`, acting as a simple wrapper around `fetch`:

```javascript
const echoServer = new EchoClient(config)
```

This can be useful for middleware requests that do not require interceptors or additional logic:

```javascript
const echoServer = (
    accessToken?: string,
    refreshToken?: string,
): EchoClientInstance =>
    new EchoClient({
        ...config,
        headers: {
            ...(accessToken && { Authorization: BEARER(accessToken) }),
            ...(refreshToken && { Cookie: REFRESH(refreshToken) })
        }
    })
```

## Request Config

These are the available configuration parameters for making requests:

```javascript
{
    // Base URL to be prepended to `url`
    baseURL: 'https://api.example.com',

    // The endpoint for the request
    url: '/user',

    // HTTP method (GET, POST, etc.)
    method: 'GET',

    // Request headers
    headers: { 'Content-Type': 'application/json' },

    // URL parameters
    params: { limit: 10 },

    // Expected response type (e.g., 'json' | 'text' | 'blob' | 'formData' | ...)
    responseType: 'json', // default

    // Other fields supported by fetch.
}
```

Example:

```javascript
echoBase.get('/users', { params: { limit: 10 } })
```

## Response Schema

A response object contains:

```javascript
{
    // Data returned by the server
    data: {},

    // HTTP status code
    status: 200,

    // Status message
    statusText: 'OK',

    // Response headers
    headers: {},

    // Request configuration
    config: {},

    // The final request instance
    request: {}
}
```

Example:

```javascript
echoBase.get('/users').then(response => {
	console.log(response.data)
	console.log(response.status)
	console.log(response.statusText)
	console.log(response.headers)
	console.log(response.config)
	console.log(response.request)
})
```

## Interceptors

Interceptors let you intercept and modify requests or responses (and even errors) before they are handled by your application. They are available on instances created via `echo.create(config)` and can be asynchronous:

## Request Interceptors

### Purpose:

- **onFulfilled**: Modify the request configuration before sending.
- **onRejected**: Handle errors or recover from them.

### Example:

```javascript
const echoAuth = echo.create(config)

echoAuth.interceptors.request.use(
	'auth',
	// Optionally, you can pass null
	config => {
		// Example of Append Authorization header without overwriting other headers:
		config.headers = {
			...config.headers,
			Authorization: 'Bearer myToken'
		}
		return config
	},
	reject => {
		// Optionally handle errors during config preparation
		return reject
	}
)
```

## Response Interceptors

### Purpose:

- **onFulfilled**: Transform or inspect successful responses.
- **onRejected**: Handle errors or recover from them.

### Example:

```javascript

echoAuth.interceptors.response.use(
	'auth',
	// Optionally, you can pass null
	response => {
		// Optionally modify response
		return response
	},
	async reject => {
		// Example of response reject handling
		if (isEchoError(reject)) {
			const originRequest: EchoConfig & { _isRetry?: boolean } = reject.config
			const status401 = reject.response?.status === 401
			const validRequest = !originRequest._isRetry && status401

			// Check valid request
			if (!validRequest) return reject

			originRequest._isRetry = true

			if (reject.message === 'Unauthorized') {
				removeAccessToken()
			} else if (reject.message === 'Jwt expired') {
				try {
					// Get new tokens
					await tokenService.getNewTokens()
					echoAuth.request(originRequest)
				} catch {
					removeAccessToken()
				}
			}
		}

		// Return error if it is not handled
		// Always return error
		return reject
	}
)
```

### Execution Flow:

- All `onFulfilled` and `onRejected` handlers execute sequentially in the order added.
- Always return the error if it is not handled.

### Managing Interceptors

You can manage interceptors with these methods:

- **Add an interceptor**:

```javascript
echoAuth.interceptors.request.use('uniqueKey', onFulfilled, onRejected)
echoAuth.interceptors.response.use('uniqueKey', onFulfilled, onRejected)
```

- **Remove a specific interceptor**:

```javascript
echoAuth.interceptors.request.eject('uniqueKey')
echoAuth.interceptors.response.eject('uniqueKey')
```

- **Clear all interceptors**:

```javascript
echoAuth.interceptors.request.clear()
echoAuth.interceptors.response.clear()
```

## Error Handling

An `EchoError` instance contains:

```javascript
{
    message: string,        // Error message
    config: EchoConfig,     // Request configuration
    request: EchoRequest,   // The final request instance
    response?: EchoResponse // (Optional) The response object if available
}
```

Example:

```javascript
echo.get('/user/12345').catch(error => {
	console.log(error.message)
	console.log(error.config)
	console.log(error.request)

	if (error.response) {
		console.log(error.response.data)
		console.log(error.response.status)
		console.log(error.response.headers)
	}
})
```

## Using multipart/form-data

When sending **FormData** | **Blob**, you do not need to set the `Content-Type` header manually. `echo` will automatically remove it so that `fetch` applies the appropriate header.

## TypeScript & ES6

Echo is fully typed and is designed for JavaScript ES6 and higher.

## License

This project is distributed under the [MIT license](./LICENSE).
