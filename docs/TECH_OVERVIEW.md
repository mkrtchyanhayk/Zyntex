# Zyntex – Technical Overview

Comprehensive reference for the current full-stack build. Use this to onboard collaborators, refresh yourself on the moving pieces, or plan the next wave of features.

---

## 1. High-Level Architecture

| Layer        | Stack / Tools                                   | Responsibilities                                                                                                       |
|--------------|-------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Frontend     | React 18, React Router 6, Axios, Tailwind CSS   | Auth flows, feed, posting, profiles, DMs, groups, mailbox, password reset, UI theming, animations, optimistic updates. |
| Backend      | Node.js 18+, Express 4, MongoDB via Mongoose 7  | Auth, JWT issuance, media upload (Multer), post & comment APIs, reactions, messaging, invitations, notifications.      |
| Infrastructure | Docker Compose, MongoDB 7, Node-based images | Local orchestration, environment isolation, volume-backed Mongo data, hot-reload volumes for server/client containers. |

Services communicate over REST (`/api/*`). Authentication uses stateless JWT bearer tokens stored client-side (typically in localStorage).

---

## 2. Repository Layout

```
├── client/                # React app (CRA + Tailwind)
│   ├── src/
│   │   ├── components/    # UI primitives (Alert, Modal, FabButton, PasswordStrength, etc.)
│   │   ├── pages/         # Route-level views (Feed, Profile, Messages, Groups, Mailbox, Search, Register, ForgotPassword)
│   │   ├── hooks/         # `useMe`, auth helpers
│   │   ├── utils/         # `api` Axios client, `imageUrl` helper
│   │   └── index.css      # Global aurora theme, motion, utility classes
├── server/
│   ├── controllers/       # Business logic per domain (auth, posts, users, DMs, groups, invites, notifications)
│   ├── middleware/        # JWT guard, error helpers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers per module
│   ├── uploads/           # Multer target (mounted via volume)
│   └── server.js, app.js  # Bootstrap & app wiring
├── docker-compose.yml     # Orchestrates mongo/server/client services
└── docs/                  # Project documentation (this file)
```

---

## 3. Backend Stack Details

### Core Libraries

| Library       | Purpose                                                                                          |
|---------------|--------------------------------------------------------------------------------------------------|
| `express`     | HTTP server / routing                                                                            |
| `mongoose`    | ODM for MongoDB, schema definitions, validation                                                  |
| `jsonwebtoken`| JWT minting & verification                                                                       |
| `bcryptjs`    | Password hashing and verification                                                                |
| `multer`      | Multipart parsing for avatar/post image uploads                                                  |
| `cors`        | Origin/credentials policy (locked to `http://localhost:3000` in dev)                             |
| `dotenv`      | Environment variable loading                                                                     |
| `morgan`      | HTTP request logging                                                                             |
| `zxcvbn`      | Password strength estimation (mirrors client-side feedback)                                      |

### Notable Middleware / Config

- `authJwt` middleware validates `Authorization: Bearer <token>` and injects `req.userId`.
- Multer writes files to `server/uploads` (surfaced via `/uploads` static route).
- CORS configured for credentialed requests from the React origin.

### Data Models (Mongoose)

| Model          | Key Fields (non-exhaustive)                                                                                              | Notes |
|----------------|-------------------------------------------------------------------------------------------------------------------------|-------|
| `User`         | `username`, `email?`, `passwordHash`, `displayName`, `bio`, `avatarUrl`, `lastUsernameChangeAt`, `previousUsernames[]`, `resetCode`, `resetCodeExpires` | Tracks optional email, username history (14-day rollback rule), reset tokens. |
| `Post`         | `imageUrl`, `textContent`, `caption`, `author`, `likes[]`, `reactions: Map<emoji, userIds>`, `hideLikeCount`            | Map supports multi-emoji reactions; `hideLikeCount` hides totals from others. |
| `Comment`      | `post`, `author`, `text`                                                                                                | Linked to posts for inline threads. |
| `Conversation` | `members[]`, `isGroup`, `group`                                                                                         | DM or group conversation metadata. |
| `Message`      | `conversation`, `sender`, `text`, `attachments`, `reactions Map`, `group`                                               | Supports per-message reactions similar to posts. |
| `Group`        | `name`, `avatar`, `members`, `admins`, `inviteOnly`                                                                     | Group chats plus invite workflow. |
| `Invitation`   | `recipient`, `sender`, `type ('dm'|'group')`, `status`, `group`, `conversation`                                         | Drives mailbox approvals and badge counts. |
| `Notification` | `user`, `type`, `message`, `payload`, `read`                                                                            | Used for welcome/profile reminders, etc. |

