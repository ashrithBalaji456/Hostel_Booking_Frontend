# Spatial Stay — Frontend

React + TypeScript + Vite + Tailwind CSS frontend for the **Spatial Stay** Hostel & PG Booking Platform.

## Stack
- React 18, TypeScript, Vite
- Tailwind CSS v4 (liquid-glass & bento UI)
- React Router v7 (role-aware routes: Public, `CUSTOMER`, `PROPERTY_OWNER`, `ADMIN`)
- TanStack Query v5
- React Hook Form + Zod
- React Three Fiber / Drei (lazy-loaded hero spatial accent with `prefers-reduced-motion` static fallback)
- Vitest + React Testing Library

## Setup & Run
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
The dev server runs at `http://localhost:5173` and proxies `/api` to `http://localhost:8080`.

## Build & Test
```bash
cd frontend
npm test
npm run build
```

## Documentation
- See [API_COVERAGE_MATRIX.md](./API_COVERAGE_MATRIX.md) for the complete endpoint-to-UI mapping, role matrix, and documented backend gaps.
