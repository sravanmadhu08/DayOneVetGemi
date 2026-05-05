# Veterinary Learning App Backend (Django Migration)

This is the Django migration of the Veterinary Learning App backend.

## Structure
- `accounts/`: User profiles and authentication.
- `curriculum/`: Study modules and learning paths.
- `quizzes/`: Question pool and progress tracking.
- `flashcards/`: SRS based flashcard system.
- `library/`: PDF resources and guidelines.
- `ai_import/`: Gemini-powered automated content import.
- `subscriptions/`: Billing and user tiers.

## Getting Started Locally

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and configure accordingly.
   ```bash
   cp .env.example .env
   ```

3. **Migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Run Server:**
   ```bash
   python manage.py runserver
   ```

## API Documentation
- Health Check: `GET /api/health/`
- Admin Panel: `/admin/`