### Major Controller Responsibilities

- **`auth.controller`** – registration (optional email, username regex, password strength), login via email or username, password reset (6-digit code), welcome email stub & mailbox reminder.
- **`user.controller`** – `me` retrieval, profile update (avatar upload), search, username changes with cooldown enforcement.
- **`post.controller`** – Create posts (image +/or text), toggle likes, multi-emoji reactions, hide/show counts, comment CRUD, reaction viewer.
- **`dm.controller` & `group.controller`** – Conversation listing, creation, message sending, reaction toggles, conversation linking for groups.
- **`invite.controller`** – Send invites (prevent duplicates), respond (approve/decline) and auto-create/resolve conversations, counts endpoint for header badges.
- **`notification.controller`** – List, mark read; integrated with mailbox UI.

---

## 4. Frontend Stack Details

### Core Libraries

| Library           | Purpose                                                                                           |
|-------------------|---------------------------------------------------------------------------------------------------|
| `react` / `react-dom` | SPA rendering, hooks-based state                                                               |
| `react-router-dom`| Routing between Feed, Search, Groups, DMs, Mailbox, Profile, Register, Forgot Password             |
| `axios`           | HTTP client with centralized defaults / interceptors (`client/src/api.js`)                         |
| `tailwindcss` + PostCSS | Utility-first styling; global aurora aesthetic, animations defined in `index.css`           |
| `zxcvbn`          | Client-side password-strength meter (Register + Forgot Password flows)                            |

### Application Structure

- `App.js` controls layout, route definitions, and header badges (invites + reminders).
- Pages:
  - **Feed** – creating posts (modal with image/text inputs, hide-like toggle), viewing posts, reactions (hover picker, viewer modal), comments.
  - **Profile** – profile editing, avatar upload (FormData), username change with cooldown indicator.
  - **Messages / Groups** – DM creation via invites, group management, conversation panes with message reactions.
  - **Search** – user discovery.
  - **Mailbox** – invitations + notification reminders (approve/decline, mark read).
  - **Register / ForgotPassword** – combined auth form with login toggle, optional email, strength meter, identifier-based reset.
- Shared Components:
  - `Modal`, `Alert`, `FabButton`, `PasswordStrength`, reaction picker widgets inside Feed/Messages.
- Styling:
  - `index.css` hosts custom classes (`gradient-border`, `reaction-popover`, `neon-btn`, animations like `reactionPop`, `aurora-pan`).
  - Dark aurora palette, glassmorphism, floating orb backgrounds to satisfy “unique / pleasing UI” request.

### State & Data Flow

- Minimal global state; pages fetch via `api` helper. `useMe` hook caches user profile after login.
- Reaction + comment interactions optimistically merge server payloads into local `posts` array.
- Mailbox uses aggregated data from `/api/invitations` & `/api/notifications` for red-dot counts.

---

## 5. Feature Workflows

### Authentication & Onboarding
1. **Register** – username + password required, email optional. Server enforces regex (`^[a-z0-9_]{3,20}$`) & strength via zxcvbn. Successful signup:
   - JWT returned to client.
   - Welcome email stub logged (ready for SMTP integration).
   - Notification inserted prompting profile completion (shows in mailbox + header badge).
2. **Login** – accepts `identifier` (username or email) + password.
3. **Password Reset** – request via identifier, server stores 6-digit code + expiry, logs code in dev. Reset step verifies code and strength before setting new password.

### Posts, Reactions, Comments
1. **Create Post** – user chooses upload (Multer) or external URL, optional text & caption, toggle to hide reaction counts before publish.
2. **React** – hover near like button to display picker. Backend enforces “one emoji per user per post”; switching emojis replaces the previous one.
3. **Hide Counts** – author can toggle after publishing via `/api/posts/:id/visibility`. When enabled, others see `—` and a “hidden by author” message; author still sees totals.
4. **Comments** – lazy-loaded per post, inline creation/deletion for author.

### Messaging & Groups
- DM creation sends invitation instead of auto-joining; recipients approve via Mailbox.
- Groups include name/avatar editing, optional limits, and share the same conversation infrastructure.
- Reactions on messages mirror post reaction logic (Map per emoji, viewer modal).

### Mailbox & Notifications
- Aggregates invitations (`pending` status) and unread notifications.
- Accepting DM/group invites automatically creates/links the conversation and navigates the user there.
- Notifications currently cover welcome/profile reminders but infrastructure supports more types (JSON payload stored).

### Username Change Cooldown
- `user.controller.changeUsername` logs previous username with timestamp; locks change for 14 days. During cooldown, UI shows remaining days; revert-to-previous allowed while window is active.

