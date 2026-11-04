# Wearly account + onboarding update

## Included
- Better Auth sign-in enabled.
- Email/password registration and login, plus the pre-wired Google and X broker options.
- Account-scoped Wearly data in Postgres/PGLite via `wearly_user_data`.
- Server functions use `authMiddleware`; the user id comes only from the verified session.
- Cloud sync covers profile, wardrobe items (including compressed image data URLs), outfit logs, saved looks and posts.
- Returning accounts hydrate their own cloud data before the app is shown.
- Existing device-only data is never assigned automatically: first sign-in offers an explicit import-or-start-fresh choice.
- First-run feature tour before profile setup.
- Supplied Wearly logo assets used in the app, with a dark-mode legibility treatment.

## Storage notes
Wardrobe photos are currently compressed in the browser and stored inside the user's JSONB data record. This avoids requiring a paid third-party image host for the first version. It is suitable for a small early user base, but should later move to object storage with signed upload/download URLs as the wardrobe and user base grow.

## Known limitation
Password-reset email delivery is not configured because no mail provider or sending credentials were supplied. Do not show a fake "forgot password" success state. Add a verified email sender before enabling password-reset links.

## Verification
The sandbox did not have installed npm dependencies. An install attempt timed out, so a full Vite build/typecheck and live sign-in round-trip could not be completed here. Run the normal project build and verify account creation, logout/login, import choice, and data restoration before public release.
