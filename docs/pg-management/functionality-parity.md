# PG Management — Functionality Parity Matrix

> **Generated from:** Repository forensic analysis of `backend/`, `mobile/`, and `pgmanagement/` directories
>
> **Date:** 2026-09-30
>
> **Purpose:** Map every owner-mode PG management feature from the existing backend & mobile application to the planned web application.

---

## 1. Architecture Summary

### Backend Stack
- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (Bearer token) — `protect` middleware
- **Authorization:** Role-based — `authorize('owner', 'admin', 'property_manager')` middleware
- **Validation:** Zod schemas in `validators/manage.validator.js`
- **API Response:** `{ success: boolean, message: string, data?: T, pagination?: object, errors?: object }`
- **File Storage:** Cloudinary
- **Payments:** Razorpay
- **Notifications:** WhatsApp (Ping4SMS), Email, Push
- **Queue:** BullMQ (Redis)
- **API Base Path:** `/api/v1/manage/...`

### Data Hierarchy
```
Owner (User) → PG → Building → Floor → Room → Bed → Tenant
                                                  ↕
                                            RentRecord → Payment
                                            Expense
                                            Agreement
                                            Staff
```

### Auth Flow (Web)
1. `POST /api/v1/auth/otp/send-unified` — `{ contact, type: 'phone', sendWhatsApp }`
2. `POST /api/v1/auth/otp/verify-unified` — `{ contact, otp, isMobile: false }`
   - Existing user → `{ isNewUser: false, user, token }` (7-day JWT)
   - New user → `{ isNewUser: true, tempToken }` → registration form
3. `POST /api/v1/auth/register-complete` — `{ tempToken, name, phone? }`
4. `GET /api/v1/auth/me` — Returns `{ user, capabilities[], memberships{}, availableModes[] }`

### Mobile App Owner Screens (Discovered)
- `HomeDashboardScreen` — Dashboard overview
- `PropertyScreen` — Room/bed tree management
- `CreateEditRoomScreen` — Room CRUD
- `RoomDetailScreen` — Room detail + bed management
- `TenantListScreen` — Tenant list with filters/search/stats
- `AddTenantScreen` — Add tenant form
- `TenantDetailScreen` — Tenant detail + actions
- `RentDashboardScreen` — Rent overview + generation
- `InvoiceListScreen` — Rent records list
- `InvoiceDetailScreen` — Single rent record detail
- `RecordPaymentScreen` — Mark payment
- `RentSettingsScreen` — Rent settings per PG
- `FinanceDashboardScreen` — Financial overview
- `ExpenseListScreen` — Expense list
- `CreateExpenseScreen` — Add expense
- `ExpenseDetailScreen` — Expense detail

---

## 2. Complete Feature Parity Matrix

### 2.1 Authentication & Session

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| A1 | Send OTP (phone) | LoginScreen | `/auth/otp/send-unified` | POST | `{ contact, type:'phone', sendWhatsApp }` | `{ channels[] }` | sendOtpUnifiedSchema | Public | `/login` | Planned |
| A2 | Verify OTP (existing user) | OTPScreen | `/auth/otp/verify-unified` | POST | `{ contact, otp, isMobile:false }` | `{ isNewUser:false, user, token }` | verifyOtpUnifiedSchema | Public | `/verify-otp` | Planned |
| A3 | Verify OTP (new user) | OTPScreen | `/auth/otp/verify-unified` | POST | `{ contact, otp, isMobile:false }` | `{ isNewUser:true, tempToken }` | verifyOtpUnifiedSchema | Public | `/verify-otp` | Planned |
| A4 | Complete registration | — | `/auth/register-complete` | POST | `{ tempToken, name, phone? }` | `{ user, token }` | registerCompleteSchema | Public | `/register` | Planned |
| A5 | Get auth context | Background | `/auth/me` | GET | — | `{ user, capabilities, memberships, availableModes }` | — | Protected | — | Planned |
| A6 | Update profile | ProfileScreen | `/auth/me` | PUT | Profile fields | `{ user }` | updateProfileSchema | Protected | `/settings/profile` | Planned |
| A7 | Logout | ProfileScreen | — (client-only) | — | — | — | — | — | — | Planned |
| A8 | Session expiry / 401 handling | Interceptor | — | — | — | — | — | — | — | Planned |

