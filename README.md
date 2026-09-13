# CivicPulse

**AI-Powered Civic Issue Intelligence & Resolution Platform**
*From Citizen Complaints to Smart Action.*

CivicPulse turns a citizen's report into a tracked, accountable civic work item. It classifies the issue, scores its priority, routes it to the right department, escalates it automatically if it's ignored, and lets the citizen verify that it was actually fixed — closing the loop that most complaint portals leave open.

Built by **Team Koder** — Bhavi Hude, Devendra Choudhary, Manish Parmar, Vedish Sharma
Samrat Ashok Technological Institute, Vidisha

---

## Why

Most civic complaint systems fail not because citizens don't report issues, but because:
- Reports are scattered across channels with no consolidation
- Duplicate reports of the same issue inflate the noise
- There's no data-driven way to decide what gets fixed first
- Citizens have no visibility into whether anything actually happened

CivicPulse addresses all four with one pipeline: **Report → Analyze → Prioritize → Assign → Resolve → Verify.**

## Core Features

- **AI Complaint Classification** — Google Gemini classifies each report into a category (Road, Water, Sanitation, Streetlight, Traffic, Other) and estimates severity, with a deterministic keyword-based fallback if the AI is unavailable or times out
- **Smart Priority Scoring** — combines severity, duplicate volume, and other signals into a single priority score (0–100) that drives the authority queue
- **Duplicate Detection** — groups repeated reports of the same real-world issue instead of counting them separately
- **Image Uploads** — citizens attach photos via Cloudinary-backed upload
- **Civic Hotspot Map** — visualizes issue density and severity geographically
- **Role-Based Authority Hierarchy** — field officers → sub-department officers → department heads → zone authorities → municipal admins, each scoped by department, sub-department, ward, and zone
- **Automatic SLA Escalation** — a background sweep checks for overdue issues every 5 minutes and escalates them up the assigned authority's reporting chain
- **Authority Verification Workflow** — non-citizen accounts require admin approval before gaining authority access
- **Citizen Resolution Verification** — citizens confirm or reopen an issue marked "Resolved," so status reflects reality, not just a department's claim
- **JWT Authentication** — secure, role-aware auth across citizen and authority flows

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| AI | Google Gemini (`@google/generative-ai`) |
| Image storage | Cloudinary |
| Auth | JWT + bcrypt |
| Maps | Leaflet |
| Deployment | Vercel (client) + Render (API) |

## Project Structure

```
CivicPulse/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Auth, Report, Dashboard, Queue, Feed, Tracking, Approvals, Insights, Command
│       ├── components/      # Map, Charts, IssueTable, FeedCard, Toast, etc.
│       ├── layout/
│       ├── overlays/
│       └── lib/
└── server/                  # Express API
    ├── models/              # Issue.js, User.js
    ├── routes/               # issues.js, user.js
    ├── services/            # aiService.js, cloudinaryService.js, escalation.js
    ├── middleware/          # auth.js
    ├── config/
    ├── data/                # seed.js
    └── tests/
```

## Getting Started

### Prerequisites
- Node.js 20+
- A MongoDB connection string (Atlas or local)
- A Google Gemini API key
- A Cloudinary account (cloud name, API key, API secret)

### Setup

1. Clone the repo and install everything:
   ```bash
   npm install
   npm run install:all
   ```
2. Copy `server/.env.example` to `server/.env` and fill in:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=your_gemini_model
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   JWT_SECRET=replace_with_a_long_random_string
   ClIENT_URL=http://localhost:5173
   ```
3. Seed demo data:
   ```bash
   npm run seed
   ```
4. Run both client and server together:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:5173`

## API Reference

**Issues**
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/issues` | Priority-sorted issue queue |
| GET | `/api/issues/stats` | Authority dashboard summary |
| POST | `/api/issues/upload` | Upload issue images (auth required) |
| POST | `/api/issues` | Create and AI-triage a new report (auth required) |
| PATCH | `/api/issues/:id` | Update operational status (auth required) |
| POST | `/api/issues/:id/verify` | Citizen confirms or reopens a resolved issue |

**Users**
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/signup` | Register a citizen or authority account |
| POST | `/api/users/login` | Authenticate and receive a JWT |
| GET | `/api/users/me` | Get the current authenticated user |
| GET | `/api/users/pending` | List authority accounts awaiting approval |
| POST | `/api/users/:id/approve` | Approve a pending authority account |
| POST | `/api/users/:id/reject` | Reject a pending authority account |

**Health**
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |

## Future Scope

- Elected Representative Dashboard — ward-wise complaint trends and resolution performance for MLAs/Corporators
- Data-driven resource planning using complaint density and frequency trends
- Citizen reputation/points system to reward accurate reporting and flag spam
- Predictive hotspot alerts ahead of recurring seasonal issues
- Multilingual and voice-based reporting for low-literacy users
- Integration APIs for existing municipal grievance systems

## License

Built for hackathon submission by Team Koder.
