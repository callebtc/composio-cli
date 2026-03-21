---
name: composio-cli
description: Use the composio-cli in this repository whenever the user wants to operate connected Composio toolkits through a CLI instead of writing SDK code directly. Trigger this skill for email, calendar, docs, maps, drive, sheets, Slack, GitHub, Notion, Linear, Jira, HubSpot, Salesforce, Airtable, Asana, Trello, Discord, Twitter, WhatsApp, Stripe, Zendesk, Dropbox, Figma, YouTube, Spotify, Composio Search, and any other connected toolkit exposed by this CLI. If the user wants to read email, send email, inspect calendars, list events, search documents, query places, or execute any Composio action from the terminal, use this skill and call `node dist/cli.js ...`.
---

# composio-cli

Use this repository's CLI instead of hand-writing Composio SDK calls when the user wants to work with connected Composio toolkits from the terminal.

## When to use this

Use this skill when the user wants to:

- read, search, draft, or send Gmail messages
- inspect calendars, list events, or find free slots
- use Google Docs, Google Maps, Drive, Sheets, or other connected Google tools
- run Slack, GitHub, Notion, Linear, Jira, HubSpot, Salesforce, Airtable, Asana, Trello, Discord, Twitter, WhatsApp, Stripe, Zendesk, Dropbox, Figma, YouTube, Spotify, or Composio Search actions
- discover which Composio toolkits/actions are connected and available
- execute a Composio action from the CLI with flags or JSON input

## Core workflow

1. Make sure the CLI is built if needed.

```bash
pnpm build
```

2. Discover connected toolkits for the current API key.

```bash
node dist/cli.js --api-key "$COMPOSIO_API_KEY"
node dist/cli.js toolkits --api-key "$COMPOSIO_API_KEY"
node dist/cli.js connections --api-key "$COMPOSIO_API_KEY"
```

3. Inspect live actions for one toolkit.

```bash
node dist/cli.js <toolkit> actions --api-key "$COMPOSIO_API_KEY"
node dist/cli.js <toolkit> inspect <action> --api-key "$COMPOSIO_API_KEY"
```

4. Execute the action.

```bash
node dist/cli.js <toolkit> <action> --api-key "$COMPOSIO_API_KEY" --flag value
node dist/cli.js <toolkit> <action> --api-key "$COMPOSIO_API_KEY" --input '{"key":"value"}'
```

## Important behavior

- The CLI only shows toolkits with an active connected account for the effective user.
- Action lists are discovered live from Composio at runtime.
- Text mode hides low-signal metadata.
- Summary-capable read actions default to compact text output.
- Use `--json` for the full machine-readable payload.
- Use `--full` to bypass the compact summary in text mode.
- Use `--fields a,b` or `--ids-only` to reduce context further.

## Authentication

Use either:

- `--api-key <key>`
- `COMPOSIO_API_KEY`

If needed, target a specific Composio user with:

```bash
--user <id>
```

## Recommended command pattern

Prefer this sequence:

1. `toolkits`
2. `<toolkit> actions`
3. `<toolkit> inspect <action>`
4. `<toolkit> <action> ...`

This keeps the agent grounded in what is actually connected and avoids inventing unsupported action names.

## Examples

Read the latest 5 emails:

```bash
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5
```

Get the full JSON for those emails:

```bash
node dist/cli.js gmail fetch-emails --api-key "$COMPOSIO_API_KEY" --max-results 5 --json
```

List calendars:

```bash
node dist/cli.js google-calendar list-calendars --api-key "$COMPOSIO_API_KEY"
```

List upcoming calendar events:

```bash
node dist/cli.js google-calendar events-list --api-key "$COMPOSIO_API_KEY" --calendar-id primary
```

Search Google Docs actions:

```bash
node dist/cli.js google-docs actions --api-key "$COMPOSIO_API_KEY"
```

Inspect Google Maps actions:

```bash
node dist/cli.js google-maps actions --api-key "$COMPOSIO_API_KEY"
```

## Agent guidance

- Do not guess toolkit names or action names. Ask the CLI.
- Prefer `inspect` before execution if the action inputs are unclear.
- For large read operations, start with default summary output before escalating to `--json`.
- If the user asks for exact raw response fields, rerun with `--json`.
- If the user asks for one specific object after a summary list, use the relevant ID-based follow-up action.
