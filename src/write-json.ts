import type { ServerResponse } from 'node:http';

export function writeJson({
  response,
  status,
  body,
  headers,
}: {
  response: ServerResponse;
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}): void {
  if (response.headersSent) return;
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    ...headers,
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  response.end(payload);
}
