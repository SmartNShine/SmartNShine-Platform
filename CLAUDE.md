# CLAUDE.md - SmartNShine ATS Resume Generator

## Project Overview

**SmartNShine** is a full-stack MERN application for AI-powered ATS resume building with an AI Interview practice feature. It uses Google Gemini and OpenAI for AI capabilities, with voice services powered by Whisper (STT) and Chatterbox (TTS).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 + TailwindCSS 3 |
| Backend | Node.js + Express 4 (ES modules) |
| Database | MongoDB Atlas + Mongoose 8 |
| AI | Google Gemini (`@google/generative-ai`), OpenAI GPT-4o |
| Auth | JWT + Passport.js (Google & GitHub OAuth) |
| Payments | Razorpay |
| Voice STT | Python Flask + OpenAI Whisper (port 5001) |
| Voice TTS | Python Flask + Chatterbox (port 5002) |
| Styling | TailwindCSS + Framer Motion |
| Editor | TipTap rich text editor |

## Directory Structure

```
ATS_RESUME_GENERATOR/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # Axios API clients (api.js, interview.api.js, etc.)
│   │   ├── components/        # UI components (admin/, auth/, common/, editor/, layout/, templates/)
│   │   ├── context/           # DarkModeContext, NavigationBlockerContext
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Route pages (AIInterview.jsx, Editor.jsx, etc.)
│   │   └── utils/             # Validation schemas
│   ├── .env                   # VITE_API_URL, VITE_SERVER_URL
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── config/                # multer.config.js, passport.config.js
│   ├── controllers/           # Route handlers (interview, resume, auth, ats, etc.)
│   ├── middleware/             # auth, rateLimiter, security, interview middleware
│   ├── models/                # Mongoose schemas (User, Resume, InterviewSession, etc.)
│   ├── routes/                # Express routes (interview, voice, resume, auth, etc.)
│   ├── services/              # Business logic (interview, chatterbox, gemini, openai, etc.)
│   ├── scripts/               # Admin scripts (createAdmin, syncTemplates, etc.)
│   ├── server.js              # Main entry point
│   └── .env                   # All server env vars
│
├── voice-service/             # Python Whisper STT microservice (port 5001)
│   ├── app.py                 # Flask app for transcription
│   ├── requirements.txt       # flask, flask-cors, openai-whisper
│   └── start.sh               # Startup script with venv
│
├── chatterbox-service/        # Python Chatterbox TTS microservice (port 5002)
│   ├── app.py                 # Flask app for speech synthesis
│   ├── requirements.txt
│   ├── Dockerfile
│   └── start.sh
│
└── package.json               # Root workspace (concurrently for dev)
```

## Running Locally

```bash
# Install all dependencies
npm run install-all

# Run client + server concurrently
npm run dev

# Client only (port 5173)
npm run client

# Server only (port 5000)
npm run server

# Voice STT service (port 5001) - requires Python 3.11+, FFmpeg
cd voice-service && bash start.sh

# Chatterbox TTS service (port 5002) - requires Python 3.11+
cd chatterbox-service && bash start.sh
```

## Environment Variables

### Server (.env)
- `PORT=5000` - Server port
- `MONGODB_URI` - MongoDB Atlas connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key (for interviews)
- `JWT_SECRET` - JWT signing secret
- `CLIENT_ORIGIN` - Frontend URL for CORS
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `SESSION_SECRET` - Passport session secret
- `VOICE_SERVICE_URL` / `ML_SERVICE_URL` - Whisper service URL (default: http://localhost:5001)
- `CHATTERBOX_SERVICE_URL` - Chatterbox TTS URL (default: http://localhost:5002)
- `EMAIL_USER`, `EMAIL_PASSWORD` - Nodemailer config

### Client (.env)
- `VITE_API_URL=http://localhost:5000/api` - Backend API base URL
- `VITE_SERVER_URL=http://localhost:5000` - Backend server URL (OAuth)
- `VITE_ADZUNA_APP_ID`, `VITE_ADZUNA_APP_KEY` - Job search API (optional)

## Key API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/*` | Register, login, OAuth, JWT |
| `/api/resume/*` | CRUD, upload, AI enhancement |
| `/api/ats/*` | ATS score analysis |
| `/api/interview/*` | AI interview sessions, answers, results |
| `/api/voice/*` | Voice health, transcription proxy, TTS synthesis |
| `/api/subscription/*` | Payment orders, verification, status |
| `/api/admin/*` | Admin panel operations (role-protected) |
| `/api/contact/*` | Contact form |
| `/api/feedback/*` | User feedback |

## AI Interview Architecture

### Flow
1. User configures interview (type, role, level, mode)
2. Backend creates `InterviewSession` in MongoDB
3. OpenAI GPT-4o generates questions (temperature 0.7)
4. For voice mode: Chatterbox TTS reads question, Whisper STT transcribes answer
5. GPT-4o evaluates each answer (5 dimensions: relevance, clarity, confidence, technical, role-fit)
6. After all questions: AI generates comprehensive report → `InterviewResult`

### Voice Pipeline (Priority Chain)
- **TTS**: Chatterbox (port 5002) → Browser Web Speech API fallback
- **STT**: Whisper (port 5001) via server proxy
- **ElevenLabs**: DISABLED (payment issues) - all endpoints return 503

### Key Files
- `client/src/pages/AIInterview.jsx` - Main interview UI (3300+ lines)
- `server/controllers/interview.controller.js` - Interview logic
- `server/services/interview.service.js` - AI prompts & evaluation
- `server/routes/voice.routes.js` - Voice endpoints
- `server/services/chatterbox.service.js` - Chatterbox TTS client

## Database Models

| Model | Purpose |
|-------|---------|
| `User` | Auth, profile, subscription status |
| `Resume` | Resume content, sections, template, parsed data |
| `InterviewSession` | Interview config, questions[], evaluations, status |
| `InterviewResult` | Final report, scores, recommendations |
| `Subscription` | Plan type, payment, expiration |
| `Template` | Resume template definitions |
| `AIUsage` | AI API usage tracking |
| `Feedback`, `Contact`, `AdminLog` | Supporting models |

## Current Branch: `main` (fresh upgrade baseline)

Repo cleared of legacy plans/docs. Product upgrade work starts from latest `main`
(includes TPO dashboard, interview, resume, portfolio). New plans live under `docs/`
only when actively needed.

## Code Conventions
- ES modules throughout (`import`/`export`, not `require`)
- React functional components with hooks
- TailwindCSS for styling (no CSS modules)
- Prettier for formatting (`.prettierrc` in client/)
- Express MVC + Service layer pattern
- JWT auth middleware on protected routes
- Rate limiting on all API routes

## Known Issues
- TTS: Sarvam (prod) → Chatterbox (local) → browser Web Speech fallback
- STT: Whisper local service (port 5001) via server proxy
- Interview: Sarvam STT skipped for answers > 28 s, so 2–3 min spoken answers fall back to OpenAI Whisper (see docs/interview-upgrade-plan.md Phase 5)
