# Provisional API Endpoint Mapping — Khela Hobe

> [!NOTE]
> All endpoint paths, query parameters, request bodies, and response structures below are **provisional proposals**. They will be finalized during joint integration reviews with the backend engineering team.

---

## 1. Authentication Endpoints (`authEndpoints.js`)

| Operation | Method | Provisional Endpoint | Expected Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `POST` | `/auth/login` | `{ identifier, password }` | `{ accessToken, refreshToken, user }` |
| **Register** | `POST` | `/auth/register` | `{ name, email, phone, password, role }` | `{ accessToken, refreshToken, user }` |
| **Refresh Token** | `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, newRefreshToken }` |
| **Current User** | `GET` | `/auth/me` | None (Bearer header) | `{ user }` |
| **Logout** | `POST` | `/auth/logout` | `{ refreshToken }` | `{ success: true }` |
| **Forgot Password** | `POST` | `/auth/forgot-password` | `{ emailOrPhone }` | `{ message }` |
| **Reset Password** | `POST` | `/auth/reset-password` | `{ token, newPassword }` | `{ success: true }` |

---

## 2. Match Operations (`matchEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Explore Matches** | `GET` | `/matches` | `?sport=&location=&date=&skill=&status=` | `{ data: Match[], total: number }` |
| **Match Details** | `GET` | `/matches/:id` | Route param `:id` | `{ data: Match }` |
| **Create Quick Match** | `POST` | `/matches` | `{ title, sport, date, time, venue, totalSlots, ... }` | `{ data: Match }` |
| **Update Match** | `PUT` | `/matches/:id` | `{ title, venue, schedule, ... }` | `{ data: Match }` |
| **Cancel Match** | `POST` | `/matches/:id/cancel` | `{ reason }` | `{ success: true }` |
| **Join Match (Quick)** | `POST` | `/matches/:id/join` | `{ notes }` | `{ success: true, updatedSlots }` |

---

## 3. Roster Applications (`applicationEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Submit Application** | `POST` | `/matches/:id/apply` | `{ position, experience, notes }` | `{ data: Application }` |
| **Get My Applications**| `GET` | `/applications/my` | None | `{ data: Application[] }` |
| **Review Match Roster**| `GET` | `/matches/:id/applications` | Route param `:id` | `{ data: Application[] }` |
| **Approve Applicant** | `POST` | `/applications/:id/approve` | `{ note }` | `{ success: true }` |
| **Reject Applicant** | `POST` | `/applications/:id/reject` | `{ reason }` | `{ success: true }` |

---

## 4. Tournament Events (`eventEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **List Events** | `GET` | `/events` | `?sport=&status=` | `{ data: Event[], total: number }` |
| **Event Details** | `GET` | `/events/:id` | Route param `:id` | `{ data: Event }` |
| **Create Event** | `POST` | `/events` | `{ title, sport, venue, date, fee, maxTeams, ... }` | `{ data: Event }` |
| **Update Event** | `PUT` | `/events/:id` | `{ title, venue, fee, ... }` | `{ data: Event }` |
| **Register Team** | `POST` | `/events/:id/register` | `{ teamName, captainPhone, players }` | `{ data: Registration }` |

---

## 5. Ticketing & Passes (`ticketEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Available Tiers** | `GET` | `/events/:id/tickets` | Route param `:id` | `{ tiers: Tier[] }` |
| **Book Reservation Pass** | `POST` | `/events/:id/tickets/book` | `{ tierId, quantity, attendeeName, phone }` | `{ data: Ticket }` |
| **My Tickets** | `GET` | `/tickets/my` | None | `{ data: Ticket[] }` |
| **Ticket Details** | `GET` | `/tickets/:id` | Route param `:id` | `{ data: Ticket }` |
| **Verify QR Code** | `POST` | `/tickets/verify` | `{ code: string }` | `{ status: VALID|ALREADY_USED|INVALID, data }` |
| **Gate Check-In** | `POST` | `/tickets/:id/check-in` | Route param `:id` | `{ success: true, timestamp }` |
| **Cancel Ticket** | `POST` | `/tickets/:id/cancel` | `{ reason }` | `{ success: true }` |

---

## 6. Guardian & Child Safety (`guardianEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Metrics** | `GET` | `/guardian/dashboard` | None | `{ metrics, authorizedChildren, alerts }` |
| **Linked Children** | `GET` | `/guardian/children` | None | `{ data: Child[] }` |
| **Initiate Link** | `POST` | `/guardian/children/link` | `{ safetyId, relationship }` | `{ success: true, requestId }` |
| **Revoke Link** | `DELETE`| `/guardian/children/:id` | Route param `:id` | `{ success: true }` |
| **Child Activity** | `GET` | `/guardian/children/:id/activity` | Route param `:id` | `{ upcoming: [], history: [] }` |
| **Safety Settings** | `GET` | `/guardian/children/:id/safety-settings` | Route param `:id` | `{ matchJoinAlerts, curfewAlerts, ... }` |
| **Update Settings** | `PUT` | `/guardian/children/:id/safety-settings` | `{ ...settings }` | `{ data: Settings }` |
| **Safety Alerts** | `GET` | `/guardian/safety-alerts` | `?category=` | `{ data: Alert[], unreadCount }` |

---

## 7. Admin & Moderation (`adminEndpoints.js`)

| Operation | Method | Provisional Endpoint | Query / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Overview** | `GET` | `/admin/dashboard` | None | `{ metrics, weeklyActivity, recentActions }` |
| **User Directory** | `GET` | `/admin/users` | `?search=&role=&status=` | `{ data: User[], total: number }` |
| **Update User Status** | `PATCH`| `/admin/users/:id/status`| `{ action: 'restrict'|'suspend'|'reactivate' }` | `{ data: User }` |
| **Sports Catalog** | `GET` | `/admin/sports` | None | `{ data: Sport[] }` |
| **Add Sport** | `POST` | `/admin/sports` | `{ name, formats, defaultCapacity, ... }` | `{ data: Sport }` |
| **Delete Sport** | `DELETE`| `/admin/sports/:id` | Route param `:id` | `{ success: true }` |
| **Pending Matches** | `GET` | `/admin/matches/moderation` | `?search=&sport=&status=` | `{ data: Match[] }` |
| **Moderate Match** | `POST` | `/admin/matches/:id/moderate` | `{ action: 'suspend'|'approve'|'flag' }` | `{ success: true }` |
| **Reports Queue** | `GET` | `/admin/reports` | `?category=&status=` | `{ data: Report[], pendingCount }` |
| **Review Report** | `POST` | `/admin/reports/:id/review` | `{ action: 'resolve'|'reject', note }` | `{ success: true }` |
