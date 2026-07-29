# Frontend (React + Vite + Tailwind + Redux Toolkit + React Router)

ChatGPT-inspired frontend for the MERN boilerplate.

## Tech

- React 19
- Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- React Router (data router: `createBrowserRouter` + `RouterProvider`)
- Redux Toolkit + React Redux

## Folder Architecture (Auth Feature)

The auth module follows a 4-layer structure:

- `state`: Redux slice and async thunks
- `api`: API request functions
- `ui`: pages/components
- `hooks`: feature-specific hooks used by UI

```text
src/
	app/
		router.jsx
		store.js
	features/
		auth/
			api/
				authApi.js
			hooks/
				useAuth.js
			state/
				authSlice.js
			ui/
				components/
					ProtectedRoute.jsx
				pages/
					Login.jsx
					Register.jsx
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Backend Proxy

`vite.config.js` proxies `/api/*` to `http://localhost:3000`, so auth requests from frontend use:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint
