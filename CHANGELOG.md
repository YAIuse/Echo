# Changelog

All notable changes to this project are documented in this file.

This changelog follows the principles of **Keep a Changelog** and adheres to **Semantic Versioning**.

---

## **[0.4.0](https://github.com/YAIuse/Echo/releases/tag/v0.4.0)** (2026-01-01)

### Changed:

- Test coverage improvements across client and core logic.
- URL & params building:
  - `buildUrl` and `buildParams` logic merged into a single flow.
  - `buildFullUrl` renamed to `buildUrl` (tests updated accordingly).
- Refactored `Echo` client.
- Updated `EchoCreateConfig` type.
- Improved `deepMerge` implementation:
  - Removed redundant object cloning.
- Updated project dependencies and scripts.

### Fixed:

- Incorrect error output in `Echo` instance for request errors.

---

## **[0.3.0](https://github.com/YAIuse/Echo/releases/tag/v0.3.0)** (2025-12-27)

### Added:

- Package json updates:
  - Added `exports` field for proper ESM/CJS support.
  - Added `sideEffects: false` for tree-shaking optimization.
- TypeScript updates:
  - `tsconfig.build.json` now sets `verbatimModuleSyntax: false` for better compatibility.
  - `moduleResolution` updated to `bundler` for ESM-friendly resolution.

### Changed:

- Changing imports due to the removal of `baseUrl`.
- Changing script `bundle` for the correct assembly of ESM/CJS.

### Fixed:

- Now all `.ts` files in src are included in the build, not just `index.ts`.

---

## **[0.2.0](https://github.com/YAIuse/Echo/releases/tag/v0.2.0)** (2025-12-23)

### Added:

- New response parsing pipeline:
  - `parseByContentType` — automatic response parsing based on Content-Type.
  - `parseByResponseType` — explicit parsing via `responseType`.
- Extended `returnResponseData` logic with clearer separation of responsibilities.
- New `errorMessage` utility for reusable error message generation.
- Additional test coverage:
  - `errorMessage` utility tests.
  - `buildParams` tests.
  - Extended `client` and `echo` tests.

### Changed:

- Updated type `requestType`.
- Refactored utils API:
  - Utilities are now exported as functions instead of arrow constants (`() => {} → function`).
- Updated and refactored existing tests for better structure and clarity.

### Fixed:

- Removed redundant internal `try-catch` logic in `runRejected` for Echo.
- Documentation updates and small fixes in `README`.

---

## **[0.1.0](https://github.com/YAIuse/Echo/releases/tag/v0.1.0)** (2025-12-06)

### Added:

- Core HTTP client built on top of the native `fetch` API.

- Echo client providing:
  - Automatic URL construction (`baseURL`, `params`).
  - Intelligent body formatting.
  - Automatic removal of `Content-Type` for `FormData` and `Blob`.
  - Unified response handling for all formats:
    - `json`, `text`, `blob`, `arrayBuffer`, `formData`, `stream`, `original`.

  - Fully typed request and response models.
  - Built‑in `EchoError` with complete request/response context.

- Default echo instance for straightforward usage.

- Echo class with full interceptor support:
  - Request interceptors (`onFulfilled`, `onRejected`).
  - Response interceptors (`onFulfilled`, `onRejected`).
  - Interceptor management utilities: `use`, `eject`, `clear`.

- Utility functions:
  - `deepMerge`
  - `buildFullUrl`
  - `formattedBody`

- TypeScript architecture:
  - Strict typings for configuration, requests, and responses.
  - Extendable interface definitions.
  - Helpful runtime type guard: `isEchoError`.

- Complete HTTP method support:
  - `get`, `post`, `put`, `patch`, `delete`, `request`.

- Consistent error propagation pipeline:
  - Unified error structure across all layers.
  - Retry‑friendly response interceptor design.

- Initial documentation and usage examples.

---

This release establishes a clean, typed, and extensible foundation for the Echo ecosystem.
