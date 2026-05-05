# Google Sign-In Setup

This app uses Google Identity Services in the React frontend and verifies Google ID tokens in Django before issuing the existing SimpleJWT tokens.

## Google Cloud Console

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs & Services > Credentials.
4. Create an OAuth Client ID.
5. Application type: Web application.
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5173`
   - your production frontend domain, for example `https://app.example.com`
7. If you later use redirect mode, add the matching redirect URI. For the current button/callback flow, Authorized JavaScript origins are the critical setting.

## Environment Variables

Frontend:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Backend:

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

The frontend sends the Google credential to Django. Django verifies the ID token against `GOOGLE_CLIENT_ID`, links or creates the Django user, and returns the same `access` and `refresh` token shape used by email/password login.

## Security Notes

- Do not trust a Google user ID sent directly by the browser.
- Only trust claims from a server-verified Google ID token.
- The stable Google account identifier is the verified `sub` claim.
- The backend requires a verified Google email before linking or creating a user.
