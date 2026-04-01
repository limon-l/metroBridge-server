# MetroBridge Server

Production-style backend API for MetroBridge using Node.js, Express, MongoDB, and JWT authentication.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth + role-based access middleware
- Request validation with `express-validator`
- Rate limiting, Helmet, CORS, compression, and logging

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install packages:

```bash
npm install
```

3. Update `.env` values:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`

4. Run development server:

```bash
npm run dev
```

Server base URL: `http://localhost:5000`

## API Overview

- `GET /health` - Health status
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/mentors` - Mentors list (supports filtering)
- `GET /api/posts` - Community posts
- `POST /api/posts` - Create post
- `POST /api/posts/:postId/comments` - Add comment
- `GET /api/conversations` - User conversations
- `POST /api/conversations` - Start conversation
- `POST /api/conversations/:id/messages` - Send message
- `GET /api/appointments` - Appointments list
- `POST /api/appointments` - Book appointment
- `GET /api/documents` - Documents list
- `POST /api/documents` - Upload metadata

## Frontend Integration

In the client app `.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

This backend is ready for Firebase migration paths too; if you want, we can add Firebase ID token verification in one middleware so your existing auth flow can be kept while transitioning.
"# metroBridge-server" 
