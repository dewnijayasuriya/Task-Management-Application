# TaskBoard — Full-Stack Task Management Application

A Trello-like task management application with drag-and-drop status
updates, JWT authentication, and role-based access control (Normal
User / Administrator).

## Tech Stack

| Layer       | Technology                                          |
| ----------- | --------------------------------------------------- |
| Frontend    | Next.js (App Router), React, Tailwind CSS, @dnd-kit |
| Backend     | Node.js, Express.js                                 |
| Database    | MongoDB with Mongoose                               |
| Auth        | JWT, bcryptjs (password hashing)                    |
| HTTP client | Axios                                               |

The frontend and backend are two independent projects with their own
`package.json`, `.env` files, and start/build commands. Either can be
deployed separately.

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/db.js               MongoDB connection
│   │   ├── controllers/                Request handlers
│   │   ├── middleware/                 Auth, roles, validation, errors
│   │   ├── models/                     User.js, Task.js (Mongoose schemas)
│   │   ├── routes/                     authRoutes, taskRoutes, userRoutes
│   │   ├── scripts/seedAdmin.js        Admin account seed script
│   │   ├── utils/                      AppError, asyncHandler, generateToken
│   │   ├── app.js                      Express app (middleware + routes)
│   │   └── server.js                   Entry point (connects DB, starts server)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/                            Next.js App Router pages
│   │   ├── page.jsx                    Landing page
│   │   ├── login/page.jsx
│   │   ├── register/page.jsx
│   │   ├── dashboard/page.jsx          Task board (all authenticated users)
│   │   └── admin/users/page.jsx        Admin-only user management
│   ├── components/                     TaskBoard, TaskColumn, TaskCard, modals, Navbar...
│   ├── services/                       api.js (axios client), authService, taskService, userService
│   ├── context/AuthContext.jsx         Auth state (user, login, logout, register)
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either a local MongoDB instance or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/task-management
# or for local MongoDB: mongodb://localhost:27017/task-management

JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

# Used only by the seedAdmin script
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

Seed the administrator account (do this once):

```bash
npm run seed
```

This connects to MongoDB, checks whether an admin with `ADMIN_EMAIL`
already exists, hashes `ADMIN_PASSWORD` with bcrypt, creates the
account with `role: "ADMIN"` if it doesn't exist yet (or promotes an
existing matching user to ADMIN), and closes the connection. There is
no other way to create an administrator — the public registration API
always forces `role: "USER"`.

Start the backend:

```bash
npm run dev     # nodemon, auto-restarts on file changes
# or
npm start       # plain node
```

The API will be available at `http://localhost:5000/api`. Check
`GET /api/health` to confirm it's running.

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable         | Description                                             |
| ---------------- | ------------------------------------------------------- |
| `PORT`           | Port the Express server listens on                      |
| `NODE_ENV`       | `development` or `production`                           |
| `MONGODB_URI`    | MongoDB connection string                               |
| `JWT_SECRET`     | Secret used to sign JWTs — keep this private            |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d`                               |
| `FRONTEND_URL`   | Allowed CORS origin(s), comma-separated if multiple     |
| `ADMIN_NAME`     | Name used by `seedAdmin.js`                             |
| `ADMIN_EMAIL`    | Email used by `seedAdmin.js`                            |
| `ADMIN_PASSWORD` | Password used by `seedAdmin.js` (hashed before storage) |

### Frontend (`frontend/.env.local`)

| Variable              | Description                 |
| --------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

Neither `.env` file is committed to git (`.gitignore` excludes them).
Only the `.env.example` files are committed, with placeholder values.

## Data Models

### User

```js
{
  _id,
  name,
  email,       // unique, lowercase
  password,    // bcrypt hash, never returned in API responses
  role,        // "USER" | "ADMIN" — defaults to USER
  createdAt,
  updatedAt,
}
```

### Task

```js
{
  _id,
  title,
  description,
  status,        // "TODO" | "DOING" | "DONE" — defaults to TODO
  priority,      // "LOW" | "MEDIUM" | "HIGH" — defaults to MEDIUM
  creator,       // ObjectId ref -> User, required
  assignedUser,  // ObjectId ref -> User, nullable
  createdAt,
  updatedAt,
}
```

## Roles & Permissions

| Action                                                     | Normal User                             | Admin |
| ---------------------------------------------------------- | --------------------------------------- | ----- |
| Register / Login                                           | Yes                                     | Yes   |
| Create tasks                                               | Yes (creator = self)                    | Yes   |
| View tasks                                                 | Own created, assigned, or unassigned    | All   |
| Update task title/description/status/priority of own tasks | Yes                                     | Any   |
| Drag-and-drop status change                                | Only on tasks they created/are assigned | Any   |
| Assign an unassigned task to self                          | Yes                                     | Yes   |
| Assign a task to someone else                              | **No**                                  | Yes   |
| Reassign an already-assigned task                          | **No**                                  | Yes   |
| Delete a task                                              | Only tasks they created                 | Any   |
| View all users (`/api/users`)                              | **No — 403**                            | Yes   |
| Register as admin                                          | **No — role is always forced to USER**  | N/A   |

All of the above is enforced **on the backend** in
`taskController.js`, `userController.js`, and the `authorizeRoles`
middleware — not just hidden in the UI. See "Testing the API" below
for proof.

## API Reference

Base URL: `http://localhost:5000/api`

