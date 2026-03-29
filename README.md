# DirectRide Frontend

A modern ride-booking web application built with **React**.  
DirectRide provides separate experiences for **Drivers** and **Riders**, each with their own dashboards, workflows, and features.

---

## Features

### Authentication
- JWT-based login
- Role-based routing (Driver vs Rider)
- Protected routes with automatic redirects

---

## Driver Module

Designed for drivers to manage their rides, availability, and earnings.

### Screens
- **Dashboard**
  - Today’s rides
  - Earnings summary
  - Pending requests
  - Availability preview

- **Requests**
  - Tabs: Pending, Accepted, Denied, Completed
  - Accept / Deny / Cancel actions
  - Sorting + filtering

- **Schedule**
  - Set availability by date
  - Add and manage time slots
  - Future-only scheduling

- **Earnings**
  - Weekly earnings overview
  - Ride count
  - Daily breakdown

- **Profile**
  - User info
  - Base fare setting
  - Logout / Deactivate account

---

## Rider Module

Designed for riders to easily book and manage trips.

### Screens
- **Dashboard**
  - Book a ride (primary CTA)
  - Active/upcoming ride
  - Recent trips

- **Book a Ride**
  - Future-only date selection
  - Pickup & dropoff inputs
  - Driver search
  - Driver selection
  - Request summary & confirmation

- **Trips**
  - Tabs: Confirmed, Pending, Completed
  - Sorted ride history
  - Status tracking

- **Profile**
  - User info
  - Logout / Deactivate account

---

## Tech Stack

- React (TypeScript)
- React Router
- CSS (component-based styling)
- LocalStorage (JWT handling - mock)

---

## 🗂️ Project Structure

```text

src/
├── assets/               # Static files like images, icons, and branding assets
├── components/           # Shared, reusable UI components used across the app
│   ├── navigation/       # Navigation components (sidebar, menus, app navigation)
├── data/                 # Mock data and static datasets for development/testing
├── layouts/              # Layout wrappers that structure pages (e.g., DriverLayout, RiderLayout)
├── modules/              # Feature-based modules separating app domains by role or function
│   ├── auth/
│   |   ├── pages/        # Authentication-related screens (login, etc.)
│   ├── driver/
│   |   ├── components/   # Driver-specific reusable components
│   |   ├── config/       # Driver-specific configs, constants, or helpers
│   |   ├── pages/        # Driver-facing screens (dashboard, requests, etc.)
│   ├── rider/
│   |   ├── components/   # Rider-specific reusable components
│   |   ├── config/       # Rider-facing screens (dashboard, trips, etc.)
│   |   ├── pages/        # Application routing configuration and protected route logic
├── routes/               # Application routing configuration and protected route logic
├── services/             # API calls, business logic, and external integrations
├── styles/               # Global styles, themes, and shared CSS utilities
├── types/                # TypeScript types, interfaces, and shared type definitions

```
