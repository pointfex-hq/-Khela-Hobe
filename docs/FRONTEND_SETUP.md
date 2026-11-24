# Frontend Setup & Developer Guide — Khela Hobe

This guide provides step-by-step instructions for setting up, configuring, running, and maintaining the KHELA HOBE frontend application.

---

## 1. Prerequisites

Before setting up the project locally, verify that your environment meets these requirements:

- **Node.js**: Version `18.x` or `20.x` or higher (`node -v`)
- **Package Manager**: npm `9.x` or higher (`npm -v`)
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with modern JavaScript (ES2022) support.

---

## 2. Quickstart Installation

1. Navigate to the project root directory:
   ```bash
   cd "Khela Hobe"
   ```

2. Install all production and development dependencies:
   ```bash
   npm install
   ```

---

## 3. Environment Configuration

The application uses Vite environment variables prefixed with `VITE_`.

1. Copy the example environment file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```

2. Review and configure the variables in `.env`:

```env
# Application Title & Metadata
VITE_APP_TITLE=Khela Hobe - Play Sports Together

# Backend API Base URL (Provisional)
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Mock Mode Toggle
# Set to 'true' to use in-memory simulated datasets with simulated network latency.
# Set to 'false' to route all API calls through axiosClient to a real REST backend.
VITE_USE_MOCK_API=true

# API Request Timeout (in milliseconds)
VITE_API_TIMEOUT=15000
```

---

## 4. Running the Development Server

Start the local Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The terminal will output the local development URL (typically `http://localhost:5173/`). Open this URL in your web browser.

---

## 5. Toggling Mock Mode vs. Live Backend

KHELA HOBE features a zero-backend mock architecture allowing complete frontend development and demonstration without a live server:

### A. Mock Mode (`VITE_USE_MOCK_API=true`)
- Default mode for development, UX review, and frontend demos.
- Emulates network delays (150ms – 400ms) for realistic UX evaluation.
- Retains state changes in browser storage during the active session.
- Allows instant role switching (Player, Organizer, Guardian, Admin) without re-logging.

### B. Live API Mode (`VITE_USE_MOCK_API=false`)
- Point `VITE_API_BASE_URL` to your live or staging backend server (e.g., `https://api.khelahobe.com/api/v1`).
- All requests flow through [`src/services/api/axiosClient.js`](file:///home/sakib/Khela%20Hobe/src/services/api/axiosClient.js).
- Bearer tokens are attached automatically.
- Refresh tokens are handled automatically upon receiving 401 responses.

---

## 6. Building for Production

To create an optimized, minified production bundle:

```bash
npm run build
```

This command runs `vite build`, compiling JSX, resolving Tailwind CSS utility classes, tree-shaking unused icons, and generating bundles in the `dist/` directory.

### Previewing the Production Build Locally
```bash
npm run preview
```
This serves the production `dist/` folder locally to verify production asset paths and chunk loading before deployment.

---

## 7. Design & Code Conventions

1. **Icons**:
   - **Exclusively use Font Awesome icons** via `@fortawesome/react-fontawesome`.
   - Never insert emojis or decorative unicode characters (`⚽`, `📅`, etc.) in UI templates or code.
   - Example: `<FontAwesomeIcon icon={faFutbol} className="text-emerald-500" />`.

2. **Colors & Design System**:
   - Primary Brand Color: Emerald (`#10B981` / `emerald-600` / `emerald-500`).
   - Accent Brand Color: Amber / Orange (`amber-500`, `orange-500`).
   - Neutral Palette: Slate (`slate-900`, `slate-800`, `slate-100`, etc.).
   - Dark Mode: All views support seamless dark and light modes via Tailwind's `dark:` classes driven by `ThemeContext`.

3. **Layered Architecture**:
   - **Views**: Consume custom hooks or services; maintain no direct Axios imports.
   - **Hooks**: Manage reactive state, loading flags, error handling, and toast notifications.
   - **Services**: Define provisional REST contracts in `src/services/endpoints/`.
   - **API Client**: Centralizes Axios headers, timeouts, and interceptors in `src/services/api/axiosClient.js`.

---

## 8. Troubleshooting

### Port Already in Use
If port `5173` is busy, Vite will automatically try `5174` or you can specify a port:
```bash
npx vite --port 3000
```

### Clearing Vite Cache
If you encounter unusual module caching issues after updates:
```bash
rm -rf node_modules/.vite
npm run dev
```
