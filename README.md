# composio-cli

Agent-first TypeScript CLI for Composio.

## What this CLI does

- Uses the Composio SDK directly.
- Reads the API key from `--api-key` or `COMPOSIO_API_KEY`.
- Exposes one top-level command per supported toolkit.
- Discovers the current action list for each toolkit from Composio at runtime, so it can support all current actions without hardcoding every slug.
- Uses `GET /api/v3/connected_accounts` to shrink the visible CLI surface to toolkits that actually have an active connected account.
- Disables toolkit commands when no active connected account exists for the effective user.
- Prints guide-style help inspired by `mcporter`.

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

# 5. Execute it with flags
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5

# 6. Execute it with JSON
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --input '{"query":"from:billing"}'
```

## Development

```bash
pnpm test
pnpm build
```

Optional live checks:

```bash
COMPOSIO_API_KEY=... COMPOSIO_LIVE_TESTS=1 pnpm test
```