### 2.2 Dashboard & Analytics

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|-----------|-----------|--------|
| D1 | Owner dashboard summary | HomeDashboardScreen | `/manage/dashboard` | GET | — | `{ totalPGs, occupancy{}, financials{}, counts{}, pgs[] }` | ownerOrAdmin | `/dashboard` | Planned |
| D2 | Property-scoped dashboard | HomeDashboardScreen | `/manage/pgs/:pgId/dashboard` | GET | — | `{ property, occupancy{}, financials{}, counts{}, alerts{}, recentActivity{} }` | ownerOrAdmin | `/properties/:id` | Planned |
| D3 | Financial P&L report | FinanceDashboardScreen | `/manage/reports/financial` | GET | `?year=&pgId=` | `{ year, totalRevenue, totalExpenses, totalDue, netProfit, report[] }` | ownerOrAdmin | `/reports/financial` | Planned |

### 2.3 Property Management (PG CRUD)

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| P1 | List owner's PGs | PropertySelector | `/manage/dashboard` → `pgs[]` | GET | — | PG[] from dashboard | ownerOrAdmin | `/properties` | Planned |
| P2 | Property selection | PropertySelector | — (client UI state) | — | — | — | — | — | URL param | Planned |
| P3 | Property availability | PropertyScreen | `/manage/pgs/:pgId/availability` | GET | — | Availability summary | ownerOrAdmin | `/properties/:id` | Planned |
| P4 | Property hierarchy (tree) | PropertyScreen | `/manage/pgs/:pgId/hierarchy` | GET | — | Building→Floor→Room→Bed tree | ownerOrAdmin | `/properties/:id/rooms` | Planned |
| P5 | PG rooms (flat list) | PropertyScreen | `/manage/pgs/:pgId/rooms` | GET | `?params` | Room[] | ownerOrAdmin | `/properties/:id/rooms` | Planned |

### 2.4 Building Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| B1 | List buildings | PropertyScreen | `/manage/pgs/:pgId/buildings` | GET | — | Building[] | ownerOrAdmin | `/properties/:id/rooms` | Planned |
| B2 | Get single building | PropertyScreen | `/manage/buildings/:id` | GET | — | Building | ownerOrAdmin | — | Planned |
| B3 | Create building | PropertyScreen | `/manage/pgs/:pgId/buildings` | POST | `{ name, description?, totalFloors, status?, address? }` | Building | createBuildingSchema | ownerOrAdmin | Dialog | Planned |
| B4 | Update building | PropertyScreen | `/manage/buildings/:id` | PUT | Partial building fields | Building | updateBuildingSchema | ownerOrAdmin | Dialog | Planned |
| B5 | Delete building | PropertyScreen | `/manage/buildings/:id` | DELETE | — | — | — | ownerOrAdmin | Confirm dialog | Planned |

### 2.5 Floor Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| F1 | List floors | PropertyScreen | `/manage/buildings/:buildingId/floors` | GET | — | Floor[] | ownerOrAdmin | Inline | Planned |
| F2 | Create floor | PropertyScreen | `/manage/buildings/:buildingId/floors` | POST | `{ floorNumber, name?, status? }` | Floor | createFloorSchema | ownerOrAdmin | Dialog | Planned |
| F3 | Update floor | PropertyScreen | `/manage/floors/:id` | PUT | Partial floor fields | Floor | updateFloorSchema | ownerOrAdmin | Dialog | Planned |
| F4 | Delete floor | PropertyScreen | `/manage/floors/:id` | DELETE | — | — | — | ownerOrAdmin | Confirm dialog | Planned |

