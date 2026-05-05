# Veterinary Medicine Clinical Intelligence Platform

A high-performance medical preparation platform built with React, Vite, and Django.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Django + Django REST Framework (DRF)
- **Intelligence Layer**: Google Gemini API (Long-context medical document parsing)
- **Database**: PostgreSQL (Production) / SQLite (Development)

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables in `backend/.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   SECRET_KEY=your_django_secret_key
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env`:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```

## Key Features

- **Clinical Dataset Ingestion**: Bulk import medical documents (.docx) via Gemini AI.
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
