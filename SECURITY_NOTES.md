# Security Notes

## JWT Storage

The frontend currently stores JWT access and refresh tokens in `localStorage`.

This keeps the current app behavior simple and local development friendly, but it has an important production risk: if an attacker can run JavaScript in the page through an XSS bug, they can read tokens from `localStorage`.

Recommended public-production direction:

- Move authentication tokens to HttpOnly, Secure, SameSite cookies.
- Keep CSRF protection enabled for cookie-authenticated unsafe requests.
- Use short-lived access tokens and rotate refresh tokens.
- Continue enforcing all authorization decisions in Django/DRF, not only in React route guards.

## Production Settings

Production should use:

- `DEBUG=False`
- A strong `SECRET_KEY` from the environment
- Explicit `ALLOWED_HOSTS` with no wildcard
- HTTPS origins in `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- Secure cookies
- `SECURE_PROXY_SSL_HEADER` behind a trusted HTTPS proxy
- PostgreSQL via `DATABASE_URL`
- HSTS preload only after confirming every subdomain is HTTPS-ready
