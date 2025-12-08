import app from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const PORT = env.PORT;
const HOST = env.HOST;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start server - bind to HOST (default 0.0.0.0) to accept external connections
    const server = app.listen(PORT, HOST, () => {
      const baseUrl = env.NODE_ENV === 'production'
        ? 'https://decentralabs.tech'
        : `http://localhost:${PORT}`;

      logger.info(`
🚀 Server running on port ${PORT}
📝 API Docs: ${baseUrl}/docs
🏥 Health check: ${baseUrl}/health
🌍 Environment: ${env.NODE_ENV}
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, closing server gracefully...`);

      server.close(async () => {
        logger.info('Server closed');

        await prisma.$disconnect();
        logger.info('Database disconnected');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
