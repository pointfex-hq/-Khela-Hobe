# Project Structure & Architecture — Khela Hobe

**KHELA HOBE** is a production-grade recreational sports match discovery, community coordination, tournament ticketing, and guardian oversight platform designed for Bangladesh.

---

## 1. Directory Tree Overview

```text
khela-hobe/
├── docs/                               # Integration, setup, and architecture documentation
│   ├── PROJECT_STRUCTURE.md
│   ├── API_INTEGRATION_GUIDE.md
│   ├── API_ENDPOINT_MAPPING.md
│   ├── AUTHENTICATION_FLOW.md
│   └── FRONTEND_SETUP.md
├── public/                             # Static assets (favicons, manifest)
├── src/
│   ├── assets/                         # Visual assets & images
│   ├── components/
│   │   ├── cards/                      # Match, event, stat, player, and sport cards
│   │   ├── common/                     # Buttons, Badges, Inputs, Avatars, EmptyStates
│   │   ├── feedback/                   # LoadingSpinner, Skeletons, Alerts, ConfirmationDialog
│   │   ├── forms/                      # Controlled form controls (Select, Switch, Checkbox, etc.)
│   │   ├── layout/                     # Header, Sidebar, Footer, PageContainer, DashboardLayout
│   │   ├── modals/                     # Accessible modal dialogs
│   │   ├── navigation/                 # DesktopNavbar, MobileNavigation, Breadcrumb
│   │   └── tables/                     # Data tables and tabular displays
│   ├── constants/
│   │   ├── config.js                   # Environment & storage configuration
│   │   ├── roles.js                    # User roles (PLAYER, ORGANIZER, GUARDIAN, ADMIN)
│   │   └── routes.js                   # Central route paths registry
│   ├── context/
│   │   ├── AuthContext.jsx             # Authentication & user session state
│   │   └── ThemeContext.jsx            # Dark/light theme mode context
│   ├── hooks/
│   │   ├── useAdmin.js                 # Admin management operations
│   │   ├── useAuth.js                  # Authentication hook
│   │   ├── useAuthorization.js         # Role-based route guard hook
│   │   ├── useEvents.js                # Tournament & event hook
│   │   ├── useGuardian.js              # Child oversight and safety hook
│   │   ├── useMatches.js               # Match discovery and reservation hook
│   │   ├── useTheme.js                 # Theme switching hook
│   │   └── useTickets.js               # Tournament pass booking & check-in hook
│   ├── mocks/
│   │   ├── mockAdapter.js              # Latency and standardized response helpers
│   │   └── mockData.js                 # Central repository of isolated mock datasets
│   ├── pages/
│   │   ├── admin/                      # Admin dashboard, users, sports, moderation, reports
│   │   ├── auth/                       # Login, Register, Forgot Password, Reset Password
│   │   ├── guardian/                   # Dashboard, Linked Children, Child Activity, Safety Settings, Alerts
│   │   ├── organizer/                  # Hub, Quick Match, My Matches, Events, Application Review, Check-In
│   │   ├── player/                     # Home, Explore, Map, My Matches, Passes, Applications, Profile
│   │   └── public/                     # Landing Page, Match Details, Event Details, Ticket Booking, 404
│   ├── routes/
│   │   ├── AppRouter.jsx               # Master React Router DOM hierarchy
│   │   └── ProtectedRoute.jsx          # Role-based authentication route wrapper
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosClient.js          # Centralized Axios instance with interceptors
│   │   │   ├── apiErrorHandler.js      # Standardized REST error parsing
│   │   │   └── tokenStorage.js         # Decoupled JWT access/refresh storage
│   │   └── endpoints/
│   │       ├── adminEndpoints.js       # Provisional admin REST services
│   │       ├── applicationEndpoints.js  # Roster applications & approval endpoints
│   │       ├── authEndpoints.js         # Login, register, token refresh endpoints
│   │       ├── eventEndpoints.js        # Tournament management endpoints
│   │       ├── guardianEndpoints.js     # Child linking & safety endpoints
│   │       ├── matchEndpoints.js        # Quick Match discovery & creation endpoints
│   │       ├── notificationEndpoints.js # System alerts & notification endpoints
│   │       ├── organizerEndpoints.js    # Organizer analytics & hosted matches
│   │       ├── playerEndpoints.js       # Player profiles & match history
│   │       ├── ticketEndpoints.js       # Event passes & gate check-in
│   │       └── userEndpoints.js         # User directory & moderation
│   ├── styles/
│   │   └── index.css                   # Tailwind directives & CSS custom properties
│   ├── utils/
│   │   ├── errorHandler.js             # Legacy error handler interface
│   │   └── tokenService.js             # Legacy token service interface
│   ├── App.jsx
│   └── main.jsx
├── .env.example                        # Template environment variables
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 2. Architectural Data Flow

```text
React Page / Component
      │
      ▼
Custom Hook (e.g., useMatches, useTickets, useAdmin)
      │
      ▼
Service Layer (e.g., matchEndpoints.js, ticketEndpoints.js)
      │
      ▼
Axios Client (axiosClient.js) ──► Request Interceptor (Injects Bearer Token)
      │
      ├───[VITE_USE_MOCK_API=true]────► Simulated Latency & Mock Adapter (mockData.js)
      │
      └───[VITE_USE_MOCK_API=false]───► Real REST API Backend (Spring Boot / Node / Go)
      │
      ▼
Response Interceptor (Token Refresh & Error Normalization)
```

---

## 3. Separation of Concerns

1. **Components**: Strictly responsible for view presentation, form state, and triggering hook actions. Zero direct Axios calls.
2. **Hooks**: Encapsulate business logic, loading states, error states, and optimistic UI updates.
3. **Services / Endpoints**: Map logical domain operations to HTTP requests (or mock adapters).
4. **API Client**: Handles transport protocols, timeout enforcement, request headers, multipart boundaries, and authentication token orchestration.
