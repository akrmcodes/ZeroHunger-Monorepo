# ZeroHunger Frontend - Development Roadmap

> **Version:** 1.0  
> **Created:** 2025-12-22  
> **Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Shadcn UI, Framer Motion  
> **Backend Compatibility:** Laravel 12 & Java Spring Boot (via environment abstraction)

---

## Table of Contents

1. [Project Tech Stack & Architecture](#section-1-project-tech-stack--architecture)
2. [Phased Implementation Plan](#section-2-phased-implementation-plan)
   - [Stage 1: Project Foundation & Authentication](#stage-1-project-foundation--authentication)
   - [Stage 2: Dashboard & Role-Based Views](#stage-2-dashboard--role-based-views)
   - [Stage 3:  Donation Management (Donor)](#stage-3-donation-management-donor)
   - [Stage 4: Claim Workflow (Volunteer)](#stage-4-claim-workflow-volunteer)
   - [Stage 5: Geolocation & Map Integration](#stage-5-geolocation--map-integration)
   - [Stage 6:  Notifications System](#stage-6-notifications-system)
   - [Stage 7: Profile & Settings](#stage-7-profile--settings)
   - [Stage 8: Polish, Animation & Accessibility](#stage-8-polish-animation--accessibility)
   - [Stage 9: Testing & Quality Assurance](#stage-9-testing--quality-assurance)
   - [Stage 10: Deployment & Documentation](#stage-10-deployment--documentation)

---

## Section 1: Project Tech Stack & Architecture

### 1.1 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.x (Latest Stable) | App Router, Server Components, Turbopack |
| **Language** | TypeScript | 5.x | Type safety, IntelliSense, contract enforcement |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS, design tokens |
| **UI Library** | Shadcn UI | Latest | Accessible, customizable components |
| **Animation** | Framer Motion | 11.x | Page transitions, micro-interactions |
| **State Management** | React Context + TanStack Query | v5 | Server state, caching, mutations |
| **Forms** | React Hook Form + Zod | Latest | Validation matching API contract |
| **Maps** | React-Leaflet | 4.x | OpenStreetMap integration |
| **HTTP Client** | Axios | 1.x | Centralized API client with interceptors |
| **Icons** | Lucide React | Latest | Consistent iconography |

### 1.2 Architecture Strategy:  Environment Abstraction

#### Problem Statement
The system must support **two backends** (Laravel PHP & Java Spring Boot) with identical API endpoints but different base URLs.  The switch must happen via **environment variable only**—no code changes. 

#### Solution:  Centralized API Client Pattern

```
┌───────────────────────────────────────────────────────────────┐
│                    Environment Layer                          │
│  . env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  │
│  . env.prod:   NEXT_PUBLIC_API_BASE_URL=https://api.java.com  │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                 API Client (lib/api/client. ts)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Axios Instance                                     │   │
│  │  - baseURL: process.env.NEXT_PUBLIC_API_BASE_URL    │   │
│  │  - Default headers (Content-Type, Accept)           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Request Interceptor                                │   │
│  │  - Attach Bearer token from auth store              │   │
│  │  - Add request timing for debugging                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Response Interceptor                               │   │
│  │  - 401: Redirect to /login, clear token             │   │
│  │  - 403: Show permission denied toast                │   │
│  │  - 422: Parse validation errors for forms           │   │
│  │  - 500: Global error boundary trigger               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│              API Modules (lib/api/modules/*. ts)           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  authAPI     │ │ donationAPI  │ │  claimAPI    │        │
│  │  - register  │ │ - list       │ │ - list       │        │
│  │  - login     │ │ - get        │ │ - pickup     │        │
│  │  - logout    │ │ - create     │ │ - deliver    │        │
│  │  - me        │ │ - claim      │ │ - cancel     │        │
│  │              │ │ - nearby     │ │              │        │
│  │              │ │ - myDonations│ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ profileAPI   │ │notificationAPI│                        │
│  │  - update    │ │ - list       │                         │
│  │              │ │ - markRead   │                         │
│  └──────────────┘ └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Type Definitions (types/*. ts)               │
│  - User, Donation, Claim, Notification interfaces           │
│  - API Response wrappers (ApiResponse<T>)                   │
│  - Error types matching API-CONTRACT.md                     │
│  - Zod schemas for runtime validation                       │
└─────────────────────────────────────────────────────────────┘
```

#### Technical Implementation Details

**1. Base URL Resolution**
```typescript
// lib/api/client.ts
const getBaseUrl = (): string => {
  const url = process.env. NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
  }
  return url. endsWith('/') ? url.slice(0, -1) : url;
};
```

**2. Interceptor Chain**
- **Request**: Token injection, request ID generation
- **Response Success**: Data extraction, response normalization
- **Response Error**: Status-specific handling (401→logout, 422→validation, etc.)

**3. Type Safety Enforcement**
- All API responses wrapped in typed generics:  `Promise<ApiResponse<User>>`
- Zod schemas validate runtime data matches compile-time types
- Strict mode TypeScript with `noUncheckedIndexedAccess`

**4. Backend Detection (Optional Enhancement)**
```typescript
// For logging/debugging which backend is active
const getBackendType = (): 'laravel' | 'java' | 'unknown' => {
  const url = process.env. NEXT_PUBLIC_API_BASE_URL || '';
  if (url.includes(': 8000')) return 'laravel';
  if (url.includes(':8080') || url.includes('java')) return 'java';
  return 'unknown';
};
```

### 1.3 Project Directory Structure

```
src/
├── app/                          # Next.js 16 App Router
│   ├── (auth)/                   # Auth route group (public)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected route group
│   │   ├── layout.tsx            # Dashboard shell with sidebar
│   │   ├── page. tsx              # Role-based dashboard redirect
│   │   ├── donor/
│   │   ├── volunteer/
│   │   └── recipient/
│   ├── donations/
│   │   ├── page.tsx              # List all donations
│   │   ├── [id]/page.tsx         # Single donation detail
│   │   ├── create/page.tsx       # Create donation form
│   │   └── nearby/page.tsx       # Map view
│   ├── claims/
│   │   └── page.tsx              # My claims (volunteer)
│   ├── profile/
│   │   └── page.tsx              # User profile settings
│   ├── notifications/
│   │   └── page.tsx              # Notification center
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── loading.tsx               # Global loading state
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
│
├── components/
│   ├── ui/                       # Shadcn UI components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar. tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── donations/
│   │   ├── DonationCard.tsx
│   │   ├── DonationList.tsx
│   │   ├── DonationForm.tsx
│   │   ├── DonationMap.tsx
│   │   └── ClaimButton.tsx
│   ├── claims/
│   │   ├── ClaimCard.tsx
│   │   ├── PickupDialog.tsx
│   │   └── DeliverDialog.tsx
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationList. tsx
│   └── shared/
│       ├── ImpactScore.tsx
│       ├── StatusBadge.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── index.ts              # Re-export all modules
│   │   └── modules/
│   │       ├── auth.ts
│   │       ├── donations.ts
│   │       ├── claims.ts
│   │       ├── profile.ts
│   │       └── notifications.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDonations.ts
│   │   ├── useClaims.ts
│   │   ├── useNotifications.ts
│   │   └── useGeolocation.ts
│   ├── utils/
│   │   ├── cn.ts                 # Class name merger
│   │   ├── formatters.ts         # Date, number formatters
│   │   └── validators.ts         # Zod schemas
│   └── constants/
│       ├── roles.ts
│       ├── statuses.ts
│       └── routes.ts
│
├── providers/
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   ├── ThemeProvider.tsx
│   └── ToastProvider.tsx
│
├── types/
│   ├── api.ts                    # API response types
│   ├── user.ts
│   ├── donation.ts
│   ├── claim.ts
│   └── notification.ts
│
├── styles/
│   └── globals.css               # Tailwind v4 imports
│
└── middleware. ts                 # Route protection (→ proxy. ts in Next.js 16)
```


---

## Section 2: Phased Implementation Plan

---

### Stage 1: Project Foundation & Authentication

**Goal:** Set up the Next.js 16 project with TypeScript, Tailwind v4, Shadcn UI, and implement complete authentication flow with the centralized API client pattern.

**Features from PROJECT-OVERVIEW.md:**
- User registration with role selection (donor/volunteer/recipient)
- Token-based authentication (Laravel Sanctum compatible)
- Secure token storage and auto-refresh
- Role-based route protection

**Integration - Endpoints from `api.js`:**
- `POST /register` → `authAPI.register(data)`
- `POST /login` → `authAPI.login(data)`
- `POST /logout` → `authAPI.logout()`
- `GET /me` → `authAPI.me()`

#### Task Checklist

**1. 1 Project Initialization**
- [ ] Create Next.js 16 project with TypeScript template (`npx create-next-app@latest`)
- [ ] Configure `tsconfig.json` with strict mode and path aliases
- [ ] Set up Tailwind CSS v4 with design tokens
- [ ] Initialize Shadcn UI with custom theme (brand colors matching ZeroHunger)
- [ ] Install and configure Framer Motion
- [ ] Set up ESLint + Prettier with consistent rules
- [ ] Create `.env.local` and `.env.example` with `NEXT_PUBLIC_API_BASE_URL`
- [ ] Configure `next.config.ts` for image domains and environment variables

**1.2 API Client Architecture**
- [ ] Create `lib/api/client.ts` with Axios instance
- [ ] Implement base URL resolution from environment variable
- [ ] Add request interceptor for Bearer token injection
- [ ] Add response interceptor for error handling (401, 403, 422, 500)
- [ ] Create typed API response wrapper `ApiResponse<T>`
- [ ] Implement `lib/api/modules/auth.ts` with all auth methods
- [ ] Add missing `profileAPI. update()` method
- [ ] Export unified API from `lib/api/index. ts`

**1.3 Type Definitions**
- [ ] Create `types/user.ts` matching contract's User interface
- [ ] Create `types/api.ts` for response wrappers and error types
- [ ] Create Zod schemas for registration validation (matching field rules)
- [ ] Create Zod schemas for login validation

**1.4 Auth Provider & State Management**
- [ ] Create `providers/AuthProvider.tsx` with React Context
- [ ] Implement `useAuth` hook with login, logout, register, user state
- [ ] Handle token persistence in localStorage with SSR safety
- [ ] Create auth state types:  `loading`, `authenticated`, `unauthenticated`
- [ ] Implement auto-logout on 401 responses

**1.5 Authentication Pages**
- [ ] Create `app/(auth)/layout.tsx` - auth pages layout (centered, branded)
- [ ] Build `app/(auth)/login/page.tsx` with LoginForm component
- [ ] Build `app/(auth)/register/page.tsx` with RegisterForm component
- [ ] Implement role selection UI (donor/volunteer/recipient cards)
- [ ] Add form validation with React Hook Form + Zod
- [ ] Display API validation errors (422 responses)
- [ ] Add loading states and submit animations
- [ ] Implement "Remember me" functionality
- [ ] Add social auth placeholders (future enhancement)

**1.6 Route Protection**
- [ ] Create `middleware.ts` (or `proxy.ts` for Next.js 16) for route protection
- [ ] Define public routes: `/`, `/login`, `/register`
- [ ] Define protected routes: `/dashboard/*`, `/donations/*`, `/claims/*`
- [ ] Redirect unauthenticated users to login
- [ ] Redirect authenticated users away from auth pages
- [ ] Create `AuthGuard` component for client-side protection

**1.7 Landing Page**
- [ ] Design `app/page.tsx` landing page with hero section
- [ ] Add feature highlights from PROJECT-OVERVIEW
- [ ] Implement CTA buttons (Get Started → Register, Login)
- [ ] Add Framer Motion entrance animations
- [ ] Create responsive layout (mobile-first)

---

### Stage 2: Dashboard & Role-Based Views

**Goal:** Create role-specific dashboards showing relevant information and actions for donors, volunteers, and recipients.

**Features from PROJECT-OVERVIEW.md:**
- Role-based dashboards
- Impact score display (gamification)
- Quick action cards based on role
- Activity overview

**Integration - Endpoints from `api.js`:**
- `GET /me` → `authAPI.me()` (for user data + roles)
- `GET /my-donations` → `donationAPI.myDonations()` (donor dashboard)
- `GET /claims` → `claimAPI.list()` (volunteer dashboard)
- `GET /donations` → `donationAPI.list()` (recipient dashboard)

#### Task Checklist

**2.1 Dashboard Layout**
- [ ] Create `app/(dashboard)/layout.tsx` with sidebar navigation
- [ ] Build responsive `Sidebar.tsx` component with role-based menu items
- [ ] Create `Navbar.tsx` with user menu dropdown
- [ ] Implement `MobileNav.tsx` with hamburger menu
- [ ] Add active route highlighting
- [ ] Create breadcrumb navigation component

**2.2 Role Detection & Routing**
- [ ] Create `app/(dashboard)/page.tsx` that redirects based on role
- [ ] Implement role-based sidebar menu filtering
- [ ] Create role constants in `lib/constants/roles. ts`
- [ ] Build `useUserRole` hook for role checking

**2.3 Donor Dashboard**
- [ ] Create `app/(dashboard)/donor/page.tsx`
- [ ] Display total donations count
- [ ] Show active donations with status
- [ ] Display impact score with visual badge
- [ ] Add "Create Donation" quick action card
- [ ] Show recent donation activity
- [ ] Implement donation status breakdown (pie chart or stats)

**2.4 Volunteer Dashboard**
- [ ] Create `app/(dashboard)/volunteer/page.tsx`
- [ ] Display active claims count
- [ ] Show claims pending pickup
- [ ] Display completed deliveries count
- [ ] Add "Find Donations" quick action card
- [ ] Show impact score with volunteer-specific messaging
- [ ] Display total kg delivered stat

**2.5 Recipient Dashboard**
- [ ] Create `app/(dashboard)/recipient/page.tsx`
- [ ] Display available donations in area
- [ ] Show nearby donation count
- [ ] Add "View Available" quick action card
- [ ] Display simplified impact stats

**2.6 Shared Dashboard Components**
- [ ] Create `ImpactScore.tsx` component with animation
- [ ] Build `StatCard.tsx` for dashboard metrics
- [ ] Create `QuickAction.tsx` card component
- [ ] Build `RecentActivity.tsx` feed component
- [ ] Add skeleton loading states for all dashboard sections

---

### Stage 3: Donation Management (Donor)

**Goal:** Implement complete donation CRUD operations for donors including creation, viewing, and status tracking.

**Features from PROJECT-OVERVIEW. md:**
- Create donation listings (title, quantity, location, expiry)
- Real-time notifications when claimed
- Provide pickup code for verification
- Track donation status (available → claimed → delivered)

**Integration - Endpoints from `api.js`:**
- `GET /donations` → `donationAPI.list()`
- `GET /donations/{id}` → `donationAPI.get(id)` ⚠️ (needs to be added)
- `POST /donations` → `donationAPI.create(data)`
- `GET /my-donations` → `donationAPI.myDonations()`

#### Task Checklist

**3.1 Type Definitions**
- [ ] Create `types/donation.ts` matching contract's Donation interface
- [ ] Create donation status enum/constants
- [ ] Build Zod schema for donation creation (matching API field rules)
- [ ] Define `DonationWithClaim` type for my-donations response

**3.2 API Module Enhancement**
- [ ] Add `donationAPI.get(id)` method (missing from api.js)
- [ ] Ensure all donation methods return typed responses
- [ ] Add error type definitions for donation operations

**3.3 Donation Listing**
- [ ] Create `app/donations/page.tsx` with DonationList
- [ ] Build `DonationCard.tsx` component with status badge
- [ ] Implement filtering by status (available, reserved, delivered)
- [ ] Add sorting options (newest, expiring soon)
- [ ] Create `StatusBadge.tsx` component with color coding
- [ ] Implement pagination or infinite scroll
- [ ] Add empty state for no donations

**3.4 Donation Creation**
- [ ] Create `app/donations/create/page.tsx`
- [ ] Build `DonationForm.tsx` with all required fields
- [ ] Implement geolocation auto-detect for location
- [ ] Add manual location picker with map
- [ ] Create date/time picker for expiry
- [ ] Add quantity input with kg unit
- [ ] Implement form validation with error messages
- [ ] Add success redirect to donation detail
- [ ] Create loading/submitting state

**3.5 Donation Detail Page**
- [ ] Create `app/donations/[id]/page.tsx`
- [ ] Display full donation information
- [ ] Show pickup code (for donor and assigned volunteer only)
- [ ] Display claim status and volunteer info
- [ ] Add donation timeline/history
- [ ] Show location on embedded map
- [ ] Implement expiry countdown timer

**3.6 My Donations View (Donor)**
- [ ] Create dedicated my-donations page or section
- [ ] Show all donations with claim details
- [ ] Display volunteer contact info for claimed donations
- [ ] Add status filters specific to donor view
- [ ] Implement bulk actions (future enhancement)

---

### Stage 4: Claim Workflow (Volunteer)

**Goal:** Implement the complete volunteer workflow:  discovering donations, claiming, pickup verification, and delivery confirmation.

**Features from PROJECT-OVERVIEW. md:**
- Claim donations with race-condition protection (handled by backend)
- Verify pickup with code from donor
- Mark as picked up → delivered workflow
- Earn impact points (2x for deliveries)

**Integration - Endpoints from `api.js`:**
- `POST /donations/{id}/claim` → `donationAPI.claim(id)`
- `GET /claims` → `claimAPI.list()`
- `POST /claims/{id}/pickup` → `claimAPI.markPickedUp(id, pickupCode)`
- `POST /claims/{id}/deliver` → `claimAPI.markDelivered(id, notes)`
- `DELETE /claims/{id}` → `claimAPI.cancel(id)`

#### Task Checklist

**4.1 Type Definitions**
- [ ] Create `types/claim.ts` matching contract's Claim interface
- [ ] Define claim status enum:  `active`, `picked_up`, `delivered`, `cancelled`
- [ ] Create Zod schema for pickup code validation
- [ ] Create Zod schema for delivery notes

**4.2 Claim Donation Flow**
- [ ] Create `ClaimButton.tsx` component
- [ ] Implement optimistic UI update on claim
- [ ] Handle 409 Conflict (already claimed) gracefully
- [ ] Show pickup code in success dialog
- [ ] Add Framer Motion success animation
- [ ] Display donor contact information after claim

**4.3 Claims Management Page**
- [ ] Create `app/claims/page.tsx`
- [ ] Build `ClaimCard.tsx` component
- [ ] Display claim status with visual indicator
- [ ] Show donation details within claim
- [ ] Add donor information (name, phone)
- [ ] Display pickup location with link to map
- [ ] Filter by status (active, picked_up, delivered)

**4.4 Pickup Verification**
- [ ] Create `PickupDialog.tsx` modal component
- [ ] Implement pickup code input field
- [ ] Add code validation feedback
- [ ] Handle 422 (invalid code) error
- [ ] Show success confirmation with animation
- [ ] Update claim card status immediately

**4.5 Delivery Confirmation**
- [ ] Create `DeliverDialog.tsx` modal component
- [ ] Implement optional notes textarea
- [ ] Handle 409 (not picked up yet) error
- [ ] Show thank you message on success
- [ ] Display impact points earned
- [ ] Update dashboard stats

**4.6 Claim Cancellation**
- [ ] Add cancel option with confirmation dialog
- [ ] Explain that donation becomes available again
- [ ] Implement soft delete UI pattern
- [ ] Update list after cancellation

---

### Stage 5: Geolocation & Map Integration

**Goal:** Implement map-based donation discovery with real-time geolocation and distance-based filtering.

**Features from PROJECT-OVERVIEW. md:**
- View available donations on interactive map
- Find nearby donations with geolocation
- Green markers = available
- Distance from user location
- Radius filtering (default 10km)

**Integration - Endpoints from `api.js`:**
- `GET /donations/nearby? latitude={lat}&longitude={lng}&radius={km}` → `donationAPI.nearby(lat, lng, radius)`

#### Task Checklist

**5.1 Geolocation Hook**
- [ ] Create `useGeolocation.ts` hook
- [ ] Implement browser geolocation API wrapper
- [ ] Handle permission denied gracefully
- [ ] Add fallback for unsupported browsers
- [ ] Store user location in context
- [ ] Implement location refresh functionality

**5.2 Map Components**
- [ ] Install and configure React-Leaflet
- [ ] Create `DonationMap.tsx` wrapper component
- [ ] Implement custom marker icons (green = available, etc.)
- [ ] Create marker popup with donation summary
- [ ] Add user location marker
- [ ] Implement map bounds fitting to donations
- [ ] Handle SSR (dynamic import for Leaflet)

**5.3 Nearby Donations Page**
- [ ] Create `app/donations/nearby/page. tsx`
- [ ] Display map with donation markers
- [ ] Add radius selector (5km, 10km, 25km, 50km)
- [ ] Show distance on each donation
- [ ] Implement list view toggle
- [ ] Sort by distance (nearest first)
- [ ] Add "Use my location" button

**5.4 Donation Form Location**
- [ ] Add map picker to donation creation form
- [ ] Implement click-to-set-location on map
- [ ] Show selected coordinates
- [ ] Add geocoding for address display (optional)
- [ ] Validate coordinates within range

**5.5 Map UI Enhancements**
- [ ] Add loading state while fetching location
- [ ] Implement smooth pan/zoom animations
- [ ] Create mobile-friendly map controls
- [ ] Add "Recenter" button
- [ ] Implement clustering for many donations

---

### Stage 6: Notifications System

**Goal:** Implement in-app notification system showing real-time updates for donation claims, pickups, and deliveries.

**Features from PROJECT-OVERVIEW. md:**
- Real-time notifications (email + in-app)
- Donation claimed notifications
- Donation delivered notifications

**Integration - Endpoints (missing from `api.js`, defined in contract):**
- `GET /notifications` → `notificationAPI.list()`
- `POST /notifications/{id}/read` → `notificationAPI.markRead(id)`

#### Task Checklist

**6.1 API Module**
- [ ] Create `lib/api/modules/notifications.ts`
- [ ] Implement `list()` method
- [ ] Implement `markRead(id)` method
- [ ] Add types matching contract's notification structure

**6.2 Type Definitions**
- [ ] Create `types/notification.ts`
- [ ] Define notification type discriminators
- [ ] Create notification data type (donation_id, message, etc.)

**6.3 Notification Components**
- [ ] Create `NotificationBell.tsx` for navbar
- [ ] Display unread count badge
- [ ] Build dropdown with recent notifications
- [ ] Create `NotificationList.tsx` for full page
- [ ] Implement notification item with icon based on type
- [ ] Add "Mark as read" functionality
- [ ] Create "Mark all as read" action

**6.4 Notification Center Page**
- [ ] Create `app/notifications/page.tsx`
- [ ] Display all notifications with pagination
- [ ] Filter by read/unread status
- [ ] Show notification timestamp
- [ ] Link to relevant resource (donation/claim)
- [ ] Add empty state

**6.5 Real-time Updates (Enhancement)**
- [ ] Implement polling for new notifications (every 30s)
- [ ] Create notification toast for new items
- [ ] Add Framer Motion entrance animation
- [ ] Consider WebSocket for future (out of scope per overview)

---

### Stage 7: Profile & Settings

**Goal:** Allow users to view and update their profile information including location and contact details.

**Features from PROJECT-OVERVIEW.md:**
- View and update profile
- Location settings for volunteers/recipients
- Phone number for coordination

**Integration - Endpoints:**
- `GET /me` → `authAPI.me()`
- `PUT /profile` → `profileAPI.update(data)` ⚠️ (needs to be added to api.js)

#### Task Checklist

**7.1 API Module**
- [ ] Create `lib/api/modules/profile.ts`
- [ ] Implement `update(data)` method
- [ ] Add response types

**7.2 Profile Page**
- [ ] Create `app/profile/page.tsx`
- [ ] Display current user information
- [ ] Show role badges
- [ ] Display impact score prominently
- [ ] Show account creation date

**7.3 Profile Edit Form**
- [ ] Build profile edit form component
- [ ] Editable fields: name, phone, latitude, longitude
- [ ] Non-editable:  email, role
- [ ] Add location picker for coordinates
- [ ] Implement form validation
- [ ] Show success toast on update

**7.4 Account Settings**
- [ ] Add password change section (future)
- [ ] Add notification preferences (future)
- [ ] Add danger zone (delete account - future)

---

### Stage 8: Polish, Animation & Accessibility

**Goal:** Enhance user experience with animations, transitions, and ensure full accessibility compliance.

**Features:**
- Smooth page transitions
- Micro-interactions on buttons and cards
- Loading skeletons
- ARIA compliance
- Keyboard navigation

#### Task Checklist

**8.1 Page Transitions**
- [ ] Implement Framer Motion page transitions
- [ ] Create shared layout animations
- [ ] Add exit animations for route changes
- [ ] Optimize for reduced motion preference

**8.2 Component Animations**
- [ ] Add hover/tap animations to cards
- [ ] Implement button loading spinners
- [ ] Create success/error state animations
- [ ] Add list item stagger animations
- [ ] Implement modal enter/exit animations

**8.3 Loading States**
- [ ] Create skeleton components for each data type
- [ ] Implement suspense boundaries
- [ ] Add loading. tsx files for each route group
- [ ] Create global loading indicator

**8.4 Accessibility Audit**
- [ ] Run axe-core accessibility tests
- [ ] Ensure all images have alt text
- [ ] Add ARIA labels to interactive elements
- [ ] Test keyboard navigation on all pages
- [ ] Verify focus management in modals
- [ ] Test with screen reader
- [ ] Ensure color contrast compliance

**8.5 Responsive Polish**
- [ ] Test all breakpoints (mobile, tablet, desktop)
- [ ] Optimize touch targets for mobile
- [ ] Adjust typography for readability
- [ ] Test landscape orientation

---

### Stage 9: Testing & Quality Assurance

**Goal:** Implement comprehensive testing strategy including unit tests, integration tests, and E2E tests. 

#### Task Checklist

**9.1 Testing Setup**
- [ ] Configure Vitest for unit testing
- [ ] Set up React Testing Library
- [ ] Configure Playwright for E2E testing
- [ ] Set up MSW for API mocking
- [ ] Create test utilities and helpers

**9.2 Unit Tests**
- [ ] Test API client interceptors
- [ ] Test Zod validation schemas
- [ ] Test utility functions (formatters, validators)
- [ ] Test custom hooks with mock data
- [ ] Test auth context state management

**9.3 Component Tests**
- [ ] Test form components with validation
- [ ] Test DonationCard rendering
- [ ] Test ClaimCard status display
- [ ] Test navigation components
- [ ] Test conditional rendering based on role

**9.4 Integration Tests**
- [ ] Test login flow end-to-end
- [ ] Test registration with role selection
- [ ] Test donation creation flow
- [ ] Test claim workflow
- [ ] Test error handling displays

**9.5 E2E Tests (Playwright)**
- [ ] Test complete user journeys per role
- [ ] Test donor:  create donation → view → see claimed
- [ ] Test volunteer: browse → claim → pickup → deliver
- [ ] Test authentication persistence
- [ ] Test responsive behavior

---

### Stage 10: Deployment & Documentation

**Goal:** Prepare for production deployment with optimized builds, documentation, and CI/CD setup.

#### Task Checklist

**10.1 Build Optimization**
- [ ] Run production build and analyze bundle
- [ ] Optimize images with next/image
- [ ] Implement code splitting for routes
- [ ] Configure caching headers
- [ ] Set up environment variables for production

**10.2 Documentation**
- [ ] Write README. md with setup instructions
- [ ] Document environment variables
- [ ] Create component documentation (Storybook optional)
- [ ] Document API client usage
- [ ] Write contribution guidelines

**10.3 CI/CD Pipeline**
- [ ] Set up GitHub Actions workflow
- [ ] Configure build and test jobs
- [ ] Add Playwright E2E test job
- [ ] Set up preview deployments (Vercel)
- [ ] Configure production deployment

**10.4 Monitoring & Analytics**
- [ ] Set up error tracking (Sentry optional)
- [ ] Configure performance monitoring
- [ ] Add analytics (privacy-friendly)

**10.5 Launch Checklist**
- [ ] Verify all environment variables are set
- [ ] Test production build locally
- [ ] Verify API connectivity to both backends
- [ ] Test all user flows in staging
- [ ] Confirm CORS is configured correctly
- [ ] Verify mobile responsiveness
- [ ] Final accessibility audit

---

## Appendix: Quick Reference

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Optional
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_DEFAULT_LATITUDE=30.0444
NEXT_PUBLIC_DEFAULT_LONGITUDE=31.2357
```

### API Module Checklist (Additions Needed)

| Module | Method | Status |
|--------|--------|--------|
| `auth` | register, login, logout, me | ✅ Exists |
| `donations` | list, create, claim, nearby, myDonations | ✅ Exists |
| `donations` | get(id) | ⚠️ **Add** |
| `claims` | list, markPickedUp, markDelivered, cancel | ✅ Exists |
| `profile` | update | ⚠️ **Add Module** |
| `notifications` | list, markRead | ⚠️ **Add Module** |

### Key Dependencies to Install

```bash
# Core
npm install axios @tanstack/react-query zod react-hook-form @hookform/resolvers

# UI
npx shadcn@latest init
npm install framer-motion lucide-react

# Maps
npm install react-leaflet leaflet
npm install -D @types/leaflet

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test msw
```

---

**Document Status:** Ready for Implementation  
**Next Step:** Begin Stage 1 - Project Foundation & Authentication