# API Integration Guide — Khela Hobe

This document outlines how to transition KHELA HOBE from the default mock implementation to a live production backend REST API.

---

## 1. Switching to Live API Mode

In your environment file (`.env` or production server environment variables), set:

```env
# Disable mock mode
VITE_USE_MOCK_API=false

# Point to your backend endpoint (e.g., Spring Boot, Go, Express)
VITE_API_BASE_URL=https://api.khelahobe.com/api/v1

# Optional timeout override (defaults to 15000ms)
VITE_API_TIMEOUT=15000
```

Restart your Vite dev server:

```bash
npm run dev
```

When `VITE_USE_MOCK_API=false`, all endpoint services (`matchEndpoints.js`, `ticketEndpoints.js`, `authEndpoints.js`, etc.) will transmit live HTTP requests through `axiosClient.js` rather than falling back to in-memory mock datasets.

---

## 2. Centralized Axios Client (`axiosClient.js`)

Located in [`src/services/api/axiosClient.js`](file:///home/sakib/Khela%20Hobe/src/services/api/axiosClient.js).

### Key Features
- **Base URL Injection**: Configured from `VITE_API_BASE_URL`.
- **Automatic JWT Bearer Token Injection**: Every request reads the access token from `tokenStorage.js` and injects `Authorization: Bearer <token>`.
- **Multipart/Form-Data Handling**: Detects `FormData` payloads (profile avatar uploads, match banner images) and removes explicit `Content-Type: application/json` so the browser sets the correct boundary automatically.
- **Automatic 401 Token Refresh Queue**: If a protected request receives an HTTP 401, the client pauses outbound requests, invokes `/auth/refresh` with the refresh token, updates storage, and replays failed requests seamlessly.

---

## 3. Standardized Response & Error Contracts

All proposed backend contracts are **provisional** and subject to backend team alignment.

### Successful Response Envelope (Provisional)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": { ... },
  "total": 42
}
```

### Error Response Envelope (Provisional)
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed for match creation.",
  "errors": {
    "title": "Match title must be at least 5 characters.",
    "filledSlots": "Filled slots cannot exceed total slots."
  }
}
```

---

## 4. Handled HTTP Status Codes

The frontend error normalizer (`apiErrorHandler.js`) handles all standard REST responses without crashing:

| Status Code | Reason | Frontend Handling |
| :--- | :--- | :--- |
| **200 OK** | Successful read/update | Returns `response.data`. |
| **201 Created** | Successful creation | Triggers success toast & redirects. |
| **204 No Content** | Successful deletion | Updates local state optimistically. |
| **400 Bad Request** | Malformed parameters | Displays actionable error alert. |
| **401 Unauthorized** | Expired/invalid token | Triggers refresh token flow; on failure, redirects to `/login`. |
| **403 Forbidden** | Role mismatch | Redirects to `/unauthorized` or blocks sensitive action. |
| **404 Not Found** | Missing record | Displays empty state or navigates to 404 page. |
| **409 Conflict** | Slot already filled | Notifies user that roster reached capacity. |
| **422 Unprocessable** | Validation error | Maps field errors to form inputs via React Hook Form. |
| **500 Server Error** | Unexpected crash | Displays non-blocking notification; logs to monitoring. |
| **Network Error** | Disconnection | Informs user to check their internet connection. |
