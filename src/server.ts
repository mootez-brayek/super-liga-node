import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const { AppDataSource } = await import('./data-source');
  const { bootstrapSuperAdmin } = await import('./bootstrap/super-admin');
  const { createApp } = await import('./app');
  const { SeasonService } = await import('./services/SeasonService');

  const dbHost = process.env.DB_HOST ?? 'localhost';
  const dbPort = Number(process.env.DB_PORT ?? 3306);
  const dbUser = process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root';
  const dbName = process.env.DB_DATABASE ?? process.env.DB_NAME ?? 'super_liga';
  console.log(`Booting with DB host=${dbHost} port=${dbPort} user=${dbUser} database=${dbName}`);

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await bootstrapSuperAdmin();
  await new SeasonService().ensureActiveSeason();

  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';

  app.listen(port, host, () => {
    // keep startup output minimal but explicit
    console.log(`Node backend listening on ${host}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
