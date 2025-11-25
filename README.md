🚀 TinyLink – URL Shortener (Next.js + Prisma + PostgreSQL)

TinyLink is a fully functional URL shortener built using Next.js (App Router), Prisma, and PostgreSQL.
It supports creating short links, custom codes, redirect tracking, real-time stats, and an elegant responsive dashboard UI.

This project is built as a take-home assignment and fully satisfies all requirements from the assignment PDF.

✨ Features
🔗 Core Functionality

Create short links for any valid http/https URL

Optional custom short code ([A-Za-z0-9]{6,8})

Automatic random code generation (no collisions)

302 redirect endpoint at /:code

Stores clicks + last-click timestamp

View full stats at /code/:code

🗄️ Database

PostgreSQL (Neon/Railway/Vercel Postgres compatible)

Prisma ORM with atomic updates using increment

🎨 Frontend UI

Clean, modern, responsive Tailwind UI

Dashboard showing:

Total links

Total clicks

Per-link stats

Inline validation & helpful error messages

Toast notifications for actions

Optimistic updates for delete action

Search/filter links

🛠 API Endpoints
Method	Endpoint	Description
POST	/api/links	Create a short link
GET	/api/links	List all links
GET	/api/links/:code	Fetch stats of a short link
DELETE	/api/links/:code	Delete a short link
GET	/api/healthz	Health check
🔄 Redirect Route

GET /:code

Finds matching code

Increments click count atomically

Sets lastClickedAt

Redirects with 302 Found to the target URL
