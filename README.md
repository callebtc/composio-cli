# composio-cli

Agent-first TypeScript CLI for Composio.

## What this CLI does

- Supports two transports:
  - direct Composio SDK mode for regular Composio API keys
  - backend proxy MCP mode for Clawi-issued proxy tokens
- Reads the API key or proxy token from `--api-key` or `COMPOSIO_API_KEY`.
- Auto-selects proxy mode when `COMPOSIO_API_KEY` is a Clawi proxy token (`cmpx_...`).
- In proxy mode, uses `COMPOSIO_MCP_URL` when it is present, otherwise builds the backend MCP endpoint from `CLAWI_API_BASE` plus `CLAWI_DEPLOYMENT_ID` or `TENANT_ID`.
- Exposes one top-level command per supported toolkit.
- Discovers the current action list for each toolkit from Composio at runtime, so it can support all current actions without hardcoding every slug.
- Uses `GET /api/v3/connected_accounts` in direct mode, and MCP `tools/list` in proxy mode, to shrink the visible CLI surface to toolkits that are actually available.
- Disables toolkit commands when no active connected account exists for the effective user.
- Prints guide-style help inspired by `mcporter`.
- Hides low-signal metadata in text mode and keeps full fidelity in `--json`.
- Supports aliases and typo-tolerant action lookup, such as `list-events` for `events-list`.
- Defaults large read actions to compact summaries, with `--fields`, `--ids-only`, and `--full` controls.

## Quick start

```bash
pnpm install
pnpm build
node dist/cli.js
```

## Example flow

```bash
# 1. Pick a toolkit
node dist/cli.js --api-key "$COMPOSIO_API_KEY"

# 2. See the connected toolkit commands
node dist/cli.js toolkits --api-key "$COMPOSIO_API_KEY"

# 3. See every action for one connected toolkit
node dist/cli.js gmail actions --api-key "$COMPOSIO_API_KEY"

# 4. Inspect one action
node dist/cli.js gmail inspect fetch-emails --api-key "$COMPOSIO_API_KEY"

# 5. Show every optional input field if needed
node dist/cli.js gmail inspect fetch-emails --api-key "$COMPOSIO_API_KEY" --all-parameters

# 6. Execute it with flags
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5

# 7. Keep the summary, but trim it further for agents
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --fields subject,date

# 8. Return only IDs from a summary-capable action
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --ids-only

# 9. Ask for the full text payload instead of the default summary
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --full

# 10. Ask for the full JSON response
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --json

# 11. Execute it with JSON
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --input '{"query":"from:billing"}'
```

Large read commands default to a compact text summary. For example, Gmail `fetch-emails` shows the message ID, sender, subject, date, labels, and a preview capped at 100 characters.

Use these output modes on summary-capable actions:

- `--fields subject,date` to keep only the listed fields in text mode
- `--ids-only` to print only item identifiers
- `--full` to bypass the summary and print the full text payload
- `--json` to return the full machine-readable response

## Development

```bash
pnpm test
pnpm build
```

Optional live checks:

```bash
COMPOSIO_API_KEY=... COMPOSIO_LIVE_TESTS=1 pnpm test
```

Proxy-mode live checks from an agent-like environment:

```bash
COMPOSIO_API_KEY=cmpx_... \
COMPOSIO_MCP_URL=https://api.clawi.ai/api/deployments/<deployment-id>/composio/mcp \
CLAWI_API_BASE=https://api.clawi.ai \
CLAWI_DEPLOYMENT_ID=<deployment-id> \
COMPOSIO_LIVE_TESTS=1 \
pnpm test
```
