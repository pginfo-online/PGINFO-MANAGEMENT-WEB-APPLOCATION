# PgInfo Frontend — Production-Grade Property Management Web Application

> A Next.js 16 enterprise web application engineered for property managers, hostel administrators, and PG/co-living operators. Built with strict TypeScript, Tailwind CSS v4, TanStack Query v5, Zustand, and Recharts, integrated seamlessly with the PgInfo NestJS REST backend.

---

## 1. UI Design Baseline & Reference Image Fidelity

The interface has been meticulously designed to reproduce the exact UX, visual hierarchy, dark navy accents, and component architecture demonstrated in the reference design images located in `frontend/ui/`:

| Reference | Screen / Flow | Implementation | Key Capabilities |
|---|---|---|---|
| **`ref-1.jpeg`** | **Home Dashboard** | [`OverviewHome.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/dashboard/OverviewHome.tsx) | Dark navy header with property switcher dropdown, quick-action pill bar (*All Tenants*, *All Rooms*, *Settings*), live summary KPI cards (*Total Collected*, *Pending Dues*, *Occupancy %*, *Vacant Beds*), and multi-property overview cards. |
| **`ref-2.jpeg`** & **`ref-3.jpeg`** | **Property Selector Modal** | [`PropertySelectorModal.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/modals/PropertySelectorModal.tsx) | Modal with 3 category tabs (*Property*, *Area*, *Groups*), portfolio aggregate statistics (2 properties, 8 occupied, 16 total beds, ₹72k target rent), group accordion (*"PG"*, *"Flat"*), and instant property switching. |
| **`ref-4.jpeg`** | **Detailed Analytics View** | [`DetailedDashboardView.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/dashboard/DetailedDashboardView.tsx) | *"Bird's View"* analytics with interactive period filter (*Past 30 days*), Rio AI assistant pill button, collection trends area charts, occupancy donut charts, and cash-flow breakdowns. |
| **`ref-5.jpeg`** | **Tenant Directory Table** | [`TenantDirectoryTable.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/tenants/TenantDirectoryTable.tsx) | Filterable tenant roster displaying Room/Bed indicators, lease dates, overdue dues badges, monthly rent, and 1-click WhatsApp reminder & phone call action buttons. |
| **`ref-6.jpeg`** | **Add Rent Dues Drawer** | [`AddRentDuesDrawer.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/drawers/AddRentDuesDrawer.tsx) | Multi-tenant and room due generation drawer with billing cycle picker, due date calendar, base rent and itemized utility add-ons, and instant ledger commitment. |
| **`ref-7.jpeg`** | **Room Profile 360** | [`RoomProfile360.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/rooms/RoomProfile360.tsx) | Detailed room inventory view showing bed occupancy status chips (*Occupied*, *Vacant*, *Under Maintenance*), assigned tenant tags, base rent per bed, amenities, and sticky bottom action bar. |
| **`ref-8.jpeg`** | **Command Palette (⌘K)** | [`GlobalSearchDialog.tsx`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/components/modals/GlobalSearchDialog.tsx) | Global spotlight dialog triggered via keyboard shortcut `⌘K` or top search bar. Instant fuzzy search across tenants, rooms, dues, complaints, and settings with category filter tabs. |

---

