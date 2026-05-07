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

## Notes

- MySQL is the default database, matching the Spring project.
- Swagger UI is available at `http://localhost:3000/api-docs`.
- Raw OpenAPI JSON is available at `http://localhost:3000/api-docs.json`.
- The API paths mirror the Spring controllers:
  - `/auth/login`
  - `/api/public/*`
  - `/api/team/*`
  - `/api/admin/*`
  - `/api/super-admin/*`
  - `/api/standing`
- A super-admin user is bootstrapped from the `SUPERADMIN_*` env vars on startup.
