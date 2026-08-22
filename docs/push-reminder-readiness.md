# Optional Web Push reminder readiness

The feature is deliberately disabled unless every required server setting is present.

## Data boundary

- The local reminder and its note stay in the browser.
- When a user explicitly enables push, the server receives only the device push endpoint, public encryption keys, timezone, reminder ID, title, category, due date and lead days.
- The anonymous management token is stored only in that browser. The database stores its SHA-256 hash.
- Unsubscribing deletes the subscription and its reminders through `on delete cascade`.
- A push provider response of `404` or `410` also deletes the unreachable subscription and its reminders.

## Production setup

1. Apply `docs/push-reminder-storage.sql` to the private Neon database.
2. Run `npm run push:generate-secrets` once to create `.env.push.local`. The ignored file contains one VAPID key pair and a cron secret without printing them. Never reuse the private key in client code or chat.
3. Add these Vercel environment variables to Production and the intended Preview environment:
   - `PUSH_REMINDERS_ENABLED=true`
   - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`
   - `WEB_PUSH_PRIVATE_KEY`
   - `WEB_PUSH_SUBJECT=mailto:support@hojucompass.com`
   - `CRON_SECRET` with at least 16 random characters
4. Redeploy after adding the variables.
5. Enable push from an installed test device, confirm the welcome notification, add a temporary reminder and invoke the cron route with Vercel's bearer secret.
6. Unsubscribe and confirm that the device no longer has a Push subscription and the database row is deleted.

## Schedule

`vercel.json` calls `/api/cron/push-reminders` daily at `21:00 UTC`. This is approximately 7–8 am on Australia's east coast depending on daylight saving. Hobby plan cron timing is approximate, so the interface does not promise an exact delivery minute.

## Rollback

Set `PUSH_REMINDERS_ENABLED=false` and redeploy. Existing local reminders remain available. Do not drop the tables until active subscriptions have been given a reasonable notice and deletion path.
