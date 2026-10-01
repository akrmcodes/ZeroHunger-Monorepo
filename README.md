# ZeroHunger Monorepo

> A production-minded full-stack platform that helps communities rescue surplus food and route it to people who need it.

[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-black?style=flat-square&logo=next.js)](./front-end)
[![Backend](https://img.shields.io/badge/backend-Laravel%2012-FF2D20?style=flat-square&logo=laravel&logoColor=white)](./zerohunger-api)
[![Language](https://img.shields.io/badge/language-TypeScript%20%7C%20PHP-blue?style=flat-square)](#technology-stack)
[![Status](https://img.shields.io/badge/status-active%20development-success?style=flat-square)](#roadmap)

## Table of Contents

- [Why ZeroHunger](#why-zerohunger)
- [Core Capabilities](#core-capabilities)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Local Development](#local-development)
- [API Surface](#api-surface)
- [Quality & Validation](#quality--validation)
- [Roadmap](#roadmap)
- [Team](#team)

## Why ZeroHunger

Food waste and food insecurity exist side by side. ZeroHunger addresses that gap with a role-based workflow:

- **Donors** publish surplus food
- **Volunteers** claim, pick up, and deliver donations
- **Recipients** receive food with transparent status tracking

The goal is practical: reduce waste, shorten the donation-to-delivery cycle, and provide measurable community impact.

## Core Capabilities

- **Secure authentication** with Laravel Sanctum and role-based access control
- **Donation lifecycle orchestration** from creation to successful delivery
- **Geospatial discovery** via nearby donation search and map-based UX
- **Claim integrity protections** to prevent duplicate volunteer claims
- **Notification flows** for key donation and claim events
- **Impact scoring** to encourage sustained participation

## Architecture at a Glance

ZeroHunger is organized as a monorepo with two primary applications:

1. **`front-end/`** — Next.js 16 + React 19 client application
2. **`zerohunger-api/`** — Laravel 12 REST API with MySQL persistence

The frontend consumes versioned backend endpoints (`/api/v1/...`) and manages server state through TanStack Query.

## Technology Stack

### Frontend

- Next.js 16 (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4
- TanStack Query 5
- React Hook Form + Zod
- Framer Motion
- Leaflet / React-Leaflet

### Backend

- Laravel 12 (PHP 8.2)
- Laravel Sanctum
- Spatie Laravel Permission
- MySQL 8+
- PHPUnit 11

## Repository Layout

```text
ZeroHunger-Monorepo/
├── front-end/          # Next.js frontend
│   ├── docs/           # Frontend project docs and API contract
│   └── src/            # Application source code
├── zerohunger-api/     # Laravel backend API
│   ├── app/            # Controllers, services, models
│   ├── database/       # Migrations, seeders, factories
│   ├── routes/         # API route definitions
│   └── tests/          # Feature and unit tests
├── Diagrams/           # Project diagrams
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- PHP 8.2+
- Composer 2+
- MySQL 8+

### 1) Backend setup (`zerohunger-api`)

```bash
cd zerohunger-api
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env` with your MySQL credentials, then run:

```bash
php artisan migrate --seed
php artisan serve
```

Optional queue worker:

```bash
php artisan queue:work
```

Backend default URL: `http://localhost:8000`

### 2) Frontend setup (`front-end`)

```bash
cd front-end
pnpm install
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Run the frontend:

```bash
pnpm dev
```

Frontend default URL: `http://localhost:3000`

### Seeded test accounts

After `php artisan migrate --seed`:

| Role      | Email                | Password   |
|-----------|----------------------|------------|
| Admin     | `admin@test.com`     | `password` |
| Donor     | `donor@test.com`     | `password` |
| Volunteer | `volunteer@test.com` | `password` |
| Recipient | `recipient@test.com` | `password` |

## API Surface

Base URL: `http://localhost:8000/api/v1`

Key endpoint groups:

- `POST /register`, `POST /login`, `POST /logout`, `GET /me`
- `GET/POST/PUT/DELETE /donations...`
- `POST /donations/{id}/claim`
- `GET /claims`, `POST /claims/{id}/pickup`, `POST /claims/{id}/deliver`, `DELETE /claims/{id}`
- `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all`

Additional API details:

- [`zerohunger-api/README-API.md`](./zerohunger-api/README-API.md)
- [`front-end/docs/API-CONTRACT.md`](./front-end/docs/API-CONTRACT.md)

## Quality & Validation

### Frontend

```bash
cd front-end
pnpm lint
pnpm build
```

### Backend

```bash
cd zerohunger-api
composer test
```

## Roadmap

Current focus areas:

- Expand automated test coverage (frontend and API)
- Harden CI/CD and deployment workflows
- Improve impact analytics and reporting
- Extend volunteer/recipient operational tooling

## Team

Built by **Code Mavericks**:

- AKRM ABDULJALIL MOHAMMED AHMED AL-QUBATI
- NAJM ALDEEN MOHAMMED SALEH HAMOD AL-ZORQAH
- MOHAMMED ABDULWADOD SHARAF AL-ZUBAIRI
- ABDULMALEK AHMED MOHAMMED AL-ANSI
- ABDULMALEK HESHAM QAID QAHTAN

---

If this project aligns with your mission, consider starring the repository and contributing improvements.
