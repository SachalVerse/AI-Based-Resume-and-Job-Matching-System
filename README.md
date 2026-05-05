# CareerTrack AI | Full-Stack Job Matching System

An AI-driven recruitment platform built with **FastAPI** (Backend) and **Next.js** (Frontend).

## 💻 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SachalVerse/AI-Based-Resume-and-Job-Matching-System.git
cd "AI-Based Resume and Job Matching System"
```

### 2. Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file based on `.env.example` and add your keys.
6. Start the server: `python main.py`

### 3. Frontend Setup
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env.local` file based on `.env.example`.
4. Start the development server: `npm run dev`

---

## 🚀 Deployment Guide

### 1. GitHub Repository Setup
1. Create a new repository on GitHub.
2. Initialize git in this folder (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SachalVerse/AI-Based-Resume-and-Job-Matching-System.git
   git push -u origin main
   ```

### 2. Backend Deployment (e.g., Render / Railway)
- **Service Type**: Web Service
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Your Google AI Key
  - `MONGODB_URL`: Your MongoDB Atlas URI
  - `DB_NAME`: ai_job_matcher
  - `SECRET_KEY`: A secure random string
  - `CORS_ORIGINS`: Your frontend URL (e.g., `https://your-app.vercel.app`)

### 3. Frontend Deployment (e.g., Vercel)
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Your deployed backend URL
  - `NEXTAUTH_URL`: Your frontend URL
  - `NEXTAUTH_SECRET`: Same as backend SECRET_KEY
  - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
  - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Secret

## 🛠️ Tech Stack
- **AI**: Google Gemini 1.5 Flash
- **Backend**: FastAPI, MongoDB (Motor), Pydantic
- **Frontend**: Next.js 16 (App Router), TailwindCSS, Framer Motion
- **Auth**: NextAuth.js (Google OAuth)

## 🔒 Security Note
The `.gitignore` is already configured to exclude `.env` files. **Never** commit your API keys to GitHub. Always use the platform's Environment Variables settings.
