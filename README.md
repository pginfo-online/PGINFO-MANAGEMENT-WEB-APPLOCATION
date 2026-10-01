# PGinfo Management — Owner Web Portal

> **Enterprise-Grade Paying Guest (PG) & Hostel Management Web Application**  
> Built with Next.js 16 (App Router + Turbopack), TypeScript, Tailwind CSS v4, Radix UI Primitives, and TanStack Query v5.

---

## Architecture & Technology Stack

- **Framework:** Next.js 16 (React 19, Turbopack, App Router)
- **Styling:** Tailwind CSS v4, Glassmorphism, CSS Custom Properties (Dark theme design system)
- **Typography:** Inter (`next/font/google`)
- **State Management:**
  - Server state: TanStack Query v5 (automatic garbage collection, cache policies, retry strategies)
  - Client / Auth state: Zustand with `persist` middleware and cookie synchronization
- **Type Safety:** Full TypeScript strict mode with zero type assertion leaks
- **Icons:** Lucide React
- **UI Primitives:** Radix UI Dialog, Dropdown Menu, Tabs, Badges, StatCards, EmptyStates
- **Testing:** Automated unit testing via `tsx --test` (Node test runner)
- **Code Quality:** ESLint 9 + Next.js core web vitals, zero lint warnings or errors

---

## Owner Feature Suite

### 1. Unified Authentication (`/(auth)`)
- **Phone OTP Login (`/login`):** Unified OTP dispatch via SMS and WhatsApp.
- **OTP Verification (`/verify-otp`):** 6-digit verification code with resend countdown timer.
- **New Owner Onboarding (`/register`):** Profile completion and credential generation.
- **Persistent Sessions:** Bearer token management with auto 401 redirection.

### 2. Multi-PG & Single Property Dashboards
- **Multi-PG Portfolio (`/dashboard`):** Consolidated bed occupancy, monthly rent collections, and net operating profit across all owner properties.
- **Property Dashboard (`/properties/[propertyId]`):** Property-specific operational KPIs, occupancy distribution, overdue invoice alerts, and vacancy indicators.

### 3. Room & Bed Allocation Matrix (`/properties/[propertyId]/rooms`)
- Floor-by-floor visual room layout.
- Bed-level status tracking (Vacant, Occupied, Reserved, Maintenance).
- "Add Room" modal (`createPGRoom`) with floor label, sharing configuration, base rent, and amenities (AC, attached bath).
- "Manage Bed" modal (`updateBed`) for custom rent overrides, notes, and maintenance toggles.

### 4. Tenant Registry & Resident Management (`/properties/[propertyId]/tenants`)
- Status filtering (Active, On Notice, Vacated) and real-time search.
- Resident KYC details modal (ID proof, emergency contact, food preference).
- "Onboard Resident" modal with live available bed dropdown, deposit tracking, and move-in dates.
- "Vacate Resident" workflow with security deposit settlement calculations.

### 5. Rent Collections & Invoices (`/properties/[propertyId]/rent`)
- Period selector (Month / Year) and status filtering (Paid, Pending, Overdue, Partial).
- KPI summaries: Expected, Collected, Pending, and Overdue balances.
- "Generate Monthly Invoices" modal with configurable due day of month.
- "Record Rent Payment" modal supporting UPI, Cash, Bank Transfer, Card, and Cheque.
- One-click WhatsApp payment reminders and bulk reminder dispatch.

### 6. Expense Management & Operating Costs (`/properties/[propertyId]/expenses`)
- Operating expense ledger categorized by Maintenance, Utilities, Electricity, Staff Salary, Food/Groceries, Cleaning, and Repairs.
- "Log Expense" modal with vendor name, payment method, and amount.
- Approval and rejection workflows for pending receipts.

### 7. Staff & Crew Roster (`/properties/[propertyId]/staff`)
- On-site employee directory (Manager, Security, Cleaner, Cook, Electrician).
- Salary, payment cycle, and joining date tracking.
- Delegated operational permissions (tenant onboarding, rent recording, expense submission).

### 8. Digital Rental Agreements (`/properties/[propertyId]/agreements`)
- Digital contract repository with unique agreement numbers, duration terms, and rent locks.
- One-click PDF generation and download.

### 9. Financial Analytics & Annual P&L (`/properties/[propertyId]/reports`)
- Annual cash flow comparison (Revenue vs Expenses bar charts).
- Month-by-month accounting ledger with collection efficiency and net profit margins.

### 10. Property Settings & Rules (`/properties/[propertyId]/settings`)
- Billing cycle configuration (due day, grace period, daily late fee).
- Automated WhatsApp payment reminder intervals.
- Direct bank account and UPI VPA settlement configuration.

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x or 22.x
- Backend API server running at `https://pginfo.business/api/v1` or local endpoint.

### Installation

```bash
# Navigate to the web application directory
cd pgmanagement

# Install dependencies
npm install
```

### Environment Configuration

Create or update `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://pginfo.business/api/v1
NEXT_PUBLIC_APP_NAME="PGinfo Management"
```

### Available Scripts

```bash
# Start local development server (Turbopack)
npm run dev

# Run automated test suite
npm test

# Run code style & lint checks
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```