### 2.6 Room Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| R1 | List rooms (by floor) | PropertyScreen | `/manage/floors/:floorId/rooms` | GET | — | Room[] | ownerOrAdmin | Inline | Planned |
| R2 | Get room detail | RoomDetailScreen | `/manage/rooms/:id` | GET | — | Room + populated beds | ownerOrAdmin | Drawer/panel | Planned |
| R3 | Create room (floor-based) | CreateEditRoomScreen | `/manage/floors/:floorId/rooms` | POST | Room fields | Room + Beds auto-created | createRoomSchema | ownerOrAdmin | Dialog | Planned |
| R4 | Create room (PG-first) | CreateEditRoomScreen | `/manage/pgs/:pgId/rooms` | POST | Room fields + floorLabel | Room + auto building/floor | createPGRoomSchema | ownerOrAdmin | Dialog | Planned |
| R5 | Update room | CreateEditRoomScreen | `/manage/rooms/:id` | PUT | Partial room fields | Room | updateRoomSchema | ownerOrAdmin | Dialog | Planned |
| R6 | Delete room | RoomDetailScreen | `/manage/rooms/:id` | DELETE | — | — | — | ownerOrAdmin | Confirm dialog | Planned |

### 2.7 Bed Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| BD1 | List beds (by room) | RoomDetailScreen | `/manage/rooms/:roomId/beds` | GET | — | Bed[] | ownerOrAdmin | Inline | Planned |
| BD2 | Update bed | RoomDetailScreen | `/manage/beds/:id` | PUT | `{ bedLabel?, status?, rentOverride?, notes? }` | Bed | updateBedSchema | ownerOrAdmin | Dialog | Planned |

### 2.8 Tenant Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| T1 | List tenants | TenantListScreen | `/manage/pgs/:pgId/tenants` | GET | `?status&room&search&page&limit` | `{ data: Tenant[], pagination{}, stats{} }` | ownerOrAdmin | `/properties/:id/tenants` | Planned |
| T2 | Get tenant detail | TenantDetailScreen | `/manage/tenants/:id` | GET | — | Tenant (populated room/bed/building/floor/user) | ownerOrAdmin | Drawer/panel | Planned |
| T3 | Add tenant | AddTenantScreen | `/manage/pgs/:pgId/tenants` | POST | Tenant fields + bed/room assignment | Tenant | addTenantSchema | ownerOrAdmin | Dialog/drawer | Planned |
| T4 | Update tenant | TenantDetailScreen | `/manage/tenants/:id` | PUT | Partial tenant fields | Tenant | updateTenantSchema | ownerOrAdmin | Dialog | Planned |
| T5 | Search existing tenants | AddTenantScreen | `/manage/tenants/search-existing` | GET | `?query` | User[] | ownerOrAdmin | Combobox | Planned |
| T6 | Assign bed to tenant | TenantDetailScreen | `/manage/tenants/:tenantId/assign-bed` | POST | `{ bedId }` | — | ownerOrAdmin | Dialog | Planned |
| T7 | Vacate tenant | TenantDetailScreen | `/manage/tenants/:id/vacate` | POST | `{ actualLeaveDate?, refundDeposit? }` | — | ownerOrAdmin | Confirm dialog | Planned |

