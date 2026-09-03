# VidyTube — Full-Stack YouTube-Style Video Platform

A complete video streaming web application: register/login with JWT, upload and watch
videos, like/comment/subscribe, playlists, watch history, trending, content-based
recommendations, and an admin dashboard with reporting/moderation.

## Tech stack

- **Frontend:** React 18, Vite, React Router, Axios
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT + bcrypt password hashing
- **Uploads:** Multer, stored locally under `server/uploads/` (structured so
  Cloudinary/S3 can be swapped in later by changing only `uploadMiddleware.js` and
  the URL fields on `Video`)

## Features

- Register → Login → protected Home (no access to the app without a JWT)
- YouTube-style dashboard: sidebar, category chips, search (real MongoDB `$text`
  search on title/description), video grid
- Upload page: video + thumbnail with type/size validation and an upload progress bar
- Watch page: HTML5 player, view counter, like/unlike (duplicate-proof), comments,
  subscribe/unsubscribe, share (copy link), report, save to playlist, related videos
- Profile/channel page: avatar, subscriber count, all of a user's uploaded videos
- Watch history: auto-tracked per view, de-duplicated (timestamp updates instead of
  new rows), with a "Clear history" action
- Playlists: create, add/remove videos, delete
- Trending page: `score = views*0.6 + likeCount*0.3 + recentness*0.1`
  (recentness decays linearly to 0 over 14 days)
- Recommendations: content-based — matches category and title-keyword overlap with
  your last 20 watched videos, falls back to most-popular videos if you have no
  history yet
- Admin dashboard: platform stats, user management (delete + cascade their videos),
  video moderation (remove), and report review/resolution
- Dark/light theme toggle in Settings

## Project structure

```
VidyTube/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/            # AppShell, Navbar, Sidebar, VideoCard,
│   │   │                          #   ProtectedRoute, AdminRoute
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                 # Register, Login, Home, UploadVideo, Watch,
│   │   │                          #   Profile, History, Playlists, Trending,
│   │   │                          #   Subscriptions, Settings, AdminDashboard
│   │   ├── services/               # api.js + one file per resource
│   │   ├── styles/global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html / package.json / vite.config.js
├── server/                        # Express backend
│   ├── config/db.js
│   ├── controllers/               # auth, video, user, history, playlist, admin
│   ├── middleware/                # authMiddleware, uploadMiddleware, errorMiddleware
│   ├── models/                    # User, Video, Comment, Subscription,
│   │                              #   WatchHistory, Playlist, Report
│   ├── routes/                    # one file per resource, mounted in server.js
│   ├── utils/generateToken.js, seed.js
│   ├── uploads/videos/, uploads/thumbnails/
│   ├── .env.example / package.json / server.js
├── .gitignore
└── README.md
```

## API reference

| Method | Endpoint                          | Access  | Description |
|--------|------------------------------------|---------|-------------|
| POST   | /api/auth/register                 | Public  | Create account |
| POST   | /api/auth/login                    | Public  | Get JWT |
| GET    | /api/auth/me                       | Private | Current user |
| GET    | /api/videos?category=&search=      | Public  | List/search videos |
| POST   | /api/videos                        | Private | Upload (multipart: video, thumbnail) |
| GET    | /api/videos/:id                    | Public  | Get video, increments views |
| DELETE | /api/videos/:id                    | Private | Delete (owner or admin) |
| POST   | /api/videos/:id/like                | Private | Toggle like |
| GET    | /api/videos/:id/comments            | Public  | List comments |
| POST   | /api/videos/:id/comments            | Private | Add comment |
| POST   | /api/videos/:id/report              | Private | Report video |
| GET    | /api/videos/trending/list           | Public  | Trending list |
| GET    | /api/videos/recommendations/list    | Private | Recommended list |
| GET    | /api/users/:id                     | Public  | Channel/profile |
| POST   | /api/users/:id/subscribe            | Private | Toggle subscribe |
| GET    | /api/users/subscriptions/mine       | Private | My subscriptions |
| GET    | /api/history                       | Private | Watch history |
| POST   | /api/history                       | Private | Record a watch |
| DELETE | /api/history                       | Private | Clear history |
| GET    | /api/playlists                     | Private | My playlists |
| POST   | /api/playlists                     | Private | Create playlist |
| GET    | /api/playlists/:id                 | Private | One playlist |
| PUT    | /api/playlists/:id                 | Private | Add/remove video, rename |
| DELETE | /api/playlists/:id                 | Private | Delete playlist |
| GET    | /api/admin/stats                   | Admin   | Platform stats |
| GET    | /api/admin/users                   | Admin   | All users |
| DELETE | /api/admin/users/:id                | Admin   | Delete user + their videos |
| GET    | /api/admin/videos                  | Admin   | All videos |
| DELETE | /api/admin/videos/:id               | Admin   | Remove video |
| GET    | /api/admin/reports                 | Admin   | All reports |
| PUT    | /api/admin/reports/:id              | Admin   | Mark resolved |

## Setup — Windows / VS Code (PowerShell)

### 1. Prerequisites
- [Node.js LTS](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running
  locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 2. Configure the backend
```powershell
cd server
copy .env.example .env
```
Edit `server\.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vidytube
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Install & run the backend
```powershell
cd server
npm install
npm run dev
```
Expected output: `MongoDB Connected: ...` then `VidyTube server running on
http://localhost:5000`.

### 4. (Optional) Seed demo data
```powershell
npm run seed
```
Creates an admin (`admin@vidytube.com`), two demo users, and demo video *metadata*.
Note: the seed script references placeholder file names
(`server/uploads/videos/sample-1.mp4` etc.) that don't exist by default — either drop
small sample files with those names into `server/uploads/videos` and
`server/uploads/thumbnails`, or just skip seeding and upload real videos through the
app's Upload page instead, which is the more realistic demo path.
**Change the demo password (`Password123`) before any real deployment.**

### 5. Install & run the frontend
Open a **second** terminal:
```powershell
cd client
npm install
npm run dev
```
Open **http://localhost:5173**.

### 6. Walkthrough
1. Register a new account → redirected to Login.
2. Log in → redirected to Home (protected; try opening `/home` logged out to confirm
   you're bounced to Login).
3. Click **Upload** in the sidebar, pick a small `.mp4` and an image thumbnail, fill
   in title/category, submit → redirected to the Watch page for your new video.
4. On the Watch page: like it, comment, save it to a new playlist, click Share.
5. Open the video in an incognito window under a second account and Subscribe.
6. Visit **Trending** and **History**.
7. Log in as `admin@vidytube.com` (if seeded) or promote a user to `role: "admin"`
   directly in MongoDB, then visit **Admin Dashboard** to see stats, manage users,
   moderate videos, and resolve reports.

## Notes / known limits (for your project report)

- File storage is local disk via Multer; `uploadMiddleware.js` and the `videoUrl`/
  `thumbnailUrl` fields are the only places that would need to change to swap in
  Cloudinary or S3.
- The recommendation and trending algorithms are intentionally simple (content-based
  scoring, not ML) per the spec — documented in code comments in
  `controllers/videoController.js`.
- Search uses MongoDB's `$text` index on `title`/`description` (see the video schema).
- This build has been syntax-checked file-by-file and the Express app boots cleanly
  with all routes mounted; the React client builds cleanly with `npm run build`. It
  has **not** been exercised against a live MongoDB instance end-to-end in this
  environment (no MongoDB available here) — test each flow against your own database
  and let me know if anything needs fixing.