Task priorities are `LOW`, `MEDIUM`, and `HIGH`. New tasks use `MEDIUM`
when no priority is provided.

### Auth

| Method | Endpoint         | Auth required | Description                        |
| ------ | ---------------- | ------------- | ---------------------------------- |
| POST   | `/auth/register` | No            | Register a new USER account        |
| POST   | `/auth/login`    | No            | Log in, returns `{ token, user }`  |
| GET    | `/auth/me`       | Yes           | Get the current authenticated user |

### Tasks

| Method | Endpoint            | Auth required | Description                                         |
| ------ | ------------------- | ------------- | --------------------------------------------------- |
| POST   | `/tasks`            | Yes           | Create a task (creator = current user)              |
| GET    | `/tasks`            | Yes           | List tasks visible to the current user              |
| GET    | `/tasks/:id`        | Yes           | Get one task (must be authorized to view it)        |
| PUT    | `/tasks/:id`        | Yes           | Update title/description/status (ownership checked) |
| PATCH  | `/tasks/:id/status` | Yes           | Update status only (used by drag-and-drop)          |
| PATCH  | `/tasks/:id/assign` | Yes           | Assign/reassign (rules differ by role)              |
| DELETE | `/tasks/:id`        | Yes           | Delete a task (creator or admin only)               |

### Users

| Method | Endpoint | Auth required | Description                       |
| ------ | -------- | ------------- | --------------------------------- |
| GET    | `/users` | Yes (ADMIN)   | List all users (safe fields only) |

All responses follow `{ success: boolean, ...data }` or
`{ success: false, message }` on error.

## Testing the API (Postman / curl)

Below are the key scenarios to verify, with expected results. Replace
`TOKEN` with the JWT returned from login.

### 1. Register a normal user

```
POST /api/auth/register
Body: { "name": "Alice", "email": "alice@example.com", "password": "password123" }
```

Expect `201` and `user.role === "USER"`.

Try adding `"role": "ADMIN"` to the body — it is ignored; the created
user still has `role: "USER"`.

### 2. Login

```
POST /api/auth/login
Body: { "email": "alice@example.com", "password": "password123" }
```

Expect `200` with `{ token, user }` and **no password field**.

### 3. Admin login

```
POST /api/auth/login
Body: { "email": "admin@example.com", "password": "<ADMIN_PASSWORD>" }
```

Expect `200`, `user.role === "ADMIN"`.

### 4. Unauthorized access (no token)

```
GET /api/tasks   (no Authorization header)
```

Expect `401 { success: false, message: "Authentication token is missing" }`.

### 5. Forbidden access (normal user hits admin route)

```
GET /api/users
Authorization: Bearer <alice's token>
```

Expect `403 { success: false, message: "You do not have permission to perform this action" }`.

### 6. Create a task

```
POST /api/tasks
Authorization: Bearer <alice's token>
Body: { "title": "Write report", "description": "Q3 report", "status": "TODO" }
```

Expect `201` with the task; `creator` is Alice, `assignedUser` is `null`.

### 7. Assign unassigned task to self

```
PATCH /api/tasks/:id/assign
Authorization: Bearer <alice's token>
Body: {}   (or { "userId": "<alice's own id>" })
```

Expect `200`, `assignedUser` now points to Alice.

### 8. Normal user attempts to assign task to someone else

```
PATCH /api/tasks/:id/assign
Authorization: Bearer <bob's token>
Body: { "userId": "<alice's id>" }
```

Expect `403 { success: false, message: "You are only allowed to assign this task to yourself" }`.

### 9. Admin assigns a task to any user

```
PATCH /api/tasks/:id/assign
Authorization: Bearer <admin's token>
Body: { "userId": "<bob's id>" }
```

Expect `200`, task reassigned to Bob regardless of current state.

### 10. Admin reassigns a task between users

Repeat step 9 with a different `userId` — admins can always change the
assignee.

