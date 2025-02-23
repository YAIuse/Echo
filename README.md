<div align="center">
    <a href="https://github.com/YAI-team/echo/" target="blank">
        <img src="https://raw.githubusercontent.com/YAI-team/echo/main/public/favicon.svg" width="500" alt="Project Logo" />
    </a>
</div>

<p align="center">An HTTP client built on fetch, offering an Axios-like experience with support for interceptors.</p>

<div align="center">

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/YAI-team/Echo)
[![npm Package](https://img.shields.io/npm/v/@yai-team/echo?color=blue&logo=npm)](https://www.npmjs.com/package/@yai-team/echo)
[![npm Downloads](https://img.shields.io/npm/dw/@yai-team/echo?color=green&logo=npm)](https://www.npmjs.com/package/@yai-team/echo)
[![Install Size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=@yai-team/echo&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.com/result?p=@yai-team/echo)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@yai-team/echo?color=purple&logo=webpack)](https://bundlephobia.com/package/@yai-team/echo@latest)
[![Build Status](https://img.shields.io/github/actions/workflow/status/YAI-team/Echo/tests.yaml?branch=main&logo=githubactions)](https://github.com/YAI-team/Echo/actions)
[![Coverage Status](https://codecov.io/gh/YAI-team/Echo/branch/main/graph/badge.svg)](https://codecov.io/gh/YAI-team/Echo)
[![Snyk Security](https://snyk.io/test/npm/@yai-team/echo/badge.svg)](https://snyk.io/test/npm/@yai-team/echo)
[![License](https://img.shields.io/github/license/YAI-team/Echo?color=green)](https://github.com/YAI-team/Echo/blob/main/LICENSE)

</div>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Request Methods](#request-methods)
- [Creating an Instance](#creating-an-instance-and-base-configuration)
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
$ npm install @yai/echo
# or using yarn
$ yarn add @yai/echo
# or using bun
$ bun add @yai/echo
```

## Quick Start

After installation, you can use an instance created via create to benefit from interceptors:

> **Note:** Only instances created via `echo.create(config)` support interceptors. The default `echo` instance (created without `create`) does not support interceptors.

```javascript
import echo from '@yai/echo'

// Create an instance with base configuration and interceptors support
const echoBase = echo.create({
	baseURL: 'https://api.example.com/api',
	headers: { 'Content-Type': 'application/json' }
})

// GET request with then
echoBase
	.get('/users')
	.then(response => {
		console.log(response.data)
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

- `url` — A string indicating the endpoint (if `baseURL` is set, it will be prepended).
- `body` — The request body for methods that allow sending data (`POST`, `PUT`, `PATCH`).
- `options` — Additional configuration (`headers`, `responseType`, `params`, etc.).

## Creating an Instance and Base Configuration

Example of creating an instance:

```javascript
import echo from '@yai/echo'

// Define configuration
const config: EchoCreateConfig = {
    baseURL: 'http://localhost:4200',
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
    refreshToken?: string,
    accessToken?: string
): EchoClientInstance =>
    new EchoClient({
        ...config,
        headers: {
            ...(refreshToken && { Cookie: REFRESH(refreshToken) }),
            ...(accessToken && { Authorization: BEARER(accessToken) })
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
    method: 'get',

    // Request headers
    headers: { 'Content-Type': 'application/json' },

    // URL parameters
    params: { limit: 10 },

    // Expected response type (e.g., 'json' | 'text' | 'blob' | 'formData' | ...)
    responseType: 'json', // default

    // Other fields supported by fetch.
}
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

Interceptors let you intercept and modify requests or responses (and even errors) before they are handled by your application. They are available on instances created via `echo.create(config)` and come in two types:

## Request Interceptors

### Purpose:

- **onFulfilled**: Modify the request configuration before sending.
- **onRejected**: Handle errors or recover from them.

### Execution Flow:

- All `onFulfilled` handlers execute sequentially in the order added.
- If an error occurs during the request process, the `onRejected` handlers for requests are invoked in order until one recovers the error.
- These handlers catch only errors related to the request setup.
  If none recover, the error is propagated.

### Example:

```javascript
const echoAuth = echo.create({ baseURL: 'https://api.example.com/api' })

// Add a request interceptor to inject an Authorization header
echoAuth.interceptors.request.use(
	'auth',
	config => {
		// Append Authorization header without overwriting other headers:
		config.headers = {
			...config.headers,
			Authorization: 'Bearer myToken'
		}
		return config
	},
	error => {
		// Optionally handle errors during config preparation
		return error
	}
)
```

## Response Interceptors

### Purpose:

- **onFulfilled**: Modify or transform the response.
- **onRejected**: Handle errors during response processing.

### Execution Flow:

- All `onFulfilled` handlers execute sequentially.
- If an error occurs during response processing, the `onRejected` handlers for responses are invoked sequentially until one recovers the error.
- These handlers catch only errors related to response handling.
- If none recover, the error is thrown.

### Example:

```javascript
// Add a response interceptor to modify the response data
echoAuth.interceptors.response.use(
	'modifyResponse',
	response => {
		// Example: add a new property to the response data
		response.data = { modified: true, ...response.data }
		return response
	},
	error => {
		// Optionally handle errors during response processing
		return error
	}
)
```

### Managing Interceptors

You can manage interceptors with these methods:

- **Add an interceptor**:

```javascript
echoBase.interceptors.request.use('uniqueKey', onFulfilled, onRejected)
echoBase.interceptors.response.use('uniqueKey', onFulfilled, onRejected)
```

- **Remove a specific interceptor**:

```javascript
echoBase.interceptors.request.eject('uniqueKey')
echoBase.interceptors.response.eject('uniqueKey')
```

- **Clear all interceptors**:

```javascript
echoBase.interceptors.request.clear()
echoBase.interceptors.response.clear()
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

When sending **FormData**, you do not need to set the `Content-Type` header manually. `echo` will automatically remove it so that `fetch` applies the appropriate header.

## TypeScript & ES6

Echo is fully typed and is designed for JavaScript ES6 and higher.

## License

This project is distributed under the [MIT license](./LICENSE).
