# Wearly Supabase connection

This source is configured for the Supabase project `Wearly-Fresh` (`gcjmvzabpqpryoeedwxc`).

## Client configuration

The Supabase URL and publishable key are configured as public client values in `src/lib/supabase.ts` and can be overridden with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase `service_role` or secret key in browser code or a `VITE_` variable.

## Authentication

The login screen now uses Supabase Auth email/password signup and login. Google OAuth is wired in the client but must be enabled in Supabase Dashboard > Authentication > Providers > Google, with the provider credentials and callback URL configured. Email confirmation behavior is controlled in Supabase Dashboard > Authentication > URL Configuration / Email settings. Add the deployed app URL and local development URL to the allowed redirect URLs.

## Data sync

`src/lib/wearly-cloud.ts` saves the existing Wearly Zustand snapshot to `public.wearly_user_data`. The table has RLS policies restricting every row to `auth.uid()`. The relational tables (`profiles`, `wardrobe_items`, `saved_looks`, `saved_look_items`, `outfit_logs`, `user_activity`, and community tables) remain available for the next phased migration from snapshot storage to normalized CRUD.

## Install and verify

Run `npm install`, then `npm run typecheck`, `npm run test`, and `npm run build`. The current environment could not complete npm installation, so a full build/typecheck has not been verified here.
