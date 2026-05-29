# DirectRide Frontend

A modern ride-booking web application built with React and TypeScript.
DirectRide provides separate experiences for riders, drivers, and admins, with role-based routing and protected app modules.

---

## Tech Stack

- React
- TypeScript
- React Router
- Vite
- CSS modules by feature/page
- LocalStorage for JWT handling

---

## Features

### Authentication
- JWT-based login
- Role-based redirects for Rider, Driver, and Admin users
- Protected routes with automatic redirects
- Shared token parsing for string and numeric role values

### Admin Module
Designed for administrators to monitor and manage the DirectRide platform.

Screens:
- Dashboard
  - Admin landing page for future platform metrics
- Users
  - Backend-driven paginated users table
  - Backend-driven search and role/status filters
  - View button for user details
  - Add User flow for Rider, Driver, and Admin accounts
- User Details
  - View user profile information
  - Edit user info through the Users service
  - Deactivate action UI
  - Driver-only availability management
  - Admin date picker can view and adjust availability for any date, including past dates
- Rides
  - Placeholder screen for future ride oversight
- Profile
  - Admin account info
  - Logout

### Driver Module
Designed for drivers to manage rides, availability, and earnings.

Screens:
- Dashboard
  - Today’s rides
  - Earnings summary
  - Pending requests
  - Availability preview
- Requests
  - Tabs for Pending, Accepted, Denied, and Completed requests
  - Accept, deny, cancel, and complete request workflows
- Schedule
  - Set availability by date
  - Add and manage time slots
  - Future-only scheduling for drivers
- Earnings
  - Weekly earnings overview
  - Ride count
  - Daily breakdown
- Profile
  - User info
  - Base fare setting
  - Logout

### Rider Module
Designed for riders to book and manage trips.

Screens:
- Dashboard
  - Book a ride call to action
  - Active/upcoming ride
  - Recent trips
- Book a Ride
  - Future-only date selection
  - Pickup and dropoff inputs
  - Driver search and selection
  - Request summary and confirmation
- Trips
  - Tabs for Confirmed, Pending, and Completed trips
  - Sorted ride history
  - Status tracking
- Profile
  - User info
  - Logout

---

## Project Structure

```text
src/
├── assets/               # Static files like images, icons, and branding assets
├── components/           # Shared reusable UI components
│   └── navigation/       # App navigation and mobile menu components
├── data/                 # Mock/static data used during development
├── layouts/              # Role-specific layouts
│   ├── AdminLayout.tsx
│   ├── DriverLayout.tsx
│   └── RiderLayout.tsx
├── modules/              # Feature modules by app domain
│   ├── admin/
│   │   └── pages/        # Admin dashboard, users, user details, add user, rides, profile
│   ├── auth/
│   │   └── pages/        # Login and register screens
│   ├── driver/
│   │   ├── components/   # Driver-specific components
│   │   ├── config/       # Driver navigation/config
│   │   └── pages/        # Driver dashboard, schedule, requests, earnings, profile
│   └── rider/
│       ├── components/   # Rider-specific components
│       ├── config/       # Rider navigation/config
│       └── pages/        # Rider dashboard, book ride, trips, profile
├── routes/               # App routing, protected routes, and role gates
├── services/             # API services for auth, users, rides, availability, earnings
├── styles/               # Global styles and shared variables
└── types/                # Shared TypeScript types
```
