# Khela Hobe (খেলা হবে) — Frontend Architecture

A modern, high-energy community sports discovery and match organization platform for Bangladesh, built with **React.js + Vite** and **Tailwind CSS**.

---

## Technology Stack

- **Framework:** React 18 with Vite
- **Language:** JavaScript (ES6+), clean modular architecture
- **Styling:** Tailwind CSS (v3) configured with the custom Khela Hobe design tokens
- **Routing:** React Router DOM (v6) with public, auth, and role-based protected workspaces
- **API Communication:** Axios with centralized client, JWT Bearer interceptor, and automatic error handling
- **State Management:** React Context API (`ThemeContext`, `AuthContext`, `NotificationContext`)
- **Form Handling:** React Hook Form
- **Notifications:** React Hot Toast styled with dark turf aesthetics
- **Icons:** Font Awesome React Icons (`@fortawesome/react-fontawesome`)
- **Data Analytics:** Recharts for organizer dashboard attendance analytics

---

## Architectural Principles

1. **Separation of Concerns:**
   - **UI Components:** Focus strictly on presentation and user interaction.
   - **Business Logic:** Encapsulated in custom hooks (`useMatches`, `useAuthorization`, `useAuth`, `useTheme`, `useIntersectionObserver`).
   - **API Communication:** Handled solely by endpoint service modules (`src/services/endpoints/*`), never directly inside UI components.
2. **Centralized Axios Client & JWT Lifecycle:**
   - Base URL driven by environment variables (`VITE_API_BASE_URL`).
   - Request interceptor automatically attaches `Authorization: Bearer <token>`.
   - Response interceptor orchestrates 401 refresh token queue and routes errors through `handleApiError`.
3. **Decoupled Authentication & Authorization:**
   - **Authentication:** Managed in `AuthContext` (credentials, user identity, session persistence, tokens).
   - **Authorization:** Managed in `useAuthorization` and `ProtectedRoute` (role checks: Player, Organizer, Guardian, Admin; granular permissions).
4. **Mock Layer Independence:**
   - Realistic mock data for Bangladesh turfs, players, organizers, and guardians is kept in `src/mocks/`.
   - Endpoint services gracefully fall back to mock data if the backend server is offline, enabling immediate evaluation out of the box.
5. **Khela Hobe Design System & Landing Page Skill Compliance:**
   - **Colors:** Night turf dark surfaces (`#101A17`, `#1B2923`, `#23342D`) paired with high-visibility electric lime (`#B9F34A`) and pitch green (`#26865B`).
   - **Typography:** Headings in **Manrope**, body text in **Inter**, match codes and IDs in **Fragment Mono**.
   - **Skill Compliance:**
     - Left-to-right text gradient on the hero heading (`#FFFFFF` → `#9B9B9B` in dark mode).
     - Strict spacing scale (Spacing-0 to Spacing-900).
     - Nested corner radius formula applied throughout.
     - Section B11 **Tagline Reveal Section** with word-by-word scroll reveal powered by `requestAnimationFrame`.
     - Zero emojis and zero decorative text symbols, strictly using Font Awesome React icons.

---

## Folder Structure

```
Khela Hobe/
├── .env.example                # Sample environment variables (VITE_API_BASE_URL)
├── .env                        # Local development environment configuration
├── index.html                  # HTML entry point with Google Fonts preconnects
├── package.json                # Project dependencies and npm scripts
├── postcss.config.js           # PostCSS Tailwind & Autoprefixer configuration
├── tailwind.config.js          # Extended Tailwind config with Khela Hobe design tokens
├── vite.config.js              # Vite configuration with '@/' path alias
├── UIUX/                       # Reference designs, sticker sheet & 43 screen templates
└── src/
    ├── assets/
    │   ├── images/             # Turf photos and user avatars
    │   └── icons/              # Custom brand marks
    ├── components/
    │   ├── cards/              # MatchCard, SportCard, StatCard
    │   ├── common/             # Button, Input, Select, Badge, ThemeToggle, LoadingSkeleton, EmptyState, TaglineReveal
    │   ├── forms/              # FormField, Checkbox
    │   ├── layout/             # Header (floating bar), Footer, Sidebar, SkipToContent
    │   ├── modals/             # Accessible Modal dialog
    │   ├── navigation/         # Breadcrumb
    │   └── tables/             # Reusable tabular data grid
    ├── constants/
    │   ├── config.js           # Storage keys, timeout, and API environment constants
    │   ├── roles.js            # Roles (PLAYER, ORGANIZER, GUARDIAN, ADMIN) and permissions
    │   ├── routes.js           # Central route path dictionary
    │   └── sports.js           # Sports catalog definitions
    ├── contexts/
    │   ├── AuthContext.jsx     # Authentication state, login, logout, and demo role switcher
    │   ├── NotificationContext.jsx # Notification inbox state
    │   └── ThemeContext.jsx    # Dark/light theme mode state & persistence
    ├── hooks/
    │   ├── useAuth.js          # Authentication hook
    │   ├── useAuthorization.js # Role and permission check hook
    │   ├── useIntersectionObserver.js # Scroll reveal hook
    │   ├── useMatches.js       # Match discovery and filtering hook
    │   └── useTheme.js         # Theme toggle hook
    ├── layouts/
    │   ├── AuthLayout.jsx      # Minimal centered layout for login and registration
    │   ├── DashboardLayout.jsx # Workspace layout with persistent 256px athletic sidebar
    │   └── PublicLayout.jsx    # Public layout with floating navigation and footer
    ├── mocks/
    │   └── mockData.js         # Banani, Uttara, Dhanmondi turf matches and user records
    ├── pages/
    │   ├── admin/              # AdminDashboardPage
    │   ├── auth/               # LoginPage, RegisterPage
    │   ├── guardian/           # GuardianDashboardPage
    │   ├── organizer/          # OrganizerDashboardPage (with Recharts analytics)
    │   ├── player/             # PlayerDashboardPage
    │   └── public/             # LandingPage, ExploreMatchesPage, MatchDetailsPage, NotFoundPage, UnauthorizedPage
    ├── routes/
    │   ├── AppRouter.jsx       # Central route configuration
    │   ├── ProtectedRoute.jsx  # Role-based route guard
    │   └── PublicRoute.jsx     # Public and restricted route guard
    ├── services/
    │   ├── api/
    │   │   └── apiClient.js    # Centralized Axios client with JWT request/response interceptors
    │   └── endpoints/          # authService, matchService, userService, organizerService, guardianService, adminService
    ├── styles/
    │   ├── index.css           # Tailwind directives, named text styles, and base curves
    │   └── theme.js            # Theme color tokens and typography constants
    └── utils/
        ├── errorHandler.js     # Standardized API error handler and toast dispatcher
        ├── formatters.js       # Date, time (Asia/Dhaka), currency (BDT ৳), and slot counters
        └── tokenService.js     # JWT storage and expiration verification
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node v24)
- npm 9+ (tested on npm 11)

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

### Building for Production

To create an optimized production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Interactive Demo Features

1. **One-Click Workspace Switching:**
   - In the navigation header or on the Sign In page, quick-switch between **Player**, **Organizer**, **Guardian**, and **Admin** workspaces.
2. **Instant Match Discovery:**
   - Browse active matches across Dhaka turfs, filter by sport, search venues, and reserve a slot with optimistic updates.
3. **Dark and Light Mode:**
   - Click the sun/moon icon in the floating header to switch themes; defaults to the signature athletic dark mode.
