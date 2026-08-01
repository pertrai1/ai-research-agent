import type { ServerResponse } from 'node:http';

export function writeJson({
  response,
  status,
  body,
}: {
  response: ServerResponse;
  status: number;
  body: unknown;
}): void {
  if (response.headersSent) return;
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  response.end(payload);
}
