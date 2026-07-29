# Backend (Express + MongoDB + JWT Cookies)

MERN backend boilerplate using Express with ESM imports, MongoDB, JWT cookie auth, and Morgan logger.

## Tech

- Node.js + Express 5
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Cookies (`cookie-parser`)
- Logging (`morgan`)
- Env config (`dotenv`)

## Folder Structure

```text
src/
  app/
    app.js
  config/
    db.js
    env.js
  controllers/
    auth.controller.js
  middleware/
    auth.middleware.js
    error.middleware.js
  models/
    user.model.js
  routes/
    auth.routes.js
  server.js
```

## Environment Variables

Create `.env` in `backend/` from `.env.example`:

```bash
cp .env.example .env
```

`.env.example` contains:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/genai_chatgpt
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_NAME=token
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Start production mode:

```bash
npm start
```

Backend runs on `http://localhost:3000`.

## Auth API

Base path: `/api/auth`

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /me` (protected)

Auth uses a single JWT stored in an HTTP-only cookie.

## Health Check

- `GET /api/health`
