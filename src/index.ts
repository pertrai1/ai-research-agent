import { loadEnvironment } from './environment.js';

const environment = loadEnvironment(process.env);

if (!environment.ok) {
  console.error('Invalid environment configuration.', {
    fields: environment.error.fields,
  });
  process.exitCode = 1;
} else {
  console.info('AI Research Agent foundation initialized.', {
    port: environment.value.port,
  });
}