---

## 6. Infrastructure & Environment

- **Docker Compose** orchestrates three services:
  - `mongo` (`mongo:7`) with named volume `mongo_data`.
  - `server` (Express) – mounts source folder for hot reload, exposes `5000`.
  - `client` (React) – mounts source, exposes `3000`, configured with `REACT_APP_API_URL`.
- **Environment Variables** (per `docker-compose.yml`):
  - `PORT`, `NODE_ENV`, `JWT_SECRET`, `MONGO_URI`, `CLIENT_URL` for server.
  - `REACT_APP_API_URL` for client API base.
- **Uploads** – ensure `server/uploads` exists; when using Docker, bind mount keeps images accessible under `http://localhost:5000/uploads/<file>`.

---

## 7. Development Workflow

1. `docker compose up --build` – recommended start (builds all services, attaches logs).
2. Or run manually:
   - `cd server && npm install && npm run dev`
   - `cd client && npm install && npm start`
3. **Testing** – manual/regression via browser; no automated test suite yet.
4. **Linting** – Tailwind + CRA built-in. Run `npm run lint` equivalents if added; for now rely on editor ESLint/TSC warnings.
5. **Data Inspection** – use MongoDB Compass connected to `mongodb://localhost:27017/zyntex`.

---

## 8. Extensibility Notes

- **Email Delivery** – `auth.controller` currently logs emails; plug in Nodemailer, SendGrid, etc., using environment variables (SMTP creds) and update `sendWelcomeEmail`.
- **Realtime** – current messaging is polling-based. Introduce Socket.IO or WebSockets via a separate service/server if realtime typing receipts are needed.
- **File Storage** – images stored on disk; migrating to S3/GCS would require swapping Multer’s storage engine and updating `getImageUrl`.
- **Testing** – add integration tests (Jest + supertest) for controllers and React Testing Library for complex components.
- **Access Control** – consider role-based fields on `User` for moderation, rate limiting, etc.

---

## 9. Quick Reference Tables

### REST Endpoints (selected)

| Method | Path                                      | Description                                   |
|--------|-------------------------------------------|-----------------------------------------------|
| POST   | `/api/auth/register`                      | Sign up (optional email)                      |
| POST   | `/api/auth/login`                         | Login with username or email                  |
| POST   | `/api/auth/forgot` / `/api/auth/reset`    | Password reset flow                           |
| GET    | `/api/posts/feed`                         | Paginated feed (currently all posts)          |
| POST   | `/api/posts`                              | Create post (multipart/text)                  |
| POST   | `/api/posts/:id/react/:emoji`             | Toggle single reaction                        |
| PATCH  | `/api/posts/:id/visibility`               | Hide/show reaction counts                     |
| GET    | `/api/posts/:id/comments`                 | List comments                                 |
| POST   | `/api/posts/:id/comments`                 | Add comment                                   |
| GET    | `/api/posts/:id/reactions`                | Reaction viewer data                          |
| GET    | `/api/invitations/counts`                 | Header badge counts (invites + notifications) |
| POST   | `/api/invitations`                        | Send invite                                   |
| POST   | `/api/invitations/:id/respond`            | Accept / decline                              |
| GET    | `/api/notifications`                      | Notification inbox                            |

*(See `server/routes/*.js` for the full list.)*

---

### Frontend Commands

| Command                 | Description                                     |
|-------------------------|-------------------------------------------------|
| `npm start` (client)    | CRA dev server with hot reload                  |
| `npm run build`         | Production build (outputs to `client/build/`)   |
| `npm run dev` (server)  | Nodemon auto-restart server                     |
| `docker compose up`     | Run full stack (Mongo + API + SPA)              |

---

## 10. FAQ

**Q: Where are images stored?**  
A: Locally in `server/uploads`. Served statically at `/uploads/<filename>`; the client uses `getImageUrl` to convert relative paths to full URLs.

**Q: How are invites counted for header badges?**  
A: `/api/invitations/counts` returns `{ mailbox: pendingInvites, dms: pendingDmInvites, groups: pendingGroupInvites, notifications: unreadNotifications }`. `App.js` sums them for pill indicators.

**Q: How is the 14-day username cooldown enforced?**  
A: Backend logs `lastUsernameChangeAt` plus `previousUsernames[]`. Endpoint rejects changes if `Date.now() - lastChange < 14 days`. UI surfaces countdown via `Profile.js`.

**Q: Can users hide reactions after publishing?**  
A: Yes. Authors toggle via button on their post; backend `PATCH /api/posts/:id/visibility` updates `hideLikeCount`.

---

_Last updated: 2025-11-20_