### 2.9 Rent Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| RN1 | Generate monthly rent | RentDashboardScreen | `/manage/pgs/:pgId/rent/generate` | POST | `{ month, year, dueDayOfMonth? }` | `{ created, skipped, total, records[] }` | generateRentSchema | ownerOrAdmin | Dialog | Planned |
| RN2 | List rent records | InvoiceListScreen | `/manage/pgs/:pgId/rent` | GET | `?status&month&year&page&limit` | `{ data: RentRecord[], pagination{}, summary{} }` | ownerOrAdmin | `/properties/:id/rent` | Planned |
| RN3 | Get rent summary | RentDashboardScreen | `/manage/pgs/:pgId/rent/summary` | GET | `?month&year` | Summary aggregation | ownerOrAdmin | Widget | Planned |
| RN4 | Get single rent record | InvoiceDetailScreen | `/manage/rent/:id` | GET | — | RentRecord (populated) | ownerOrAdmin | Drawer/panel | Planned |
| RN5 | Update rent record | InvoiceDetailScreen | `/manage/rent/:id` | PUT | `{ rentAmount?, lateFee?, discount?, additionalCharges?, dueDate?, status?, notes? }` | RentRecord | updateRentRecordSchema | ownerOrAdmin | Dialog | Planned |
| RN6 | Delete rent record | InvoiceDetailScreen | `/manage/rent/:id` | DELETE | — | — (only if paidAmount=0) | ownerOrAdmin | Confirm dialog | Planned |
| RN7 | Mark rent paid | RecordPaymentScreen | `/manage/rent/:id/mark-paid` | POST | `{ amount, method?, reference?, notes? }` | RentRecord | markRentPaidSchema | ownerOrAdmin | Dialog | Planned |
| RN8 | Send rent reminder | InvoiceDetailScreen | `/manage/rent/:id/send-reminder` | POST | `{ channel, type?, customMessage? }` | — | sendReminderSchema | ownerOrAdmin | Button | Planned |
| RN9 | Send bulk reminders | RentDashboardScreen | `/manage/rent/bulk-reminders` | POST | — | `{ sent, failed, results[] }` | ownerOrAdmin | Button + confirm | Planned |
| RN10 | Create payment link | InvoiceDetailScreen | `/manage/rent/:id/payment-link` | POST | — | `{ paymentLink }` | ownerOrAdmin | Button | Planned |
| RN11 | Verify payment status | InvoiceDetailScreen | `/manage/rent/:id/verify-status` | POST | — | Updated status | ownerOrAdmin | Button | Planned |
| RN12 | View reminder history | InvoiceDetailScreen | `/manage/rent/:id/reminders` | GET | — | Reminder[] | ownerOrAdmin | Panel | Planned |
| RN13 | Get rent settings | RentSettingsScreen | `/manage/pgs/:pgId/rent-settings` | GET | — | `{ dueDayOfMonth, lateFeePerDay, autoRemindWhatsApp, etc. }` | ownerOrAdmin | Settings page | Planned |
| RN14 | Update rent settings | RentSettingsScreen | `/manage/pgs/:pgId/rent-settings` | PUT | Rent settings fields | Updated settings | ownerOrAdmin | Settings page | Planned |
| RN15 | Get tenant rent records | TenantDetailScreen | `/manage/tenants/:tenantId/rent` | GET | — | RentRecord[] | ownerOrAdmin | Tenant panel | Planned |
| RN16 | Get receipt | InvoiceDetailScreen | `/manage/rent/:id/receipt` | GET | — | Receipt data/URL | Protected | Download/view | Planned |