## 2. Technology Stack & Libraries

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org) with React 19 and Turbopack compiler.
- **Language**: Strict TypeScript (`noEmit: true`, full interface typings across all domain models).
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com) with custom CSS variables, custom scrollbars, and dark navy enterprise palette (`#0B132B`, `#1C2541`, `#3A506B`, `#4F46E5`).
- **Server State & Caching**: [TanStack Query v5](https://tanstack.com/query) (`@tanstack/react-query`) with automatic background revalidation, optimistic mutation handling, and query invalidation.
- **Client State**: [Zustand](https://zustand.docs.pmnd.rs) lightweight global state for active property context, search dialog visibility, and slide-over drawers.
- **Iconography**: [Lucide React](https://lucide.dev) for clean, modern interface icons.
- **Charts & Data Visualization**: [Recharts](https://recharts.org) for responsive revenue trends, collection area charts, and occupancy status donut charts.
- **Validation**: [Zod](https://zod.dev) schemas aligned directly with backend validation pipes.

---

## 3. Core Functional Domains & Routes

The application implements all 7 functional domains plus the complete Authentication module:

### 0. Authentication & Security
- `/login`: Secure user login screen with password reveal toggle, error alerts, and 1-click **Demo Owner Login**.
- `/signup`: Comprehensive user registration with password criteria validation (8+ chars, uppercase, lowercase, numbers), 10-digit mobile check, and auto organization provisioning.

### 1. Dashboard & Operations
- `/` or `/home`: Main executive overview matching `ref-1.jpeg`.
- `/analytics`: Bird's View performance analytics matching `ref-4.jpeg`.

### 2. Money & Billing Management
- `/money`: Unified financial hub.
- `/money/dues`: Overdue and upcoming rent ledger with 1-click WhatsApp collection reminders.
- `/money/collection`: Payment history with FIFO invoice allocation and receipt generation.
- `/money/dues-package`: Standardized monthly recurring billing templates and rules.
- `/money/expense`: Property operational expenses by category (repairs, utilities, groceries).
- `/money/banks` & `/banks`: Registered bank accounts and UPI IDs for rent payouts.

### 3. People & Occupancy Operations
- `/people/tenants`: Comprehensive tenant roster matching `ref-5.jpeg`.
- `/people/tenants/[tenantId]`: 360-degree tenant profile with personal info, KYC status, passbook ledger, and PDF joining form download.
- `/people/tenants/addTenant`: 4-step tenant onboarding wizard with room/bed selection and pro-rata rent calculation.
- `/people/oldTenant`: Historical tenant records and move-out settlement history.
- `/people/leads`: Inbound prospect pipeline with stage tracking (*New*, *Contacted*, *Visited*, *Converted*).
- `/people/bookings`: Advance bed reservations with token deposit tracking.
- `/people/team`: Staff members, managers, and operational role assignments.

### 4. Property & Infrastructure
- `/property`: Property portfolio summary with floor-by-floor occupancy status.
- `/property/rooms`: Comprehensive room catalog with bed capacity indicators.
- `/property/rooms/[roomId]`: Room 360 profile matching `ref-7.jpeg`.
- `/property/bed-availability`: Real-time matrix of vacant vs occupied beds across properties.
- `/property/meters`: Electric and water sub-meter reading logs and billing units.
- `/property/food`: Weekly mess/meal schedule with breakfast, lunch, and dinner plans.
- `/property/complaints`: Resident ticket helpdesk with urgency tags (*Low*, *Medium*, *High*, *Critical*).

### 5. Marketplace & Public Listings
- `/listings`: Public property portal configuration, room sharing options, and pricing displays.

### 6. Communications & WhatsApp
- `/whatsapp/tenants`: Bulk rent reminder center with pre-formatted WhatsApp payment links.

### 7. Reports & System Settings
- `/reports`: Financial P&L summaries, occupancy reports, and tax ledgers.
- `/settings`: Organization profile, GST settings, and system preferences.

---

## 4. Mobile-First Experience

For screen widths under 768px (tested at 375px, 390px, and 414px), the authenticated portal activates an intentional mobile experience:
- **5-Tab Sticky Bottom Navigation**:
  1. **Home** (`/home`)
  2. **Money** (`/money`)
  3. **All** (Triggers slide-up action sheet with quick navigation to all 7 domains)
  4. **People** (`/people/tenants`)
  5. **Property** (`/property`)
- **Safe Area Insets**: Floating action buttons (`Add Tenant`, `Add Room`, `Receive Payment`) are elevated above the bottom bar with backdrop blur.
- **Touch-Friendly Controls**: Minimum 44px tap targets for mobile convenience.

---

## 5. API Integration & Backend Proxying

All frontend network requests are routed through a centralized, typed API client located at [`frontend/lib/api/client.ts`](file:///Users/madhavmore/Desktop/2030/pgInfoManage/frontend/lib/api/client.ts).

### Proxy Architecture
Next.js acts as a reverse proxy for all API calls in `next.config.ts`:
- `/api/v1/:path*` ➔ `http://localhost:3000/api/v1/:path*`
- `/health/:path*` ➔ `http://localhost:3000/health/:path*`

### Authentication & Tenant Isolation
- **Auto-Authentication in Development**: Automatically logs in using owner credentials and obtains an organization-scoped JWT token.
- **Dynamic Organization Switching**: Stores active organization context in `localStorage` and appends `Authorization: Bearer <orgToken>` to every request.
- **Integer Paise Arithmetic**: All financial mutations and displays strictly respect the backend's integer paise format (e.g. ₹32,516 = 3,251,600 paise).
- **RFC 9457 Error Handling**: Preserves error detail messages from NestJS `ProblemDetailsFilter` and renders user-friendly toast alerts.

---

## 6. Development & Production Run Commands

### Development Server
```bash
cd frontend
npm run dev
# Starts Next.js development server on http://localhost:3000 (or 3001 if backend occupies 3000)
```

### Production Build & Serve
```bash
cd frontend
npm run build
PORT=3001 npm start
# Serves optimized production build at http://localhost:3001
```

### Type Checking & Linting
```bash
cd frontend
npm run lint
# Runs ESLint and strict TypeScript type validations
```

## Deploying on Vercel

Import the frontend repository into Vercel and use the Next.js framework
preset. If deploying from this directory as its own repository, set the Root
Directory to `.`; if deploying from the monorepo, set it to `frontend`.
Use `pnpm install --frozen-lockfile` to install dependencies and `pnpm build`
to build the app.

Production API requests are proxied server-side through Next.js to
`https://app.pginfo.business` by default. To use a different backend for a
Vercel environment, set `PGINFO_BACKEND_ORIGIN` to that backend's origin
(scheme and host, without `/api/v1`). This variable is server-side and should
not use the `NEXT_PUBLIC_` prefix. Local development continues to use
`http://127.0.0.1:3009`.