### 11. Update task status (drag-and-drop simulation)

```
PATCH /api/tasks/:id/status
Authorization: Bearer <owner or admin token>
Body: { "status": "DOING" }
```

Expect `200` with updated `status`. Then `GET /api/tasks/:id` again
(or refresh the frontend) — the status is unchanged, proving it
persisted in MongoDB.

### 12. Invalid status value

```
PATCH /api/tasks/:id/status
Body: { "status": "IN_PROGRESS" }
```

Expect `400 { success: false, message: "Status must be one of: TODO, DOING, DONE" }`.

### 13. Task not found

```
GET /api/tasks/64f000000000000000000000
```

Expect `404 { success: false, message: "Task not found" }`.

## Manual Frontend Testing Checklist

1. **Landing page** (`/`) — Login and Register buttons visible.
2. **Register** — client-side validation (name length, email format,
   password length, confirm-password match); backend errors (e.g.
   duplicate email) surface in the UI.
3. **Login** — shows a loading state, displays error on wrong
   credentials, redirects to `/dashboard` on success.
4. **Dashboard** — three columns (To Do / Doing / Done) always
   visible; empty columns show an empty-state message.
5. **Create Task** — modal opens, new task appears in the correct
   column immediately (no manual refresh).
6. **Drag and drop** — drag a card between all three columns; refresh
   the page afterward and confirm the column is unchanged (state is
   read from MongoDB, not local-only state).
7. **Assign to me** — appears only on unassigned tasks for normal
   users; disappears once assigned.
8. **Admin → User Management** (`/admin/users`) — visible only to
   admins in the navbar; lists all users and all tasks with
   Assign/Reassign controls.
9. **Normal user visiting `/admin/users` directly** — redirected back
   to `/dashboard` (frontend guard), and the underlying `GET /api/users`
   call would also be rejected with `403` by the backend if attempted
   directly.
10. **Logout** — clears the stored token and redirects to `/login`.

## Security Notes

- Passwords are hashed with bcrypt (`bcryptjs`) before being stored;
  the password field is excluded from all query results by default
  (`select: false`) and from every API response.
- JWTs are signed with `JWT_SECRET` and verified on every protected
  request by `authenticateToken` middleware.
- Role checks (`authorizeRoles("ADMIN")`) and ownership checks are
  enforced in the controllers themselves — the frontend hiding a
  button is a UX convenience only, never the actual security boundary.
- Task assignment rules (self-assign only, no reassigning as a normal
  user) are validated server-side regardless of what the client sends.
- CORS is restricted to `FRONTEND_URL` from the backend `.env`.
- `.env` files are gitignored; only `.env.example` placeholders are
  committed.

## Deployment Notes

- **Backend:** Deployed on [Render](https://render.com) as a Node/Express
  web service.
- **Frontend:** Deployed on [Vercel](https://vercel.com) as a Next.js
  application. https://task-management-application-flame-nu.vercel.app/ 
- The deployed frontend uses the Render backend API URL through
  `NEXT_PUBLIC_API_URL`.
- Backend CORS is configured with the deployed Vercel URL through
  `FRONTEND_URL`.

## Screenshots

The following screenshots are included directly in this README:

### Landing Page

<img width="1920" height="991" alt="landing" src="https://github.com/user-attachments/assets/3456da05-cbbc-49bf-a142-4a4d8007bc90" />

### Login Page

<img width="1920" height="990" alt="login" src="https://github.com/user-attachments/assets/3c88f014-62ff-4369-b224-0154fb591367" />

### User Task Board

<img width="1920" height="987" alt="dashboard" src="https://github.com/user-attachments/assets/58d7f54b-2505-48de-97dd-9d7e2bdcad13" />

### Create Task 

<img width="1916" height="973" alt="Create Task" src="https://github.com/user-attachments/assets/ee00b551-6e92-4060-a4f9-3356964ad43d" />

### Admin Dashboard

<img width="1916" height="990" alt="admin-dashboard" src="https://github.com/user-attachments/assets/522dae2b-f4b3-40bd-bdd3-e04abf28edea" />

### Assign Task

<img width="1918" height="980" alt="assign-task" src="https://github.com/user-attachments/assets/c3b70bfa-d062-4aa4-ae02-90051aa13a9c" />

### Admin Users

<img width="1915" height="988" alt="admin-users" src="https://github.com/user-attachments/assets/9c31815d-8db0-4ea6-aada-dd61af78d1e2" />

### Admin Tasks

<img width="1920" height="989" alt="admin-tasks" src="https://github.com/user-attachments/assets/1af977b0-d683-41c1-8060-2474e1a86d40" />
