# Super Liga Node Backend

This folder contains a Node/TypeScript rewrite of the Spring Boot backend with the same route surface and response shapes.

## Run

```bash
cp .env.example .env
npm install
npm run build
npm start
```

## Dev

```bash
npm run dev
```

## Local DB via Docker

If your local MySQL credentials do not match the values in `.env`, start the bundled database container first:

```bash
docker compose up db -d
npm run dev
```

You can also start the full stack with Docker:

```bash
docker compose up --build
```

## Hostinger deployment

- This folder must be the deployed Node.js project root. If your Git repository also contains the Spring Boot app, deploy `node-backend/` separately or use a repo that contains only the Node project.
- Use a real MySQL database that Hostinger can reach. Do not point the deployed app at your local XAMPP database.
- Hostinger commonly uses `DB_USER` and `DB_NAME` for MySQL environment variables. This app accepts both:
  - `DB_USERNAME` or `DB_USER`
  - `DB_DATABASE` or `DB_NAME`
- Do not set conflicting values for both aliases. If you define both, they must match exactly or the app will fail fast.
- Keep `DB_HOST`/`DB_PORT`/`DB_PASSWORD` set to the production database values from hPanel.
- Set `CORS_ORIGIN` to your production frontend domain, or to a comma-separated list of allowed origins if needed.
- The backend also allows local loopback origins and the `www` / non-`www` variant of any configured origin to reduce Angular dev CORS issues.
- If you want Swagger to show the public API base URL explicitly, set `PUBLIC_URL` to your live domain, for example `https://superligasports.com`. Otherwise Swagger stays relative to the current host via `/`.
- Keep the `SUPERADMIN_*` variables in the deployment environment, because the app bootstraps the first super-admin user on startup.

## Hostinger auto-deploy steps

1. In Hostinger hPanel, open your website and choose `Add Website`.
2. Select `Node.js Apps`.
3. Choose `Import Git Repository`.
4. Authorize GitHub and select the repository that contains the Node app.
5. If the repository contains multiple projects, make sure the Node app root is the folder that contains `package.json`.
6. Set the framework to `Express.js`.
7. Use the Hostinger build/redeploy flow and keep the build command as `npm run build`.
8. Keep the start command as `npm start`.
9. Import your `.env` file or set the variables manually in Hostinger:
   - `PORT`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER` or `DB_USERNAME`
   - `DB_PASSWORD`
   - `DB_NAME` or `DB_DATABASE`
   - `JWT_SECRET`
   - `SUPERADMIN_EMAIL`
   - `SUPERADMIN_USERNAME`
   - `SUPERADMIN_PASSWORD`
   - `SUPERADMIN_FIRSTNAME`
   - `SUPERADMIN_LASTNAME`
   - `CORS_ORIGIN`
10. Redeploy.
11. Test `https://your-domain/health` or `https://your-domain/api-docs` after the deployment completes.

## Access note

- If you bought Hostinger managed Node.js hosting, you do not get full VPS/root access.
- Hostinger’s VPS plans give full root access and SSH access.
- Managed web/cloud Node.js hosting may allow limited SSH on some plans, but it is restricted to the home directory and is not the same as VPS access.

## Notes

- MySQL is the default database, matching the Spring project.
- Swagger UI is available at `/api-docs` on the deployed domain.
- Raw OpenAPI JSON is available at `/api-docs.json` on the deployed domain.
- The API paths mirror the Spring controllers:
  - `/auth/login`
  - `/api/public/*`
  - `/api/team/*`
  - `/api/admin/*`
  - `/api/super-admin/*`
  - `/api/standing`
- A super-admin user is bootstrapped from the `SUPERADMIN_*` env vars on startup.
