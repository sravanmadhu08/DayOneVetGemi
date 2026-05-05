# Veterinary Medicine Clinical Intelligence Platform

A high-performance medical preparation platform built with React, Vite, and Django.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Django + Django REST Framework (DRF)
- **Database**: PostgreSQL (Production) / SQLite (Development)

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies (Virtual Env recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
3. Set up environment variables in `backend/.env`:
   ```bash
   SECRET_KEY=your_django_secret_key
   ```
4. Run migrations:
   ```bash
   # The server.ts will attempt to run this automatically on startup
   python backend/manage.py migrate
   ```

### Application Setup

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```
2. Start the integrated dev server:
   ```bash
   npm run dev
   ```
   *This starts both the Django backend (port 8000) and the Vite frontend (port 3000) with an automated proxy.*

## Key Features

- **Adaptive Quiz Engine**: Personalized clinical scenario testing.
- **Neural Flashcards**: Spaced-repetition learning for medical facts.
- **Global Strategy Hub**: Centralized clinical guidelines and resources.
- **Subscription Lifecycle**: Backend-controlled pro access and synchronization.

## Verification

### Frontend
- Build: `npm run build`
- Typecheck: `npm run lint`

### Backend
- Tests: `python manage.py test`
