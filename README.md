# LawHelpZone — Frontend

<div align="center">

![LawHelpZone](https://img.shields.io/badge/LawHelpZone-Legal%20Services%20Platform-0A1A3F?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC?style=for-the-badge&logo=redux)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

**A full-featured legal marketplace connecting clients with lawyers.**  
Built with Next.js 16, Redux Toolkit, Socket.io, and Stripe.

🌐 **Live:**   https://lawhelpzone-frontend-4fq6.vercel.app

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Payment System](#payment-system)
- [Role-Based Dashboards](#role-based-dashboards)
- [Redux Store](#redux-store)
- [Socket.io Integration](#socketio-integration)
- [Deployment](#deployment)

---

## Overview

LawHelpZone is a legal services marketplace where:

- **Clients** post legal cases, browse lawyers, and pay for consultations
- **Lawyers** apply to cases, receive payments via Stripe Connect, and manage clients
- **Admins** oversee the entire platform, manage users, and view revenue analytics

The platform features real-time messaging, video calls, notifications, and a complete Stripe payment system with automatic 80/20 fee splitting.

---

## Features

### Client
- ✅ Post legal cases with category, budget, urgency
- ✅ Browse and search all registered lawyers
- ✅ View and accept lawyer proposals
- ✅ **Pay lawyers securely via Stripe** (80% to lawyer, 20% platform fee)
- ✅ Real-time messaging with assigned lawyers
- ✅ Video call integration
- ✅ Payment history dashboard

### Lawyer
- ✅ Browse and apply to open cases with proposals
- ✅ **Stripe Connect onboarding** to receive payments
- ✅ View earnings and payout history
- ✅ Real-time messaging with clients
- ✅ Availability toggle and profile management

### Admin
- ✅ Full user management (create, edit, suspend, delete)
- ✅ Assign lawyers to cases
- ✅ **Revenue dashboard** with platform fee analytics
- ✅ **Refund payments**
- ✅ Broadcast notifications to all users
- ✅ System settings and health monitoring

### Platform
- ✅ Real-time messaging via Socket.io
- ✅ Live notification badges
- ✅ Dark mode support
- ✅ Responsive design (mobile + desktop)
- ✅ JWT authentication with auto-refresh
- ✅ Role-based access control (client / lawyer / admin)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 (App Router) | Frontend framework |
| **Redux Toolkit** | Latest | Global state management |
| **TailwindCSS** | Latest | Styling |
| **Socket.io Client** | Latest | Real-time messaging |
| **Stripe.js** | Latest | Payment processing |
| **@stripe/react-stripe-js** | Latest | Stripe React components |
| **Lucide React** | Latest | Icons |
| **Framer Motion** | Latest | Animations (auth pages) |

---

## Project Structure

```
lawhelpzone-frontend/
├── app/
│   ├── auth/
│   │   ├── login/page.jsx
│   │   └── signup/page.jsx
│   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── page.jsx                  # Admin dashboard
│   │   │   ├── payments/page.jsx         # Revenue & refunds
│   │   │   ├── user-management/page.jsx
│   │   │   └── system-settings/page.jsx
│   │   ├── client/
│   │   │   ├── page.jsx                  # Client dashboard
│   │   │   ├── payments/page.jsx         # Payment history
│   │   │   ├── cases/page.jsx
│   │   │   └── messages/page.jsx
│   │   └── lawyer/
│   │       ├── page.jsx                  # Lawyer dashboard
│   │       ├── earnings/page.jsx         # Earnings & Stripe dashboard
│   │       └── stripe-setup/page.jsx     # Stripe Connect onboarding
│   ├── payment-success/page.jsx          # Stripe redirect landing
│   └── layout.jsx
│
├── components/
│   ├── payment/
│   │   ├── CheckoutModal.jsx             # Stripe payment form
│   │   ├── PaymentHistory.jsx            # Reusable payment table
│   │   ├── PayButton.jsx                 # Drop-in pay button
│   │   └── StripeSetupBanner.jsx         # Lawyer onboarding prompt
│   ├── DashboardLayout.jsx               # Navy sidebar layout
│   └── DashboardShell.jsx                # White sidebar layout
│
├── store/
│   ├── index.js                          # Redux store configuration
│   └── slices/
│       ├── authSlice.js                  # Authentication state
│       ├── paymentSlice.js               # Payment state ← NEW
│       ├── casesSlice.js                 # Cases state
│       ├── chatSlice.js                  # Messaging state
│       ├── notificationSlice.js          # Notifications state
│       ├── lawyersSlice.js               # Lawyers state
│       ├── meetingsSlice.js              # Meetings state
│       └── dashboardSlice.js             # Dashboard state
│
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useProtectedAction.js
│   └── useUnreadCounts.js
│
└── .env.local
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lawhelpzone-frontend.git
cd lawhelpzone-frontend

# Install dependencies
npm install

# Install Stripe packages
npm install @stripe/stripe-js @stripe/react-stripe-js

# Copy environment variables
cp .env.example .env.local
# Then fill in your values (see Environment Variables section)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Stripe Publishable Key (get from dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

### For Vercel Deployment

Add these in **Vercel → Project → Settings → Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://lawhelpzone-backend-production.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Payment System

LawHelpZone uses **Stripe Connect** for marketplace payments.

### How It Works

```
Client pays $100
    ↓
Stripe processes payment
    ↓
Platform fee (20%) = $20  →  LawHelpZone account
Lawyer receives (80%) = $80  →  Lawyer's Stripe account
```

### Payment Flow

1. **Lawyer onboarding** — Lawyer visits `/dashboard/lawyer/stripe-setup` and completes Stripe Connect onboarding
2. **Client pays** — Client clicks 💳 Pay on any lawyer card or case → `CheckoutModal` opens
3. **Intent created** — Backend creates a `PaymentIntent` with `transfer_data` and `application_fee_amount`
4. **Stripe confirms** — Client enters card details; Stripe processes the payment
5. **Webhook fires** — Backend receives `payment_intent.succeeded` and updates database
6. **Lawyer paid** — 80% automatically transferred to lawyer's Stripe account

### Components

| Component | Location | Purpose |
|---|---|---|
| `CheckoutModal` | `components/payment/` | Full Stripe checkout form in a modal |
| `PayButton` | `components/payment/` | Drop-in button for any page |
| `PayButtonInline` | Defined in `client/page.jsx` | Compact button for card layouts |
| `PaymentHistory` | `components/payment/` | Payment table (works for all 3 roles) |
| `StripeSetupBanner` | `components/payment/` | Onboarding prompt for lawyers |

### Adding a Pay Button to Any Page

```jsx
import PayButton from "@/components/payment/PayButton";

<PayButton
  lawyerId={lawyer._id}
  lawyerName={lawyer.name}
  amount={lawyer.lawyerProfile.consultationFee}  // in dollars
  caseId={caseId}        // optional
  onSuccess={() => console.log("Payment successful!")}
/>
```

---

## Role-Based Dashboards

### Client Dashboard (`/dashboard/client`)
- Case management with proposal tracking
- Browse all registered lawyers with pay buttons
- Payment history at `/dashboard/client/payments`

### Lawyer Dashboard (`/dashboard/lawyer`)
- Case tabs: My Cases / Available / Clients
- Stripe setup banner (shows when Stripe not connected)
- Earnings page at `/dashboard/lawyer/earnings`
- Stripe Express dashboard link

### Admin Dashboard (`/dashboard/admin`)
- Platform overview with 6 stat cards
- User management with edit/delete/suspend
- Revenue analytics at `/dashboard/admin/payments`
- Case assignment to lawyers
- Broadcast notifications to all users

---

## Redux Store

```js
store = {
  auth:          { user, profile, loading, error, initialized },
  payment:       { clientSecret, payments, earnings, revenue, stripeStatus },
  cases:         { cases, selectedCase, stats, pagination },
  chat:          { contacts, messages, activeContactId, onlineUsers },
  notifications: { notifications, unreadCount, pagination },
  lawyers:       { lawyers, selectedLawyer, pagination },
  meetings:      { meetings, activeMeeting },
  dashboard:     { stats, recentCases, myClients, allUsers },
}
```

### Key Payment Actions

```js
import {
  createPaymentIntent,    // POST /api/payments/create-payment-intent
  fetchPaymentHistory,    // GET  /api/payments/history
  fetchLawyerEarnings,    // GET  /api/payments/lawyer/earnings
  fetchAdminRevenue,      // GET  /api/payments/admin/revenue
  refundPayment,          // POST /api/payments/:id/refund
  fetchStripeStatus,      // GET  /api/stripe/account-status
  connectStripeAccount,   // POST /api/stripe/connect-account
} from "@/store/slices/paymentSlice";
```

---

## Socket.io Integration

Real-time features are handled via `useSocket` hook which connects on login and disconnects on logout.

### Events Handled

| Event | Action |
|---|---|
| `newMessage` | Dispatches `receiveMessage` to Redux |
| `notification` | Dispatches `receiveNotification` + browser notification |
| `onlineUsers` | Updates online status on contacts |
| `userTyping` | Shows typing indicator |
| `caseUpdated` | Shows in-app notification |

---

## Deployment

The frontend is deployed on **Vercel** with automatic deployments on every push to `main`.

```bash
# Push to deploy
git add .
git commit -m "your message"
git push origin main
```

Vercel will automatically build and deploy. Build time is ~35 seconds.

### Build Output

All 48 routes are statically generated at build time:
- `/dashboard/client/payments` ✓
- `/dashboard/lawyer/earnings` ✓
- `/dashboard/lawyer/stripe-setup` ✓
- `/dashboard/admin/payments` ✓
- `/payment-success` ✓

---

## API Endpoints Used

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| `POST` | `/api/payments/create-payment-intent` | Client | Start Stripe checkout |
| `GET` | `/api/payments/history` | All | Payment history |
| `GET` | `/api/payments/lawyer/earnings` | Lawyer | Earnings summary |
| `GET` | `/api/payments/admin/revenue` | Admin | Platform revenue |
| `POST` | `/api/payments/:id/refund` | Admin | Refund a payment |
| `POST` | `/api/stripe/connect-account` | Lawyer | Start Stripe onboarding |
| `GET` | `/api/stripe/account-status` | Lawyer | Check Stripe status |
| `GET` | `/api/stripe/dashboard-link` | Lawyer | Stripe Express dashboard |
| `POST` | `/api/payments/webhook` | Internal | Stripe webhook handler |

---

<div align="center">

Made with ❤️ by the Razia

</div>
