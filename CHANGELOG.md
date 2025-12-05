# 📘 Changelog

All notable changes to this project are documented in this file.

This changelog follows the principles of **Keep a Changelog** and adheres to **Semantic Versioning**.

---

## [0.1.0](https://github.com/YAIuse/Echo/releases/tag/v0.1.0) (2025-12-06)

### Added:

- **Core HTTP client** built on top of the native `fetch` API.

- **EchoClient** providing:
  - Automatic URL construction (`baseURL`, `params`).
  - Intelligent body formatting.
  - Automatic removal of `Content-Type` for `FormData` and `Blob`.
  - Unified response handling for all formats:
    - `json`, `text`, `blob`, `arrayBuffer`, `formData`, `stream`, `original`.

  - Fully typed request and response models.
  - Built‑in `EchoError` with complete request/response context.

- **Echo class with full interceptor support**:
  - Request interceptors (`onFulfilled`, `onRejected`).
  - Response interceptors (`onFulfilled`, `onRejected`).
  - Interceptor management utilities: `use`, `eject`, `clear`.

- **Utility functions**:
  - `deepMerge`
  - `buildFullUrl`
  - `formattedBody`

- **TypeScript-first architecture**:
  - Strict typings for configuration, requests, and responses.
  - Extendable interface definitions.
  - Helpful runtime type guard: `isEchoError`.

- **Default `echo` instance** for straightforward usage.

- **Complete HTTP method support**:
  - `get`, `post`, `put`, `patch`, `delete`, `request`.

- **Consistent error propagation pipeline**:
  - Unified error structure across all layers.
  - Retry‑friendly response interceptor design.

- **Initial documentation and usage examples**.

---

This release establishes a clean, typed, and extensible foundation for the Echo ecosystem.
