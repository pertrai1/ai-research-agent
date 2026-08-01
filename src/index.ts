import { loadEnvironment } from './environment.js';
import {
  createResearchHttpServer,
  createResearchExecutor,
  shutdownResearchHttpServer,
} from './http-service.js';
import {
  createPageReaderTool,
  createPageReaderTransport,
} from './page-reader.js';
import { createTavilyTransport, createWebSearchTool } from './web-search.js';

const environment = loadEnvironment(process.env);

if (!environment.ok) {
  console.error('Invalid environment configuration.', {
    fields: environment.error.fields,
  });
  process.exitCode = 1;
} else {
  const webSearch = createWebSearchTool({
    transport: createTavilyTransport({
      apiKey: environment.value.tavilyApiKey ?? '',
    }),
  });
  const readPage = createPageReaderTool({
    transport: createPageReaderTransport(),
  });
  const server = createResearchHttpServer({
    executor: createResearchExecutor({ webSearch, readPage }),
    ready: () =>
      environment.value.environment !== 'production' ||
      (environment.value.anthropicApiKey !== undefined &&
        environment.value.tavilyApiKey !== undefined),
  });

  server.listen(environment.value.port, () => {
    console.info('AI Research Agent service listening.', {
      port: environment.value.port,
    });
  });

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    await shutdownResearchHttpServer(server);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}
