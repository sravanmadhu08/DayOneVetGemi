# Deployment

This app has two production services:

- React/Vite frontend: built once with Vite and deployed from `dist/`.
- Django/DRF backend: run as a separate WSGI service with Gunicorn.

`server.ts` is for local development only. It starts Vite middleware and a local Django `runserver` on `127.0.0.1:8001`. Do not use it as the production web process.

## Local Development

From the repo root:

```bash
npm install
npm run dev
```

The dev server proxies `/api` to the local Django process that `server.ts` starts.

For backend-only local work:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
```

## Backend Production

Install dependencies and run the required Django setup before starting Gunicorn:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
```

Do not run `python manage.py runserver` in production.

Required backend environment variables:

```bash
DEBUG=False
SECRET_KEY=replace-with-a-long-random-secret-key
DATABASE_URL=postgres://user:password@db-host:5432/dayonevet
ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
```

Use PostgreSQL for production. `DATABASE_URL` is required when `DEBUG=False`.

Run the Django deployment checks:

```bash
cd backend
python manage.py check --deploy
```

## Frontend Production

Build the frontend from the repo root:

```bash
npm install
npm run build
```

Deploy the generated `dist/` directory as static files through a static host, CDN, reverse proxy, or platform static site service.

Required frontend environment variable:

```bash
VITE_API_BASE_URL=/api
```

Use `/api` when frontend and backend are on the same domain behind a reverse proxy. Use the full backend API origin for split deployments:

```bash
VITE_API_BASE_URL=https://api.example.com/api
```

## Same-Domain Deployment

Example:

- Frontend: `https://app.example.com`
- Backend API: `https://app.example.com/api`
- Django admin: `https://app.example.com/django-admin/`

Reverse proxy:

- Serve frontend `dist/` for normal browser routes.
- Proxy `/api/` to Gunicorn.
- Proxy `/django-admin/` to Gunicorn.
- Serve or proxy `/media/` if user uploads are stored locally.

Frontend:

```bash
VITE_API_BASE_URL=/api
```

Backend:

```bash
ALLOWED_HOSTS=app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
```

## Split Deployment

Example:

- Frontend: `https://app.example.com`
- Backend: `https://api.example.com`

Frontend:

```bash
VITE_API_BASE_URL=https://api.example.com/api
```

Backend:

```bash
ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
```

## Render/Railway Example

Backend service:

- Root directory: `backend`
- Build command: `python -m pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Release/predeploy command: `python manage.py migrate`
- Start command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
- Database: managed PostgreSQL, exposed as `DATABASE_URL`

Frontend static service:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` to `/api` for same-domain proxying or `https://api.example.com/api` for split hosting.

## VPS Example

1. Run Gunicorn under systemd from `backend/`.
2. Run `python manage.py migrate` during deploy.
3. Run `python manage.py collectstatic --noinput` during deploy.
4. Configure Nginx to serve `dist/` and proxy `/api/` plus `/django-admin/` to Gunicorn.
5. Use PostgreSQL and set all production environment variables in the service environment.

