import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const { AppDataSource } = await import('./data-source');
  const { bootstrapSuperAdmin } = await import('./bootstrap/super-admin');
  const { createApp } = await import('./app');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await bootstrapSuperAdmin();

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