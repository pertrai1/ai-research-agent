# Manual Tavily connectivity check

Run this check only after `npm run build`, with a short-lived Tavily key supplied
by the shell or secret store. It is deliberately not part of `npm test`.

```sh
read -rs TAVILY_API_KEY
export TAVILY_API_KEY
node --input-type=module -e '
import { createTavilyTransport, createWebSearchTool } from "./dist/web-search.js";

const tool = createWebSearchTool({
  transport: createTavilyTransport({ apiKey: process.env.TAVILY_API_KEY }),
});
const result = await tool.execute({ query: "Tavily official documentation" });
if (!result.ok) process.exitCode = 1;
console.log(JSON.stringify({ ok: result.ok, resultCount: result.ok ? result.value.results.length : 0 }));
'
unset TAVILY_API_KEY
```

Expected output is `{"ok":true,"resultCount":<one-to-five>}`. Do not print
the key, authorization header, raw response, or complete search result payload
when recording evidence.

Status: passed on 2026-08-01 with an operator-supplied key. The sanitized
application check returned `ok: true` with five normalized results. The key was
loaded from the ignored local `.env` and was never printed or committed.
