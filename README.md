# Clearpath — Loan & EMI Calculator

A React loan planner with home and personal loan modes, EMI and interest estimates, a payment breakdown chart, an amortization schedule, and CSV export. Accounts use password hashing, JWT sessions in secure HttpOnly cookies, user-scoped saved calculations, and temporary account lockout after three consecutive failed logins.

## Stack

- React and Vite (JavaScript)
- Node.js and Express API
- MongoDB with Mongoose
- bcryptjs password hashing and JWT authentication
- Helmet security headers and express-rate-limit

## Run locally

1. Install Node.js and MongoDB and start MongoDB.
2. Install packages with `npm install`.
3. Copy `.env.example` to `.env`. Generate a private JWT secret with `openssl rand -base64 48`, then set it as `JWT_SECRET` in `.env`. Keep `.env` private and out of version control.
4. Start the app using `npm run dev`.
5. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

The development frontend uses the Vite `/api` proxy. Secure cookies are enabled; browsers treat `localhost` as a secure context for local development. For production, serve the app through HTTPS. Set `NODE_ENV=production`; if Express is behind one trusted TLS reverse proxy, set `TRUST_PROXY=1`. The API rejects plain HTTP in production and sends HSTS on HTTPS responses. Do not expose the API directly to the internet without a TLS proxy.

## Authentication behavior

- `POST /api/auth/register` creates an account (12–72 character password) and starts a session.
- `POST /api/auth/login` starts a session. Three consecutive failed attempts lock that account for 15 minutes; a successful login resets the counter. Login and registration requests also have an IP-based request limit.
- `GET /api/auth/me` returns the current user; `POST /api/auth/logout` clears the session cookie.
- JWTs are signed with HS256, expire after eight hours, and are stored only in an HttpOnly, Secure, SameSite=Strict cookie.
- Loan calculation save/history endpoints require authentication. Saved calculations are scoped to their owner. Role authorization middleware is available for future admin-only routes.

The API runs on port 5001 by default. MongoDB uses `mongodb://127.0.0.1:27017/clearpath` in the example config.
