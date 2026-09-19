import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { landRegistryService } from './blockchain/LandRegistryService.js';

const server = app.listen(config.port, async () => {
  logger.success(`🚀 Land Registry Backend API server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`API Base URL: http://localhost:${config.port}/api`);
  logger.info(`Frontend CORS Origin: ${config.frontendUrl}`);

  // Test blockchain provider connectivity
  try {
    const isChainAvailable = await landRegistryService.isAvailable();
    if (isChainAvailable) {
      logger.success(`🔗 Blockchain connection established at: ${config.blockchain.rpcUrl}`);
      logger.info(`Smart Contract Address: ${config.blockchain.contractAddress}`);
    } else {
      logger.warn(
        `⚠️ Blockchain RPC is currently unreachable at ${config.blockchain.rpcUrl}. Run 'npm run blockchain' to start local node.`
      );
    }
  } catch (err: any) {
    logger.warn(`Blockchain connectivity notice: ${err.message}`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