### 2.10 Payment Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| PM1 | Create Razorpay order | PaymentFlow | `/manage/payments/create-order` | POST | `{ amount, currency?, rentRecordId?, description? }` | `{ orderId, amount }` | Protected | — | Planned |
| PM2 | Verify Razorpay payment | PaymentFlow | `/manage/payments/verify` | POST | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` | Payment | Protected | — | Planned |
| PM3 | List payments | FinanceDashboardScreen | `/manage/pgs/:pgId/payments` | GET | — | Payment[] | ownerOrAdmin | `/properties/:id/payments` | Planned |
| PM4 | Record manual payment | RecordPaymentScreen | `/manage/pgs/:pgId/payments/manual` | POST | Manual payment fields | Payment | ownerOrAdmin | Dialog | Planned |
| PM5 | Refund payment | — | `/manage/payments/:id/refund` | POST | `{ amount?, reason?, notes? }` | Refund result | refundPaymentSchema | ownerOrAdmin | Dialog | Planned |
| PM6 | Get payment receipt | InvoiceDetailScreen | `/manage/payments/:id/receipt` | GET | — | Receipt data/URL | Protected | Download | Planned |
| PM7 | Create payment link | — | `/manage/payments/create-link` | POST | `{ rentRecordId?, tenantId?, amount, description?, sendWhatsApp?, sendEmail? }` | Payment link | createPaymentLinkSchema | ownerOrAdmin | Dialog | Planned |

### 2.11 Expense Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| E1 | List expenses | ExpenseListScreen | `/manage/pgs/:pgId/expenses` | GET | — | Expense[] | ownerOrAdmin | `/properties/:id/expenses` | Planned |
| E2 | Get expense detail | ExpenseDetailScreen | `/manage/expenses/:id` | GET | — | Expense | ownerOrAdmin | Drawer | Planned |
| E3 | Add expense | CreateExpenseScreen | `/manage/pgs/:pgId/expenses` | POST | Expense fields | Expense | addExpenseSchema | ownerOrAdmin | Dialog | Planned |
| E4 | Update expense | ExpenseDetailScreen | `/manage/expenses/:id` | PUT | Partial fields | Expense | ownerOrAdmin | Dialog | Planned |
| E5 | Delete expense | ExpenseDetailScreen | `/manage/expenses/:id` | DELETE | — | — | ownerOrAdmin | Confirm dialog | Planned |
| E6 | Approve expense | ExpenseDetailScreen | `/manage/expenses/:id/approve` | POST | `{ notes? }` | Expense | ownerOrAdmin | Button | Planned |
| E7 | Reject expense | ExpenseDetailScreen | `/manage/expenses/:id/reject` | POST | `{ reason? }` | Expense | ownerOrAdmin | Button | Planned |
| E8 | Upload expense receipt | ExpenseDetailScreen | `/manage/expenses/:id/receipt` | POST | FormData (file) | Expense | ownerOrAdmin | Upload | Planned |
| E9 | Expense summary | FinanceDashboardScreen | `/manage/pgs/:pgId/expenses/summary` | GET | — | Summary aggregation | ownerOrAdmin | Widget | Planned |

### 2.12 Staff Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| S1 | List staff | — | `/manage/pgs/:pgId/staff` | GET | — | Staff[] | ownerOrAdmin | `/properties/:id/staff` | Planned |
| S2 | Get staff member | — | `/manage/staff/:id` | GET | — | Staff | ownerOrAdmin | Drawer | Planned |
| S3 | Add staff | — | `/manage/pgs/:pgId/staff` | POST | Staff fields | Staff | addStaffSchema | ownerOrAdmin | Dialog | Planned |
| S4 | Update staff | — | `/manage/staff/:id` | PUT | Partial fields | Staff | updateStaffSchema | ownerOrAdmin | Dialog | Planned |
| S5 | Update staff permissions | — | `/manage/staff/:id/permissions` | PUT | Permission flags | Staff | ownerOrAdmin | Dialog | Planned |
| S6 | Remove staff | — | `/manage/staff/:id` | DELETE | — | — | ownerOrAdmin | Confirm dialog | Planned |

### 2.13 Agreement Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| AG1 | List agreements | — | `/manage/pgs/:pgId/agreements` | GET | — | Agreement[] | ownerOrAdmin | `/properties/:id/agreements` | Planned |
| AG2 | Get agreement | — | `/manage/agreements/:id` | GET | — | Agreement | Protected | Drawer | Planned |
| AG3 | Create agreement | — | `/manage/pgs/:pgId/agreements` | POST | Agreement fields | Agreement | createAgreementSchema | ownerOrAdmin | Dialog | Planned |
| AG4 | Update agreement | — | `/manage/agreements/:id` | PUT | Partial fields | Agreement | updateAgreementSchema | ownerOrAdmin | Dialog | Planned |
| AG5 | Download agreement PDF | — | `/manage/agreements/:id/pdf` | GET | — | PDF/URL | Protected | Download | Planned |
| AG6 | Regenerate PDF | — | `/manage/agreements/:id/regenerate-pdf` | POST | — | Agreement | ownerOrAdmin | Button | Planned |

### 2.14 Hiring Marketplace (Owner)

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| H1 | Create job post | — | `/manage/pgs/:pgId/jobs` | POST | Job fields | JobPost | createJobPostSchema | ownerOrAdmin | `/properties/:id/hiring` | Planned |
| H2 | List my job posts | — | `/manage/pgs/:pgId/jobs` | GET | — | JobPost[] | ownerOrAdmin | `/properties/:id/hiring` | Planned |
| H3 | Update job post | — | `/manage/jobs/:id` | PUT | — | JobPost | ownerOrAdmin | Dialog | Planned |
| H4 | Get applications | — | `/manage/jobs/:jobId/applications` | GET | — | Application[] | ownerOrAdmin | Panel | Planned |
| H5 | Update application status | — | `/manage/applications/:id/status` | PUT | `{ status, ownerNotes? }` | Application | ownerOrAdmin | Button | Planned |

### 2.15 Meal Management

| # | Feature | Mobile Screen | API Endpoint | Method | Request | Response | Validation | Permission | Web Route | Status |
|---|---------|--------------|-------------|--------|---------|----------|------------|-----------|-----------|--------|
| ML1 | Create meal menu | — | `/manage/pgs/:pgId/meals` | POST | Meal fields | MealMenu | ownerOrAdmin | Dialog | Planned |
| ML2 | List meal menus | — | `/manage/pgs/:pgId/meals` | GET | — | MealMenu[] | ownerOrAdmin | `/properties/:id/meals` | Planned |
| ML3 | Get meal menu | — | `/manage/meals/:id` | GET | — | MealMenu | ownerOrAdmin | Drawer | Planned |
| ML4 | Update meal menu | — | `/manage/meals/:id` | PUT | — | MealMenu | ownerOrAdmin | Dialog | Planned |
| ML5 | Delete meal menu | — | `/manage/meals/:id` | DELETE | — | — | ownerOrAdmin | Confirm dialog | Planned |
| ML6 | Publish meal menu | — | `/manage/meals/:id/publish` | POST | — | MealMenu | ownerOrAdmin | Button | Planned |

---

## 3. Backend API Response Envelope

```
Success: { success: true, message: string, data: T }
Error:   { success: false, message: string, errors?: object }
Paginated: { success: true, message: string, data: T[], pagination: { page, limit, total, pages } }
```

---

## 4. Key Enumerations (from Models)

### Roles
`admin | owner | tenant | staff | property_manager | hotel_owner | pg_owner | meetup_organizer | hot_deals_partner`

### PG Status
`draft | pending | submitted | pending_review | approved | rejected | correction_required | suspended | archived`

### Room Status
`active | inactive | maintenance | renovation`

### Bed Status
`vacant | occupied | reserved | maintenance`

### Tenant Status
`pending | active | notice | vacated | inactive`

### RentRecord Status
`pending | partial | paid | overdue | waived`

### Payment Status
`created | paid | failed | refunded | cancelled`

### Payment Methods
`online | cash | upi | bank_transfer | cheque | other`

### Expense Categories
`maintenance | utilities | electricity | water | staff_salary | salary | food | groceries | cleaning | housekeeping | repairs | security | internet | rent | furniture | equipment | taxes | insurance | marketing | gas | miscellaneous | other`

### Expense Status
`pending | approved | rejected`

### Agreement Status
`draft | active | expired | terminated | renewed`

### Staff Roles
`manager | property_manager | security | cleaner | cook | electrician | plumber | gardener | driver | other`

### Share Types
`single | double | triple | four | dormitory`

### Floor Labels
`ground | first | second | third | fourth | fifth | sixth | seventh | eighth | ninth | tenth | eleventh | twelfth | thirteenth | fourteenth | fifteenth | terrace | basement`

---

## 5. Backend Gap Analysis

### Case A — Backend Already Supports (Reuse as-is)
All 80+ API endpoints in the manage routes are production-ready and fully implemented. The web app will consume them directly.

### Case B — Backend Supports Logic but API Response Insufficient
- **PG Listing for Owner:** The dashboard endpoint returns PG list, but there is no dedicated "list my PGs" endpoint. The dashboard `pgs[]` array includes the owner's properties. **Mitigation:** Use `/manage/dashboard` → `pgs[]` for property selection. ✅ No backend change needed.

### Case C — Backend Functionality Actually Missing
- **Bulk Actions (Tenant):** No bulk tenant operations exist (bulk vacate, bulk edit). Low priority — implement individual operations first.
- **Export/Download:** No CSV export endpoint for tenants/rent/expenses in the manage routes. The `adminExport.controller.js` exists but is admin-only. **Consideration:** May need a minimal owner-scoped export endpoint in Phase 9+.

### Case D — Backend Incorrect/Inconsistent
- **Mobile reminder endpoint URL mismatch:** Mobile `manage.service.js` calls `/manage/rent/:id/reminder` but the backend route is `/manage/rent/:id/send-reminder`. **Impact:** The mobile service file appears to have the wrong URL for `sendRentReminder`. Web app will use the correct backend route `/manage/rent/:id/send-reminder`.

### Case E — Web-Only UX (No Backend Change)
- URL-based property context — purely client-side routing
- Sidebar navigation — purely client-side
- Table column preferences — localStorage
- Dark mode — CSS custom properties
- Print-friendly receipt views — CSS print styles
- Keyboard shortcuts — client-side

---

## 6. Mobile-Only Behavior (Will NOT Port)

| Feature | Reason |
|---------|--------|
| Push notifications (Expo) | Web uses browser-native mechanisms |
| Secure Store (JWT) | Web uses HTTP-only cookies or secure storage |
| React Navigation | Web uses Next.js App Router |
| Bottom tab navigation | Web uses sidebar/header navigation |
| Deep linking via React Navigation | Web uses URL routing natively |
| Camera/Gallery image picker | Web uses file input + drag & drop |

---

## 7. Implementation Status — All Phases Complete ✅

### Phase 1 — Analysis ✅
- Comprehensive parity matrix and forensic breakdown completed.

### Phase 2 — Web Foundation ✅
- Next.js 16 (App Router + Turbopack), TypeScript, Tailwind CSS v4, dark theme design system.
- Radix UI primitives, glassmorphism UI components, Lucide icons, Inter typography.
- TanStack Query v5 configured with SSR-safe client, cache policies, retry strategies.
- Type-safe unified API Client with JWT Bearer injection, auto 401 handling, and error envelope parsing.
- Persistent Zustand authentication store with browser cookie sync.
- Authentication pages: `/login` (Unified OTP via SMS/WhatsApp), `/verify-otp`, `/register`.

### Phase 3 — Property & Room Management ✅
- Route: `/dashboard` (Multi-PG overview) and `/properties/[propertyId]/rooms`.
- Interactive Room & Bed matrix with floor filtering, bed status indicators, and tenant allocations.
- "Add Room" modal (`createPGRoom`) with floor label, share types (single/double/triple/dorm), rent per bed, attached bath, AC.
- "Manage Bed" modal (`updateBed`) for custom rent overrides, notes, and maintenance toggles.

### Phase 4 — Tenant Management ✅
- Route: `/properties/[propertyId]/tenants`.
- Search, filter by status (All, Active, Notice, Vacated).
- Tenant data table with contact info, room & bed badges, monthly rent, and join date.
- "Onboard Resident" modal with live available bed dropdown, deposit tracking, emergency contact, food preference.
- "Vacate Resident" workflow with deposit refund calculations.
- Resident KYC & Profile modal.

### Phase 5 — Rent & Collection Management ✅
- Route: `/properties/[propertyId]/rent`.
- Month & year billing period selector, status filter tabs (All, Overdue, Pending, Partial, Paid).
- Aggregate collection KPIs: Total Expected, Total Collected, Pending Due, Overdue alerts.
- "Generate Monthly Invoices" modal with customizable due day of month.
- "Record Rent Payment" modal with payment method (UPI, Cash, Bank Transfer, Card), ref ID, notes.
- "Send WhatsApp Reminder" action triggering backend automated messaging.
- "Remind All Pending" bulk reminder trigger.

### Phase 6 — Expense Management ✅
- Route: `/properties/[propertyId]/expenses`.
- Operating expenses ledger with category filter chips (Maintenance, Utilities, Electricity, Staff Salary, Food, etc.).
- "Log Expense" modal with amount, category, expense date, vendor details, and payment mode.
- Approval and rejection workflows for pending expense receipts.

### Phase 7 — Owner & Property Dashboards ✅
- Route: `/dashboard` (Consolidated multi-property overview) and `/properties/[propertyId]`.
- Portfolio KPIs: Total properties, bed occupancy rate, monthly rent collected, net operating profit.
- Real-time alerts for overdue rents and upcoming tenant notices.
- Visual room allocation breakdown (Occupied, Partial, Vacant).

### Phase 8 — Staff, Agreements, Settings, Analytics ✅
- Staff Roster (`/properties/[propertyId]/staff`): Role assignments, salaries, joining dates, and delegated permission toggles.
- Digital Agreements (`/properties/[propertyId]/agreements`): Rental contract generator with lock-in terms, deposit rules, and PDF download.
- Financial P&L Analytics (`/properties/[propertyId]/reports`): Annual cash flow comparison (Revenue vs Expenses bar charts) and monthly ledger statement.
- Property & Rent Settings (`/properties/[propertyId]/settings`): Due day of month, grace periods, daily late fee, WhatsApp automation toggles, and UPI bank settlement info.
